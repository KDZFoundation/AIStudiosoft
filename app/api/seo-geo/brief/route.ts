import { NextRequest, NextResponse } from 'next/server';
import { BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, type ValidationGate } from '@/data/marketing-plan';
import {
  buildBrandContextBlock,
  getCatalogPhotoCount,
  getPendingValidationGates,
} from '@/lib/brand-context';
import { formatGeminiError, generateWithGemini, generateWithGoogleSearch } from '@/lib/gemini';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';
import { HUMANIZER_EMBEDDED_DIRECTIVE, scanHumanizerTells } from '@/lib/humanizer';
import { MODULE3_BRIEF_PRESETS, Module3BriefGoal } from '@/lib/seo-geo';

interface BriefRequestBody {
  goal?: Module3BriefGoal;
  cepFocus?: string;
  extraNotes?: string;
  brandContext?: BrandContextData;
  validationGates?: ValidationGate[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BriefRequestBody;
    const goal = body.goal ?? 'sklep-bluf-faq';
    const preset =
      MODULE3_BRIEF_PRESETS.find((p) => p.id === goal) ?? MODULE3_BRIEF_PRESETS[0];
    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const cepFocus = (body.cepFocus ?? '').trim() || preset.defaultCep;
    const extraNotes = (body.extraNotes ?? '').trim();

    const gates =
      Array.isArray(body.validationGates) && body.validationGates.length > 0
        ? body.validationGates
        : DEFAULT_VALIDATION_GATES;
    const pendingGates = getPendingValidationGates(gates);
    const reviewsGatePassed =
      gates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';
    const photoCount = getCatalogPhotoCount();
    const brandBlock = buildBrandContextBlock(brand, { validationGates: gates });

    const systemInstruction = `Jesteś Głównym Architektem SEO, GEO (LLM Visibility) i Prawa E-commerce pracującym wyłącznie dla polskiej marki ${brand.companyName} (${brand.shopUrl}).

TWARDE REALIA OPERACYJNE WŁAŚCICIELA (KRYTYCZNE):
1. Brak bloga/CMS na domenie podrozowka.pl. NIE proponuj pisania „artykułów na bloga podrozowka.pl”. Całe on-page SEO/GEO musi zmieścić się na stronie głównej i w /sklep (BLUF, H1, FAQ, meta tagi, JSON-LD) albo jako wzmianki zewnętrzne (grupy, artykuły gościnne).
2. Dostęp do Google Search Console jest aktywny.
3. Budżet czasu właściciela: maksymalnie 6 godzin tygodniowo, więc rozwiązania muszą być proste i gotowe do wklejenia.
4. Startujemy z poziomu 0 zamówień, 0 relacji QR i 0 opinii klientów (nie zmyślaj recenzji, gwiazdek ani historii z drogi przed odbyciem planowanej wyprawy pod koniec stycznia 2027).
5. Brak systemu mailingowego w sklepie. NIE wymyślaj automatycznych sekwencji newsletterowych.
6. Wysyłka wyłącznie na terenie Polski (ORLEN Paczka i InPost, 2–3 dni robocze) dla Polaków lecących/jadących za granicę. W treściach dla klientów NIE podawaj cen wysyłki ani formatu i gramatury kartki.
7. Nazewnictwo ról: kupujący i wręczający to „Podróżnik”, osoba otrzymująca kartkę to „Obdarowany” (zero „odbiorca” i „nadawca”). Przód ma jedno z ${photoCount} zdjęć Polski i podziękowanie w języku kraju docelowego; rewers ma mapę, miejsce na wpis, kod QR i zachętę do skanowania w tym samym języku (QR łączy Podróżnika i Obdarowanego, nie pokazuje trasy).

FORMAT ODPOWIEDZI (po polsku, zwięzły Markdown gotowy do użycia):
- Dostarcz gotowe bloki do skopiowania i wklejenia dla wybranego celu (${preset.label}), bez lania wody.

${HUMANIZER_EMBEDDED_DIRECTIVE}

${brandBlock}`;

    const userPrompt = `Cel SEO / GEO / Prawo: ${preset.label} (${preset.description})
Główna intencja / CEP: ${cepFocus}
${extraNotes ? `Dodatkowy kontekst od właściciela: ${extraNotes}` : ''}

Przygotuj konkretny, gotowy do wdrożenia materiał w ramach 6 h/tydz. i bez własnego bloga na podrozowka.pl:
${
  goal === 'sklep-bluf-faq'
    ? `1) Nagłówek H1 + pierwszy akapit BLUF (maks. 80–100 słów) wyjaśniający odwróconą pocztówkę i zakup w Polsce przed wyjazdem; 2) 4 gotowe pytania i odpowiedzi FAQ do sekcji na /sklep (zbijające: min. 8 szt./39,92 zł bez rabatów, podziękowanie na przodzie w języku Obdarowanego i wybór języka w krajach wielojęzycznych, ${photoCount} gotowych kadrów bez uploadu, wysyłka w Polsce ORLEN Paczka i InPost bez podawania ceny wysyłki); 3) Krótka kontrola Omnibus (czego nie dopisywać przy 0 zamówień).`
    : goal === 'meta-tags-onpage'
      ? '1) Gotowe <title> (50–60 znaków) i <meta description> (140–155 znaków) osobno dla strony głównej (/) i sklepu (/sklep); 2) Proponowane H1 + podtytuł (Podróżnik i Obdarowany, bez cen wysyłki); 3) Lista 5 konkretnych rzeczy do sprawdzenia w Google Search Console po wklejeniu tagów.'
      : goal === 'external-outreach'
        ? '1) Wyszukaj w Google realne polskie artykuły/rankingi typu „co przywieźć z Polski / prezent z Polski dla znajomych z zagranicy” (podaj wyłącznie autentycznie znalezione adresy lub napisz jeśli brak konkretnego dopasowania); 2) Gotowy krótki e-mail / wiadomość do autora bloga z propozycją dopisania odwróconej pocztówki (bez spamu); 3) Gotowy 1-akapitowy opis Podróżówki do wklejenia na taki ranking z parametrami (4,99 zł, 8 szt., 105+ krajów, 89+ języków).'
        : '1) Gotowa merytoryczna odpowiedź pod pytanie na polskiej grupie wyjazdowej (Erasmus+ / Couchsurfing / podróże z bagażem podręcznym); 2) Wariant z linkiem UTM (podrozowka.pl/sklep?utm_source=facebook&utm_medium=organic&utm_campaign=...) i bez linku (gdy regulamin grupy zakazuje linków); 3) Wskazówka, na jakie zdjęcie fizycznej kartki w dłoni warto odpowiedzieć.'
}`;

    const result = preset.usesSearch
      ? await generateWithGoogleSearch({ systemInstruction, userPrompt })
      : await generateWithGemini({ systemInstruction, userPrompt });

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
      sources: result.sources,
      findings,
      humanizerFindings,
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
