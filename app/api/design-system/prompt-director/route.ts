import { NextRequest, NextResponse } from 'next/server';
import {
  BrandContextData,
  DEFAULT_BRAND_CONTEXT,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import {
  buildVerifiedBaselineDesignSystem,
  DesignSystemSnapshot,
  PromptDirectorWorkflow,
  TargetGenModel,
} from '@/lib/design-system';
import { formatGeminiError, generateWithGemini } from '@/lib/gemini';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';
import { HUMANIZER_EMBEDDED_DIRECTIVE, scanHumanizerTells } from '@/lib/humanizer';

interface PromptDirectorBody {
  workflow?: PromptDirectorWorkflow;
  targetModel?: TargetGenModel;
  aspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
  brief?: string;
  selectedCardId?: string;
  includeDeepeningQuestions?: boolean;
  headlineOverlay?: string;
  sublineOverlay?: string;
  brandContext?: BrandContextData;
  designSystem?: DesignSystemSnapshot;
}

const WORKFLOW_LABELS: Record<PromptDirectorWorkflow, string> = {
  'exploration-4up': 'Eksploracja 4-up (siatka 2×2 przed wyborem finału)',
  'final-image': 'Finalny Obraz (Hero / Social / Product Still)',
  'image-edit': 'Precyzyjna Edycja Referencji (Preserve / Change)',
  'video-reel': 'Krótka Rolka 9:16 / Spot 15s (Multi-Shot + Remotion Safe-Zone)',
};

const MODEL_GUIDELINES: Record<TargetGenModel, string> = {
  'chatgpt-image-2.5':
    'ChatGPT Image / GPT Image 2.5: najlepiej rozumie naturalny opis relacji przestrzennych, scenki z ludźmi, obsługę tekstu/ekspozycji produktu i szybkie warianty 2×2.',
  'nano-banana-2':
    'Google Nano Banana 2 (Gemini Image): świetny do spójności produktu z referencją (rewers QR / jeden z 10 kadrów), precyzyjnych edycji typu PRESERVE/CHANGE oraz szybkich iteracji 4K.',
  'kling-3.0':
    'Kling 3.0: najlepszy do spójnego wideo narracyjnego, naturalnego ruchu rąk wręczających pocztówkę oraz ujęć wielokadrowych (multi-shot) z wyraźnym START STATE → ACTION → END STATE.',
  'seedance-2.5-remotion':
    'Seedance 2.5 + Remotion: generuj surowy ruch bez wypalonych napisów AI w obrazie, a typografię Playfair Display / Inter i pasy safe-zone 9:16 nakładaj w montażu.',
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PromptDirectorBody;
    const workflow = body.workflow ?? 'exploration-4up';
    const targetModel = body.targetModel ?? 'chatgpt-image-2.5';
    const aspectRatio = body.aspectRatio ?? '4:5';
    const brief = (body.brief ?? '').trim();

    if (!brief) {
      return NextResponse.json(
        { error: 'Opisz krótki brief kreacji przed uruchomieniem Prompt Directora.' },
        { status: 400 }
      );
    }

    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const ds = body.designSystem ?? buildVerifiedBaselineDesignSystem();

    const selectedCatalogCard =
      PODROZOWKA_CATALOG.find((c) => c.id === body.selectedCardId) ?? null;

    const paletteSummary = ds.colorTokens
      .map((t) => `${t.token}: ${t.hex} (${t.role}, kontrast ${t.contrastOnCream ?? 'n/d'}:1)`)
      .join('\n');

    const typographySummary = ds.typography
      .map((t) => `${t.role}: ${t.family} (${t.weights}) [${t.status}]`)
      .join('\n');

    const photoCount = PODROZOWKA_CATALOG.length;

    const cardContext =
      body.selectedCardId === 'reverse-qr'
        ? 'Wybrana referencja produktu: REWERS fizycznej kartki Podróżówka (/images/rewers-podrozowka.png), czyli mapa, linie na odręczny wpis, zachęta do zeskanowania kodu w języku kraju docelowego oraz kod QR łączący Podróżnika z Obdarowanym.'
        : selectedCatalogCard
        ? `Wybrana referencja produktu z ${photoCount} stałych kadrów sklepu: "${selectedCatalogCard.sampleTitle}" (kategoria: ${selectedCatalogCard.category}), opis: ${selectedCatalogCard.description}. UWAGA: Przód (awers) zawiera fotografię Polski oraz napis z podziękowaniem w języku Obdarowanego.`
        : 'Tryb ogólny lifestyle wokół fizycznej odwróconej pocztówki Podróżówka.';

    const systemInstruction = `Jesteś „Prompt Directorem AI Gen v1.0” opartym na wiedzy ze szkolenia i pracującym wyłącznie dla marki podrozowka.pl.
Łączysz role Creative Directora, Reżysera filmowego/fotografa i Inżyniera Promptów AI.

TWOJE TWARDE ZASADY DESIGN SYSTEMU I MARKI (podrozowka.pl):
1. DANE PRAWDZIWE OFERTY: „Podróżówka. Odwrócona pocztówka z Polski”, stała cena 4,99 zł/szt., min. 8 sztuk (39,92 zł), bez progów rabatowych, 105+ krajów, 89+ języków, wysyłka w Polsce (ORLEN Paczka i InPost w 2–3 dni robocze), kanały 100% organiczne. W tekstach dla klientów (nagłówkach, podpisach postów) NIE podawaj cen wysyłki ani wymiarów/gramatury kartki. Nazwy ról: wyłącznie Podróżnik i Obdarowany (zero „odbiorca” i „nadawca”).
2. REGUŁA ZDJĘĆ (KRYTYCZNA): Aktualnie sklep ma ${photoCount} gotowych fotografii Polski w 5 kategoriach, z napisem z podziękowaniem na przodzie w języku kraju docelowego; rewers ma mapę, miejsce na wpis, zachętę do skanowania i kod QR łączący Podróżnika z Obdarowanym (QR nie pokazuje trasy). Klienci NIGDY nie wgrywają własnych zdjęć prywatnych ani nie wybierają dowolnego języka spoza kraju kartki (wybór tylko w krajach wielojęzycznych).
3. ANTYWZORCE ZAKAZANE: Nigdy nie porównuj do „wizytówek” ani „magnesów na lodówkę”. Unikaj frazesów „pasja”, „szyte na miarę”, „najwyższa jakość”, „dedykowane rozwiązania” oraz fikcyjnych rabatów ilościowych i wymyślonych opinii czy relacji z drogi (przed wyprawą w Europie i Afryce planowaną pod koniec stycznia 2027).
4. PALETA I TYPOGRAFIA DESIGN SYSTEMU [P]:
${paletteSummary}
${typographySummary}
Geometria: --radius 0.75rem (12px). Kontrast CTA: używaj polskiej czerwieni (#C52020) lub leśnej zieleni (#356E4D) na kremowym tle (#FCFBF7), nigdy jasnego tekstu na złocie (#D9A121).
5. ${cardContext}

STRUKTURA PROMPTÓW WG PROMPT DIRECTOR AI GEN v1.0:
- Gdy workflow = exploration-4up: Zaproponuj 1 zbiorczy prompt na **planszę 2×2 (4 wyraźnie różne kierunki wizualne: np. bagaż podręczny, spotkanie przy stole, detal awersu z podziękowaniem i rewersu QR, ujęcie POV wręczenia)** + rozpisz każdy z 4 wariantów i podaj krótkie objaśnienie art-directora, na co patrzeć przy wyborze.
- Gdy workflow = final-image: Zastosuj pełną architekturę bloków [GOAL] / [SUBJECT] / [ACTION] / [ENVIRONMENT] / [COMPOSITION & CAMERA] / [LIGHT] / [BRAND PALETTE & LOOK] / [LOCK / CONSTRAINTS] / [OUTPUT ${aspectRatio}]. Prompt do generatora napisz po ANGIELSKU (dla najwyższej precyzji modeli wizualnych), a kierunek kreatywny i uzasadnienie doboru modelu napisz po POLSKU.
- Gdy workflow = image-edit: Zastosuj rygor edycji [BASE REFERENCE] / [PRESERVE: zachować zdjęcie Polski i podziękowanie na przodzie lub układ rewersu QR] / [CHANGE: co dokładnie zmienić w świetle, dłoniach, stole, tle] / [DO NOT: zakaz zniekształcania kodu QR lub zmiany napisu na froncie] / [OUTPUT ${aspectRatio}].
- Gdy workflow = video-reel: Zaprojektuj sekwencję **4 ujęć (0–3s Hook, 3–7s Problem/Kontrast 100 ml, 7–11s Mechanizm Podróżówki, 11–15s Wręczenie + CTA)** w formacie [FORMAT ${aspectRatio}] / [START STATE] / [SUBJECT & OBSERVABLE ACTION VERBS] / [CAMERA] / [AUDIO / AMBIENCE] / [END STATE] / [CONTINUITY & LOCKS] / [AVOID: no AI-baked text overlays, subtitles added in post-production/Remotion safe-zone].

${HUMANIZER_EMBEDDED_DIRECTIVE}

FORMAT ODPOWIEDZI (po polsku, prompty techniczne dla generatora po angielsku):
1. **Kierunek kreatywny & Wybór narzędzia** (dlaczego ${MODEL_GUIDELINES[targetModel]} + alternatywa).
${
  body.includeDeepeningQuestions !== false
    ? '2. **Pytania pogłębiające art-directora (3 krótkie pytania przed finalizacją):** tylko konkretne decyzje wpływające na wynik.'
    : ''
}
3. **Gotowy Prompt Produkcyjny** (jasno wyodrębniony blok kodu, gotowy do wklejenia do wybranego generatora).
4. **Nakładki Design Systemu & Propozycja Tekstu Posta Organic (z UTM):** nagłówek w Playfair Display, podtytuł w Inter oraz krótki szkic posta FB/IG z \`utm_source=facebook&utm_medium=organic&utm_campaign=kreacja_wizualna\`.`;

    const userPrompt = `WYBRANY WORKFLOW: ${WORKFLOW_LABELS[workflow]}
DOCELOWY GENERATOR: ${MODEL_GUIDELINES[targetModel]}
FORMAT / PROPORCJE: ${aspectRatio}
PLANOWANY NAGŁÓWEK KARTY: ${body.headlineOverlay || '(dobierz zgodnie z Kartą Głosu)'}
PLANOWANY PODTYTUŁ KARTY: ${body.sublineOverlay || '(dobierz zgodnie z twardą ofertą 4,99 zł / min. 8 szt.)'}

BRIEF KREACJI:
${brief}`;

    const result = await generateWithGemini({
      systemInstruction,
      userPrompt,
    });

    const combinedTextToLint = [
      result.text,
      body.headlineOverlay || '',
      body.sublineOverlay || '',
    ].join('\n');
    const lintFindings = lintPodrozowkaCopy(combinedTextToLint);
    const humanizerFindings = scanHumanizerTells(combinedTextToLint);

    return NextResponse.json({
      ok: true,
      output: result.text,
      lintFindings,
      humanizerFindings,
      workflow,
      targetModel,
      aspectRatio,
      generatedAt: new Date().toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } catch (err: unknown) {
    const formatted = formatGeminiError(err);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
