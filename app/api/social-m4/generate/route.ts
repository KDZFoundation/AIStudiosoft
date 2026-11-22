import { NextRequest, NextResponse } from 'next/server';
import {
  BrandContextData,
  DEFAULT_BRAND_CONTEXT,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, type ValidationGate } from '@/data/marketing-plan';
import {
  buildBrandContextBlock,
  getCatalogPhotoCount,
  getPendingValidationGates,
} from '@/lib/brand-context';
import { formatGeminiError, generateWithGemini } from '@/lib/gemini';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';
import { HUMANIZER_EMBEDDED_DIRECTIVE, scanHumanizerTells } from '@/lib/humanizer';
import {
  buildModule4UtmUrl,
  PHYSICAL_SHOT_LIST,
  SOCIAL_SEGMENTS,
  SOCIAL_SEVEN_TYPES,
  SocialFormatMode,
  SocialPostTypeId,
  SocialSegmentId,
} from '@/lib/social-module4';

interface SocialM4GenerateBody {
  postTypeId?: SocialPostTypeId;
  segmentId?: SocialSegmentId;
  cardId?: string;
  shotId?: string;
  formatMode?: SocialFormatMode;
  extraNotes?: string;
  brandContext?: BrandContextData;
  validationGates?: ValidationGate[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SocialM4GenerateBody;
    const postType =
      SOCIAL_SEVEN_TYPES.find((t) => t.id === body.postTypeId) ?? SOCIAL_SEVEN_TYPES[0];
    const segment =
      SOCIAL_SEGMENTS.find((s) => s.id === body.segmentId) ?? SOCIAL_SEGMENTS[0];
    const card =
      PODROZOWKA_CATALOG.find((c) => c.id === body.cardId) ?? PODROZOWKA_CATALOG[0];
    const shot =
      PHYSICAL_SHOT_LIST.find((s) => s.id === body.shotId) ?? PHYSICAL_SHOT_LIST[0];
    const formatMode: SocialFormatMode = body.formatMode ?? 'reel-and-fb';
    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const extraNotes = (body.extraNotes ?? '').trim();

    const gates =
      Array.isArray(body.validationGates) && body.validationGates.length > 0
        ? body.validationGates
        : DEFAULT_VALIDATION_GATES;
    const pendingGates = getPendingValidationGates(gates);
    const reviewsGatePassed =
      gates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';
    const photoCount = getCatalogPhotoCount();

    const utmCampaign = `${postType.recommendedUtmCampaign}_${segment.id.replace('-', '_')}`;
    const utmContent = `${postType.recommendedUtmContent}_${shot.id}`;
    const fullUtmUrl = buildModule4UtmUrl(utmCampaign, utmContent);

    const brandBlock = buildBrandContextBlock(brand, { validationGates: gates });

    const systemInstruction = `Jesteś Architektem Organicznych Social Mediów pracującym wyłącznie dla polskiej marki ${brand.companyName} (${brand.shopUrl}).

TWARDE REALIA OPERACYJNE WŁAŚCICIELA:
1. Budżet czasu: 6 godzin tygodniowo, więc materiał musi być prosty do nagrania jednym smartfonem z fizycznych wydrukowanych kartek w ręku (ZERO kosztownych sesji ani grafik AI udających prawdziwe zdjęcia z zagranicy).
2. Stan startowy i Bramki Walidacji: 0 sprzedaży, 0 relacji przez QR, 0 opinii klientów. NIE wymyślaj cytatów klientów, historii z drogi ani liczb sprzedaży (zgodność z Dyrektywą Omnibus).
3. Wysyłka wyłącznie na terenie Polski: targetem są wyłącznie Polacy przed wyjazdem z Polski (wysyłka w Polsce: ORLEN Paczka i InPost, 2–3 dni robocze; w treściach dla klientów NIE podawaj cen wysyłki ani formatu i gramatury kartki).
4. Nazewnictwo ról: kupujący i wręczający to zawsze „Podróżnik”, osoba otrzymująca kartkę to zawsze „Obdarowany” (NIGDY nie używaj słów „odbiorca” ani „nadawca”).
5. Budowa kartki:
   - Przód (awers): fotografia Polski z biblioteki ${photoCount} wzorów w 5 kategoriach ORAZ napis z podziękowaniem w języku kraju docelowego.
   - Tył (rewers): mapa, miejsce na osobistą wiadomość, kod QR ORAZ zachęta do zeskanowania kodu w tym samym języku.
   - Kod QR: Obdarowany rejestruje kartkę na podrozowka.pl, co łączy Podróżnika i Obdarowanego (kod QR NIE pokazuje trasy podróżnika).
   - Język: wynika z kraju docelowego i jego języka; Podróżnik wybiera język wyłącznie w krajach wielojęzycznych.
6. Brak systemu mailingowego i brak bloga na domenie: cały ruch z posta/rolki ma trafiać prosto do /sklep z linkiem UTM albo zachęcać do komentarza w grupie FB.
7. ZAKAZ SŁÓW: „wizytówka”, „wizytówka podróżna”, „magnes”, „odbiorca”, „nadawca”, „z pasją”.

ZASADA JĘZYKOWA:
- Pisz po polsku konkretnie, żywo, bez korporacyjnej nowomowy. W pierwszym zdaniu zrób mocny „hook” oparty o prawdziwą sytuację wyjazdową.

${HUMANIZER_EMBEDDED_DIRECTIVE}

${brandBlock}`;

    const formatInstruction =
      formatMode === 'carousel-7'
        ? `KARUZELA 7 SLAJDÓW (FB / IG / TikTok Photo Mode). WYMAGANA STRUKTURA 7 SLAJDÓW + PODPIS POSTA + UTM:
   - **Slajd 1 (Okładka / Hook):** sytuacja przed wyjazdem (pakowanie bagażu podręcznego / spotkanie z gospodarzem, np. kłopot z 100 ml albo topiącymi się słodyczami).
   - **Slajd 2 (Problem i ból alternatyw):** alkohol nie wchodzi do bagażu podręcznego, słodycze znikają po chwili i nic po nich nie zostaje.
   - **Slajd 3 (Mechanizm odwróconej pocztówki):** z Polski wyjeżdża razem z Podróżnikiem; na przodzie jedno z ${photoCount} zdjęć Polski i podziękowanie w języku Obdarowanego.
   - **Slajd 4 (Rewers, kod QR i język):** z tyłu mapa, miejsce na kilka własnych słów, zachęta do skanowania oraz kod QR łączący Podróżnika i Obdarowanego po rejestracji kartki na podrozowka.pl (język wynika z kraju docelowego).
   - **Slajd 5 (Konkret oferty i logistyka w Polsce):** 4,99 zł za sztukę, minimum 8 kartek (39,92 zł) bez rabatów progowych, wysyłka w Polsce (ORLEN Paczka i InPost w 2–3 dni robocze). Bez cen wysyłki ani wymiarów/gramatury kartki w copy.
   - **Slajd 6 (Zapowiedź tripu po Europie i Afryce – koniec stycznia 2027):** obowiązkowy slajd o planowanej wyprawie samochodem przez Europę i Afrykę pod koniec stycznia 2027, podczas której Podróżówka ruszy w świat jako pierwsze źródło prawdziwych zdjęć i relacji z drogi. Oznacz wyraźnie jako [FAKT – plan] i NIE zmyślaj odbytych historii z tej trasy.
   - **Slajd 7 (CTA + Link UTM):** zaproszenie do wyboru krajów na ${fullUtmUrl} + krótka uwaga prawna Omnibus (zero zmyślonych recenzji przy niezaliczonych bramkach).
   Dodatkowo pod slajdami podaj: **Gotowy opis posta do karuzeli (z UTM)** oraz **Wersja komentarza na polską grupę FB**.`
        : formatMode === 'reel-and-fb'
          ? `Pełny pakiet: Scenopis Rolki 9:16 + Post na stronę FB + Wariant komentarza na polską grupę wyjazdową.
WYMAGANA STRUKTURA (zwięzły Markdown):
1. **Scenariusz nagrania telefonem (fizyczne kartki w dłoni, 15 sek.):** tabela lub lista z polami \`0–3s Hook\`, \`3–8s Problem/Wyjaśnienie\`, \`8–13s Obrót na rewers QR\`, \`13–15s CTA\` + krótkie napisy na ekran. Pamiętaj: awers ma zdjęcie Polski i podziękowanie w języku kraju docelowego; rewers ma mapę, miejsce na wpis, zachętę do skanu i QR łączący Podróżnika z Obdarowanym.
2. **Gotowy tekst posta na Facebooka (z linkiem UTM):** gotowy do przeklejenia do zakładki Facebook (Organic), bez zakazanych słów i bez cen wysyłki.
3. **Wersja pomocowa na grupę FB w Polsce (Erasmus / podróże):** krótki, ludzki ton bez linkowania na siłę.
4. **Kontrola prawna (Omnibus & AI Act):** 2 zdania potwierdzenia, czego NIE dopisywać przed zaliczeniem bramek walidacji.`
          : formatMode === 'fb-group-post'
            ? `Post na stronę FB + nienachalny wariant na polską grupę FB (bez spamu).
WYMAGANA STRUKTURA (zwięzły Markdown):
1. **Post na stronę Facebook (z linkiem UTM ${fullUtmUrl})**: gotowy tekst używający pojęć Podróżnik / Obdarowany.
2. **Wersja pomocowa na polską grupę FB**: naturalna odpowiedź do wątku bez nachalnej sprzedaży.
3. **Kontrola prawna (Omnibus) i lista kontrolna ujęcia smartfonem**.`
            : `Szczegółowy scenopis Rolki 9:16 ze smartfona (sekunda po sekundzie + napisy na ekran).
WYMAGANA STRUKTURA (zwięzły Markdown):
1. **Scenopis 9:16 (0–3s Hook, 3–8s Kontrast 100 ml, 8–13s Awers z podziękowaniem i obrót na Rewers QR, 13–15s CTA + UTM ${fullUtmUrl})**.
2. **Krótki opis rolki pod publikację + kontrola Omnibus**.`;

    const userPrompt = `Przygotuj gotowy materiał organiczny na social media:
- Typ posta (z Matrycy 7 Typów): #${postType.number} ${postType.name} (kąt: ${postType.angle})
- Segment docelowy (w Polsce przed wylotem): ${segment.label} (ból: ${segment.painPoint}; kontekst PL: ${segment.polishDepartureContext})
- Kadr fizycznej kartki w ręku: ${card.category} / „${card.sampleTitle}” (${card.description}; pamiętaj: przód zawiera fotografię Polski oraz napis z podziękowaniem w języku Obdarowanego)
- Ujęcie smartfonem z Shot Listy: ${shot.title} (${shot.whatToShow})
- Format docelowy: ${formatInstruction}
- Link UTM do wklejenia: ${fullUtmUrl}
${extraNotes ? `- Uwagi właściciela: ${extraNotes}` : ''}`;

    const result = await generateWithGemini({ systemInstruction, userPrompt });

    if (!result.text) {
      return NextResponse.json(
        { error: 'Model Gemini zwrócił pustą odpowiedź. Spróbuj ponownie.' },
        { status: 502 }
      );
    }

    let outputText = result.text.trim();
    if (
      pendingGates.length > 0 &&
      !/hipoteza\s*[–-]\s*czeka na walidację/i.test(outputText)
    ) {
      outputText = `**HIPOTEZA – czeka na walidację** (${pendingGates
        .map((g) => g.label)
        .join(', ')})\n\n${outputText}`;
    }

    const findings = lintPodrozowkaCopy(outputText, { reviewsGatePassed });
    const humanizerFindings = scanHumanizerTells(outputText);

    return NextResponse.json({
      text: outputText,
      findings,
      humanizerFindings,
      utmCampaign,
      utmContent,
      fullUtmUrl,
      pendingValidationGates: pendingGates.map((g) => g.label),
      generatedAt: new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
