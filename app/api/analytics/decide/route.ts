import { NextRequest, NextResponse } from 'next/server';
import { formatGeminiError, generateWithGemini } from '@/lib/gemini';
import { BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, type ValidationGate } from '@/data/marketing-plan';
import { buildBrandContextBlock } from '@/lib/brand-context';
import type { Module5AnalysisMode } from '@/lib/module5-analytics';
import { HUMANIZER_EMBEDDED_DIRECTIVE, scanHumanizerTells } from '@/lib/humanizer';

interface DecideRequestBody {
  mode?: Module5AnalysisMode;
  brandContext?: BrandContextData;
  validationGates?: ValidationGate[];
  ga4Summary?: string | null;
  totalSessions?: number | null;
  paymentReferrals?: string[];
  clarityAndGscNotes?: string;
  customQuestion?: string;
}

const MODE_INSTRUCTIONS: Record<Module5AnalysisMode, string> = {
  'three-sentence-diagnosis': `TRYB: REGUŁA 3 ZDAŃ (zasady-analizy.md Część A4 + GROWS ICE)
Struktura obowiązkowa (po polsku):
1. **Werdykt próbki & Alarmy higieny** (czy próbka >= 30 sesji; jeśli < 30 lub brak GA4 napisz wyraźnie [ZA MAŁO DANYCH] lub [BRAK DANYCH GA4]; wskaż ewentualne bramki płatności z A3).
2. **Reguła 3 zdań:**
   - **[POMIAR]:** dokładnie 1 zdanie z twardą liczbą wyłącznie z dostarczonych danych (albo [BRAK DANYCH] jeśli metryki nie podano).
   - **[KONTEKST]:** dokładnie 1 zdanie łączące pomiar z realiami podrozowka.pl (odwrócona pocztówka 4,99 zł/szt., min. 8 szt. = 39,92 zł, wysyłka w Polsce ORLEN Paczka i InPost w 2–3 dni, 0 zamówień i 0 relacji QR na starcie, przód z podziękowaniem w języku Obdarowanego, rewers z zachętą i kodem QR łączącym Podróżnika z Obdarowanym).
   - **[HIPOTEZA + ICE]:** dokładnie 1 zdanie w formacie „Jeśli zmienimy X, to wzrośnie Y, ponieważ Z” + wyliczenie ICE (Impact × Confidence × Ease w skali 1–10).
3. **2 konkretne akcje CRO / UTM na najbliższe 7 dni** (dopasowane do limitu 6 h/tydz. i braku bloga/systemu mailowego).`,

  'funnel-cro': `TRYB: DIAGNOZA LEJKA /sklep & CLARITY (CRO + B = MAP)
Struktura obowiązkowa (po polsku):
1. **Przegląd etapów lejka** (page_view → view_item → add_to_cart → begin_checkout → purchase; użyj wyłącznie dostarczonych liczb lub wpisz [BRAK DANYCH]).
2. **Główne wąskie gardło wg modelu BJ Fogga (Motivation, Ability, Prompt)** z uwzględnieniem obserwacji z Microsoft Clarity / GSC.
3. **2 hipotezy testowe (Before/After lub A/B)** z oceną ICE (I×C×E), kryterium wygranej oraz ostrzeżeniem o minimalnej liczbie sesji (>= 30).`,

  'segment-utm': `TRYB: PORÓWNANIE KANAŁÓW & UTM (ZWYCIĘZCY VS ODCIĘCIE)
Struktura obowiązkowa (po polsku):
1. **Czystość atrybucji (zasady-analizy.md A3 & A5):** czy wykryto bramki płatności (Przelewy24/PayU/Stripe/BLIK) oraz jak dużo sesji wpada w (direct)/(none).
2. **Ocena kanałów / kampanii UTM:** co przyciąga ruch zaangażowany i dodania 8 kartek do koszyka, a co marnuje czas z puli 6 h/tydz. (bez zmyślania stawek CPC/CPM ani budżetów reklamowych).
3. **Plan testów UTM na kolejny tydzień:** dokładna tabela 2–3 linków (utm_source, utm_medium, utm_campaign, utm_content) + hipoteza + ICE.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DecideRequestBody;
    const mode: Module5AnalysisMode =
      body.mode && body.mode in MODE_INSTRUCTIONS
        ? body.mode
        : 'three-sentence-diagnosis';
    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const gates =
      Array.isArray(body.validationGates) && body.validationGates.length > 0
        ? body.validationGates
        : DEFAULT_VALIDATION_GATES;
    const brandBlock = buildBrandContextBlock(brand, { validationGates: gates });
    const ga4Summary = body.ga4Summary?.trim() || '';
    const clarityNotes = body.clarityAndGscNotes?.trim() || '';
    const customQuestion = body.customQuestion?.trim() || '';
    const totalSessions =
      typeof body.totalSessions === 'number' && Number.isFinite(body.totalSessions)
        ? body.totalSessions
        : null;
    const paymentReferrals = Array.isArray(body.paymentReferrals)
      ? body.paymentReferrals.filter(Boolean)
      : [];

    if (!ga4Summary && !clarityNotes && !customQuestion) {
      return NextResponse.json(
        {
          error:
            'Podłącz raport GA4 albo wklej obserwacje z Microsoft Clarity / GSC / pytania analityczne, aby uruchomić Pętlę Decyzyjną.',
        },
        { status: 400 }
      );
    }

    const lowSampleFlag =
      totalSessions !== null && totalSessions < 30
        ? `UWAGA STATYSTYCZNA (zasady-analizy.md A2): Liczba sesji w raporcie wynosi ${totalSessions} (< 30). MUSISZ rozpocząć od oznaczenia [ZA MAŁO DANYCH: PONIŻEJ 30 SESJI] i traktować wnioski wyłącznie jako hipotezy kierunkowe.`
        : totalSessions === null
          ? 'UWAGA: Brak podpiętego raportu GA4 na żywo. Opierasz się wyłącznie na obserwacjach użytkownika (Clarity/GSC/notatki) i nie wolno Ci zmyślać liczb z GA4 (gdzie brakuje metryki, pisz [BRAK DANYCH GA4]).'
          : `Liczba sesji w raporcie GA4: ${totalSessions} (>= 30 sesji).`;

    const gatewayFlag =
      paymentReferrals.length > 0
        ? `ALARM A3 (BRAMKI PŁATNOŚCI): Wykryto odesłania z bramek (${paymentReferrals.join(', ')}). Koniecznie ostrzeż, że te sesje zrywają atrybucję źródła i wymagają wykluczenia w GA4.`
        : 'Brak wykrytych odesłań z bramek płatności w przekazanych źródłach (lub brak danych źródeł).';

    const systemInstruction = `Jesteś Analitykiem Konwersji (wg zasady-analizy.md) i Głównym Strategiem Wzrostu wyłącznie dla marki ${brand.companyName} (${brand.websiteUrl}).

KONTEKST MARKI I REALIA OPERACYJNE WŁAŚCICIELA:
- Oferta: ${brand.offerSummary}
- Zakazy twarde: ${brand.hardBans}
- Czego nigdy nie obiecujemy: ${brand.promisesNeverMade}
- Realia operacyjne: start z poziomu 0 zamówień i 0 relacji QR, wysyłka WYŁĄCZNIE na terenie Polski (ORLEN Paczka i InPost, 2–3 dni robocze; w tekstach dla klientów nie podajemy cen wysyłki ani formatu i gramatury kartki), brak bloga/CMS na domenie, brak systemu e-mail/newslettera w /sklep, budżet czasu 6 h/tydz., fizyczne kartki na stanie do nagrań telefonem.

ŻELAZNE ZASADY ANALIZY (zasady-analizy.md):
1. ZAKAZ HALUCYNACJI: Nie wolno wymyślać żadnej liczby, stawki, procentu ani cytatu. Używaj WYŁĄCZNIE danych zawartych w raporcie GA4 i notatkach użytkownika. Jeśli jakiejś metryki brakuje, pisz dosłownie [BRAK DANYCH].
2. PRÓG 30 SESJI (A2): ${lowSampleFlag}
3. BRAMKI PŁATNOŚCI (A3): ${gatewayFlag}
4. ZERO ZAKAZANYCH SŁÓW: Nigdy nie używaj słów „wizytówka”, „magnes”, „pasja”, „odbiorca”, „nadawca”. Nie proponuj kampanii płatnych (100% organic), automatów e-mailowych ani budowy bloga na domenie.
5. ${MODE_INSTRUCTIONS[mode]}

${HUMANIZER_EMBEDDED_DIRECTIVE}

${brandBlock}`;

    const userPrompt = [
      ga4Summary ? `DANE GA4 NA ŻYWO:\n${ga4Summary}` : 'DANE GA4 NA ŻYWO: [BRAK: użytkownik nie podłączył jeszcze OAuth GA4]',
      clarityNotes
        ? `\nOBSERWACJE Z MICROSOFT CLARITY / GSC / QR:\n${clarityNotes}`
        : '\nOBSERWACJE Z CLARITY / GSC: brak dodatkowych notatek.',
      customQuestion ? `\nDODATKOWE PYTANIE WŁAŚCICIELA:\n${customQuestion}` : '',
      '\nWygeneruj konkretną analizę i decyzję GROWS (ICE) gotową do wdrożenia w tym tygodniu.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await generateWithGemini({
      systemInstruction,
      userPrompt,
    });

    const humanizerFindings = scanHumanizerTells(result.text);

    return NextResponse.json({
      output: result.text,
      mode,
      lowSample: totalSessions !== null && totalSessions < 30,
      paymentReferrals,
      humanizerFindings,
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
