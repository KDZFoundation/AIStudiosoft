import { BrandContextData, DEFAULT_BRAND_CONTEXT, PODROZOWKA_CATALOG } from '@/data/podrozowka-kb';
import {
  DEFAULT_VALIDATION_GATES,
  type ValidationGate,
  type ValidationGateId,
} from '@/data/marketing-plan';

export interface BrandContextBlockOptions {
  validationGates?: ValidationGate[];
  requiredGateIds?: ValidationGateId[];
}

export function getCatalogPhotoCount(): number {
  return PODROZOWKA_CATALOG.length;
}

export function getPendingValidationGates(
  gates: ValidationGate[] | undefined,
  requiredGateIds?: ValidationGateId[]
): ValidationGate[] {
  const resolvedGates =
    Array.isArray(gates) && gates.length > 0 ? gates : DEFAULT_VALIDATION_GATES;
  return resolvedGates.filter((g) => {
    if (requiredGateIds && requiredGateIds.length > 0 && !requiredGateIds.includes(g.id)) {
      return false;
    }
    return g.status !== 'zaliczona';
  });
}

export function buildValidationGatesInstruction(
  gates: ValidationGate[] | undefined,
  requiredGateIds?: ValidationGateId[]
): string {
  const resolvedGates =
    Array.isArray(gates) && gates.length > 0 ? gates : DEFAULT_VALIDATION_GATES;
  const lines = resolvedGates.map((g) => {
    const meta = [g.status.toUpperCase()];
    if (g.date) meta.push(`data: ${g.date}`);
    if (g.note?.trim()) meta.push(`notatka: ${g.note.trim()}`);
    return `- ${g.label} (${g.stepsLabel}): ${meta.join(' · ')}`;
  });

  const pending = getPendingValidationGates(resolvedGates, requiredGateIds);
  const gateRule =
    pending.length > 0
      ? `WYMAGANE BRAMKI NIEZALICZONE (${pending.map((g) => g.label).join(', ')}): Rozpocznij odpowiedź od nagłówka „HIPOTEZA – czeka na walidację” i w żadnym miejscu nie zmyślaj opinii klientów, relacji QR ani zrealizowanej sprzedaży.`
      : 'Wszystkie wymagane bramki walidacji są zaliczone — pamiętaj, by przywoływać wyłącznie potwierdzone notatki/dane operatora.';

  return `=== BRAMKI WALIDACJI (PLAN 16-PKT) ===\n${lines.join('\n')}\n${gateRule}`;
}

export function buildBrandContextBlock(
  ctx: BrandContextData,
  options?: BrandContextBlockOptions
): string {
  const photoCount = getCatalogPhotoCount();
  const goodEx = (ctx.goodExamples?.length ? ctx.goodExamples : DEFAULT_BRAND_CONTEXT.goodExamples)
    .map((ex, i) => `  ${i + 1}. [DOBRY: konkret, zero lania wody] ${ex}`)
    .join('\n');
  const badEx = (ctx.badExamples?.length ? ctx.badExamples : DEFAULT_BRAND_CONTEXT.badExamples)
    .map((ex, i) => `  ${i + 1}. [ZŁY: antywzorzec / błędny fakt produktu] ${ex}`)
    .join('\n');
  const summary10 = (
    ctx.tenPointSummary?.length ? ctx.tenPointSummary : DEFAULT_BRAND_CONTEXT.tenPointSummary
  ).join('\n');

  const gatesBlock = buildValidationGatesInstruction(
    options?.validationGates,
    options?.requiredGateIds
  );

  const canonicalProductRules = [
    `=== TWARDE FAKTY PRODUKTU Z PREZENTACJI (AKTUALNE) ===`,
    `• Nazewnictwo ról: kupujący i wręczający to zawsze „Podróżnik”, osoba otrzymująca kartkę to zawsze „Obdarowany” (NIGDY nie używaj słów „odbiorca” ani „nadawca”).`,
    `• Przód (Awers): fotografia Polski z biblioteki (${photoCount} gotowych wzorów w 5 kategoriach: natura, architektura, sztuka, wydarzenia, postacie) ORAZ napis z podziękowaniem w języku kraju docelowego.`,
    `• Tył (Rewers): mapa, miejsce na osobistą wiadomość, kod QR ORAZ zachęta do zeskanowania kodu w tym samym języku.`,
    `• Język kartki: wynika z kraju docelowego kartki i jego języka (np. Włochy – włoski, Kenia – angielski). W krajach wielojęzycznych Podróżnik wybiera jeden z języków tego kraju (NIGDY dowolny wybór z listy 89+ języków).`,
    `• Zastosowanie kodu QR: Obdarowany rejestruje kartkę na podrozowka.pl, co łączy Podróżnika i Obdarowanego i podtrzymuje relację po spotkaniu. Kod QR NIE pokazuje trasy podróżnika.`,
    `• Zasięg i katalog: 105+ krajów, 89+ języków, ${photoCount} gotowych zdjęć w 5 kategoriach (zero wgrywania własnych zdjęć klienta).`,
    `• Oferta do komunikacji z klientami: 4,99 zł/szt., min. 8 szt. (39,92 zł), stała cena bez progów rabatowych, wysyłka w Polsce (ORLEN Paczka i InPost). W treściach dla klientów NIE podawaj cen wysyłki ani formatu i gramatury kartki.`,
    `• Status danych: wczesny etap — zero sprzedaży, zero relacji przez QR, zero opinii klientów ([BRAK DANYCH]), brak prawdziwych historii z drogi. [FAKT – plan]: wyjazd samochodem po Europie i Afryce pod koniec stycznia 2027 promujący podrozowka.pl jako pierwsze źródło prawdziwych zdjęć i historii.`,
  ].join('\n');

  return [
    `=== INSTRUKCJA NIESTANDARDOWA OPERATORA ===\n${
      ctx.operatorPreferences || DEFAULT_BRAND_CONTEXT.operatorPreferences
    }`,
    canonicalProductRules,
    gatesBlock,
    `=== MÓZG MARKI: ${ctx.companyName} (${ctx.websiteUrl}) ===`,
    `OPIS: ${ctx.elevatorPitch}`,
    `POZYCJONOWANIE: ${ctx.positioningStatement}`,
    `OFERTA I CENY:\n${ctx.offerSummary}`,
    `PRIORYTETY BIZNESOWE:\n${ctx.businessPriorities}`,
    `MODEL CHURN & LTV:\n${ctx.churnLtvModel || DEFAULT_BRAND_CONTEXT.churnLtvModel}`,
    `REGUŁY ZDJĘĆ (TERAZ — liczba w katalogu: ${photoCount}):\n${ctx.photoLibraryRuleNow}`,
    `REGUŁY ZDJĘĆ (PRZYSZŁOŚĆ):\n${ctx.photoLibraryRuleFuture}`,
    `GRUPY DOCELOWE:\n${ctx.personasSummary}`,
    `ANTY-PERSONA:\n${ctx.antiPersona}`,
    `MOMENTY WEJŚCIA (CEP):\n${ctx.categoryEntryPoints}`,
    `OPINIE I LUKI W DANYCH:\n${ctx.customerQuotesOrGaps}`,
    `STATUS WYPEŁNIENIA DANYCH:\n${
      ctx.completionStatusNotes || DEFAULT_BRAND_CONTEXT.completionStatusNotes
    }`,
    `PRZEWAGI KONKURENCYJNE:\n${ctx.competitiveAdvantages}`,
    `OBIETNICE KTÓRYCH NIE SKŁADAMY:\n${ctx.promisesNeverMade}`,
    `ALTERNATYWY RYNKOWE:\n${ctx.competitorsAndAlternatives}`,
    `TON GŁOSU:\n${ctx.toneOfVoice}`,
    `FRAZY MARKI:\n${ctx.characteristicPhrases}`,
    `DOBRE PRZYKŁADY (WZORUJ SIĘ NA TYM STYLU):\n${goodEx}`,
    `ZŁE PRZYKŁADY (TEGO BEZWZGLĘDNIE UNIKAJ):\n${badEx}`,
    `TWARDE ZAKAZY (ANTYWZORCE):\n${ctx.hardBans}`,
    `PODSUMOWANIE W 10 PUNKTACH:\n${summary10}`,
  ].join('\n\n');
}
