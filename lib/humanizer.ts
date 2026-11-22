export type HumanizerGroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type HumanizerToneId =
  | 'social-pl'
  | 'sklep-bluf'
  | 'group-reply'
  | 'outreach'
  | 'neutral';
export type HumanizerMode = 'pasted' | 'embedded';

export interface HumanizerPatternSpec {
  id: number;
  group: HumanizerGroupId;
  groupLabel: string;
  name: string;
  plName: string;
  strength: 'strong' | 'weak';
  summary: string;
  watchFor: string;
}

export interface HumanizerTellMatch {
  patternId: number;
  group: HumanizerGroupId;
  label: string;
  matchedText: string;
  strength: 'strong' | 'weak';
  advice: string;
}

export const HUMANIZER_GROUPS: Array<{ id: HumanizerGroupId; label: string }> = [
  { id: 'A', label: 'A. Teatr zamiast faktu (Staging)' },
  { id: 'B', label: 'B. Rytm z automatu (Rhythm)' },
  { id: 'C', label: 'C. Dmuchany autorytet (Inflation)' },
  { id: 'D', label: 'D. Formatowanie z szablonu (Formatting)' },
  { id: 'E', label: 'E. Resztki z czatu (Leftovers)' },
  { id: 'F', label: 'F. Zły odbiorca (Wrong reader)' },
];

export const HUMANIZER_TONES: Array<{
  id: HumanizerToneId;
  label: string;
  guidance: string;
}> = [
  {
    id: 'social-pl',
    label: 'Post FB / Rolka (PL)',
    guidance:
      'Krótko, konkretnie, po ludzku po polsku. Zaczynaj od żywej sytuacji wyjazdowej zamiast ogólników. Bez zbędnych emoji i bez wykrzykników sprzedażowych.',
  },
  {
    id: 'sklep-bluf',
    label: 'Sekcja /sklep BLUF',
    guidance:
      'Zasada BLUF (wniosek i konkret na początku): stała cena 4,99 zł/szt., min. 8 szt. (39,92 zł = 1 arkusz), 105+ krajów, 89+ języków, wysyłka w Polsce 2–3 dni (ORLEN Paczka i InPost — bez podawania kwot dostawy ani wymiarów/gramatury). Zero lania wody.',
  },
  {
    id: 'group-reply',
    label: 'Komentarz na grupę FB',
    guidance:
      'Naturalna odpowiedź jak od zwykłego podróżnika w wątku Erasmus/podróże. Nie powtarzaj pytania, daj konkret od razu, bez nachalnego tonu reklamy.',
  },
  {
    id: 'outreach',
    label: 'Wiadomość do blogera',
    guidance:
      'Krótka, rzeczowa wiadomość 1-na-1. Jedno jasne pytanie lub propozycja, bez korporacyjnych wstępów i fałszywego komplementowania.',
  },
  {
    id: 'neutral',
    label: 'Tekst neutralny / FAQ',
    guidance:
      'Prosty, precyzyjny język informacyjny lub instrukcja. Krótkie zdania w stronie czynnej, zachowaj wszystkie twarde liczby i fakty.',
  },
];

// Full 26 patterns from blader/humanizer SKILL.md mapped to PL & EN copywriting
export const HUMANIZER_PATTERNS: HumanizerPatternSpec[] = [
  {
    id: 1,
    group: 'A',
    groupLabel: 'Teatr zamiast faktu',
    name: 'Not X but Y',
    plName: 'Kontrast „nie X, lecz Y”',
    strength: 'strong',
    summary:
      'Model wymyśla zaprzeczenie, którego nikt nie głosił („To nie tylko pocztówka, to gest...”), żeby druga część brzmiała wzniośle.',
    watchFor: 'to nie X, to Y; nie tylko X, ale też Y; zamiast X wybierz Y; not X but Y',
  },
  {
    id: 2,
    group: 'A',
    groupLabel: 'Teatr zamiast faktu',
    name: 'One-line closers and dramatic fragments',
    plName: 'Jednozdaniowe puenty i dramatyczne strzępy',
    strength: 'strong',
    summary:
      'Osobny akapit z jednego zdania powtarzający to, co już napisano („I to właśnie robi różnicę.” / „Proste. Skuteczne.”).',
    watchFor: 'I to właśnie jest klucz; To ma znaczenie; Proste. Działa.; Let that sink in.',
  },
  {
    id: 3,
    group: 'A',
    groupLabel: 'Teatr zamiast faktu',
    name: 'Sayings that sound deep',
    plName: 'Pozornie głębokie aforyzmy',
    strength: 'strong',
    summary:
      'Zwykła myśl przebrana za uniwersalną prawdę („W swojej istocie najważniejsze jest...”, „X jest walutą zaufania”).',
    watchFor: 'w swojej istocie; co tak naprawdę ma znaczenie; serce problemu; X jest kluczem do Y',
  },
  {
    id: 4,
    group: 'A',
    groupLabel: 'Teatr zamiast faktu',
    name: 'Staging openers',
    plName: 'Zapowiedzi i teatralna szczerość',
    strength: 'strong',
    summary:
      'Rozbiegówka zapowiadająca punkt zamiast samego punktu („Zanurzmy się w...”, „Szczerze? Oto prawda...”).',
    watchFor: 'Zanurzmy się; Przyjrzyjmy się bliżej; Szczerze?; Najważniejsza część to',
  },
  {
    id: 5,
    group: 'A',
    groupLabel: 'Teatr zamiast faktu',
    name: 'Arguing with no one',
    plName: 'Polemika z wymyśloną obiekcją',
    strength: 'strong',
    summary:
      'Obrona lub odrzucenie rozwiązania, o które nikt nie pytał („Kuszącym rozwiązaniem byłoby..., ale...”).',
    watchFor: 'Nie mówię, że; Żeby była jasność; Ktoś mógłby powiedzieć; Kuszącym podejściem byłoby',
  },
  {
    id: 6,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Forced triads',
    plName: 'Wymuszone trójki pojęć',
    strength: 'weak',
    summary:
      'Zestawianie po 3 przymiotniki lub przykłady na siłę („szybkość, jakość i wygoda”), mimo że sens potrzebuje 1–2 konkretów.',
    watchFor: 'trzy równoległe rzeczowniki/przymiotniki w jednym rytmie bez dodatkowej treści',
  },
  {
    id: 7,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Repeated sentence openings',
    plName: 'Powtarzalne początki zdań',
    strength: 'weak',
    summary:
      'Kilka kolejnych zdań zaczyna się od tego samego podmiotu lub schematu.',
    watchFor: 'Powtarzające się „Podróżówka daje... Podróżówka mieści... Podróżówka pozwala...”',
  },
  {
    id: 8,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Dashes as the universal connector',
    plName: 'Nadużywanie myślników (— / –)',
    strength: 'weak',
    summary:
      'Model wstawia pauzy wszędzie zamiast wybrać kropkę, przecinek albo dwukropek.',
    watchFor: 'Gęste myślniki (—) i półpauzy (–) rozbijające każde drugie zdanie',
  },
  {
    id: 9,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Stacked qualifiers',
    plName: 'Piętrzenie zastrzeżeń',
    strength: 'weak',
    summary:
      'Słowa asekuracyjne ułożone jedno na drugim („być może potencjalnie mogłoby w pewnym stopniu...”).',
    watchFor: 'potencjalnie może; w pewnym sensie; prawdę mówiąc; można by argumentować',
  },
  {
    id: 10,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Hyphenated pairs everywhere',
    plName: 'Sztuczne zrosty z dywizem',
    strength: 'weak',
    summary:
      'Kopiowanie angielskich złożeń typu „wysokiej-jakości”, „długoterminowy-wpływ” w nieodpowiedniej pozycji.',
    watchFor: 'high-quality, well-documented, zrosty kalkowane z angielskiego',
  },
  {
    id: 11,
    group: 'B',
    groupLabel: 'Rytm z automatu',
    name: 'Passive voice and missing subjects',
    plName: 'Strona bierna ukrywająca sprawcę',
    strength: 'weak',
    summary:
      'Zdania bezosobowe tam, gdzie prościej nazwać Podróżnika, Obdarowanego albo działanie.',
    watchFor: 'zostało zaprojektowane, jest gwarantowane, rezultaty są osiągane',
  },
  {
    id: 12,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Overused AI words',
    plName: 'Przegrzane słowa AI (PL i EN)',
    strength: 'weak',
    summary:
      'Wyrazy, po których modele nadużywają ciężkiego stylu: kluczowy, kompleksowy, rewolucyjny, fundamentalny, bezprecedensowy, krajobraz, gobelin.',
    watchFor: 'kluczowy, kluczowe znaczenie, kompleksowy, rewolucyjny, zanurz się, delve, crucial, tapestry, robust',
  },
  {
    id: 13,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Significance claims and stock endings',
    plName: 'Nadymanie rangi i oklepane zakończenia',
    strength: 'weak',
    summary:
      'Puste podniosłe zakończenia o „świetlanej przyszłości” lub „kamieniu milowym w branży”.',
    watchFor: 'kamień milowy, punkt zwrotny, przyszłość rysuje się w jasnych barwach, kształtując rynek',
  },
  {
    id: 14,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Vague connection or association',
    plName: 'Ogólnikowe powiązania',
    strength: 'weak',
    summary:
      'Pisanie „powiązane z / w powiązaniu z” zamiast nazwania konkretnej relacji.',
    watchFor: 'powiązany z, w związku z inicjatywą, associated with',
  },
  {
    id: 15,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Shallow -ing phrases / imiesłowy',
    plName: 'Płytkie imiesłowy dopinające sens',
    strength: 'weak',
    summary:
      'Doklejone na końcu zdania „podkreślając znaczenie... / odzwierciedlając ducha... / gwarantując niezapomniane...”.',
    watchFor: 'podkreślając, odzwierciedlając, symbolizując, gwarantując, highlighting, showcasing',
  },
  {
    id: 16,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Sales language',
    plName: 'Folderowy język reklamowy',
    strength: 'weak',
    summary:
      'Puste przymiotniki jak z ulotki biura podróży zamiast rzeczowych cech produktu.',
    watchFor: 'zapierający dech, wyjątkowe doświadczenie, najwyższa jakość, z pasją, szyte na miarę, breathtaking, stunning',
  },
  {
    id: 17,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Borrowed authority',
    plName: 'Pożyczony autorytet bez źródła',
    strength: 'weak',
    summary:
      'Powoływanie się na „ekspertów”, „badania rynkowe” albo „tysiące klientów” bez podania konkretu.',
    watchFor: 'eksperci wskazują, badania pokazują, obserwatorzy rynku, tysiące podróżników',
  },
  {
    id: 18,
    group: 'C',
    groupLabel: 'Dmuchany autorytet',
    name: 'Avoiding is, are, and has',
    plName: 'Unikanie prostych słów „jest” i „ma”',
    strength: 'weak',
    summary:
      'Zastępowanie „ma/jest” ciężkim „pełni rolę / stanowi przykład / oferuje bogactwo”.',
    watchFor: 'pełni funkcję, stanowi unikalne połączenie, szczyci się, serves as, boasts',
  },
  {
    id: 19,
    group: 'D',
    groupLabel: 'Formatowanie z szablonu',
    name: 'Bold as decoration',
    plName: 'Wytłuszczenia i etykiety w każdym punkcie',
    strength: 'weak',
    summary:
      'Listy wypunktowane, gdzie każdy punkt ma wytłuszczoną etykietę z dwukropkiem bez potrzeby.',
    watchFor: '- **Zaleta:** ... - **Jakość:** ... - **Wygoda:** ...',
  },
  {
    id: 20,
    group: 'D',
    groupLabel: 'Formatowanie z szablonu',
    name: 'Decorative headings',
    plName: 'Ozdobne nagłówki z emoji i strzałkami',
    strength: 'weak',
    summary:
      'Nagłówki i wypunktowania obłożone rakietami 🚀, żarówkami 💡, strzałkami → lub liniami --- między akapitami.',
    watchFor: '🚀, 💡, ✨, 🔥 w nagłówkach oraz Title Case / --- co akapit',
  },
  {
    id: 21,
    group: 'D',
    groupLabel: 'Formatowanie z szablonu',
    name: 'Curly quotation marks',
    plName: 'Automatyczne cudzysłowy drukarskie vs proste',
    strength: 'weak',
    summary:
      'Mieszanie cudzysłowów w jednym dokumencie lub pozostawianie niekonsekwentnego zapisu.',
    watchFor: 'niespójne “...” w środku tekstu technicznego/prostego',
  },
  {
    id: 22,
    group: 'E',
    groupLabel: 'Resztki z czatu',
    name: 'Chatbot residue',
    plName: 'Wstawki asystenta („Mam nadzieję, że to pomoże!”)',
    strength: 'strong',
    summary:
      'Pozostawione powitania, pochwały pytania lub oferty dalszej pomocy ze standardowej rozmowy z chatbotem.',
    watchFor: 'Świetne pytanie!, Oczywiście!, Oto propozycja:, Mam nadzieję, że to pomoże, Daj znać jeśli...',
  },
  {
    id: 23,
    group: 'E',
    groupLabel: 'Resztki z czatu',
    name: 'Knowledge-limit disclaimers and guesses',
    plName: 'Zastrzeżenia o dacie wiedzy i zgadywanie',
    strength: 'strong',
    summary:
      'Wzmianki „według dostępnych danych do...” albo dopowiadanie „prawdopodobnie” zamiast powiedzenia wprost, że czegoś nie wiadomo.',
    watchFor: 'na stan mojej wiedzy, prawdopodobnie powstała, w dostępnych źródłach brak szczegółów',
  },
  {
    id: 24,
    group: 'E',
    groupLabel: 'Resztki z czatu',
    name: 'Heading repeated in the first sentence',
    plName: 'Powtórzenie nagłówka w pierwszym zdaniu',
    strength: 'weak',
    summary:
      'Nagłówek „## Szybka wysyłka”, a pod spodem jednozdaniowy akapit „Szybka wysyłka ma znaczenie.” przed właściwą treścią.',
    watchFor: 'Nagłówek i zaraz pod nim krótkie echo tego samego hasła',
  },
  {
    id: 25,
    group: 'E',
    groupLabel: 'Resztki z czatu',
    name: 'Writing about the document instead of its subject',
    plName: 'Meta-opis tekstu zamiast samego tematu',
    strength: 'weak',
    summary:
      'Opisywanie struktury („Poniższa tabela prezentuje...”, „Ten tekst został stworzony aby zastąpić...”) zamiast przejścia do konkretu.',
    watchFor: 'poniższa sekcja przedstawia, ten materiał opisuje, przygotowano na podstawie',
  },
  {
    id: 26,
    group: 'F',
    groupLabel: 'Zły odbiorca',
    name: 'Re-explaining what the reader knows',
    plName: 'Tłumaczenie kontekstu, który rozmówca zna',
    strength: 'strong',
    summary:
      'W odpowiedzi lub komentarzu powtarzanie całego problemu rozmówcy i chowanie konkretnej decyzji/linku na samym końcu.',
    watchFor: 'Długie streszczenie pytania odbiorcy zanim padnie właściwa odpowiedź',
  },
];

export const HUMANIZER_EMBEDDED_DIRECTIVE = `ZASADY STYLU „HUMANIZER” (wg blader/humanizer, BEZWZGLĘDNIE PRZESTRZEGAJ):
1. ZERO konstrukcji „nie X, lecz Y” / „to nie tylko A, to B” (§1): pisz wprost co produkt robi, bez wymyślania słomianych kontrastów.
2. ZERO dramatycznych puent z jednego zdania („I to robi różnicę.”, „Proste. Skuteczne.”) oraz zapowiedzi typu „Zanurzmy się / Szczerze?” (§2, §4).
3. OGRANICZ myślniki (— / –) (§8): łącz myśli kropką, przecinkiem lub dwukropkiem zamiast ciągłych pauz.
4. ZERO napompowanych słów AI i folderowych frazesów (§12, §16): zakazane słowa i zwroty to m.in. „kluczowy”, „kluczowe znaczenie”, „kompleksowy”, „rewolucyjny”, „najwyższa jakość”, „unikalne doświadczenie”, „szyte na miarę”, „z pasją”, „zapierający dech”, „podkreślając / odzwierciedlając ducha”.
5. ZERO ozdobnych emoji w nagłówkach/wypunktowaniach (🚀💡✨) (§20) oraz list, gdzie każdy punkt ma wytłuszczoną etykietę z dwukropkiem (§19) tam, gdzie lepiej brzmi zwykły akapit.
6. ZERO resztek z czatu (§22): nie zaczynaj od „Oczywiście!”, „Świetny pomysł!”, „Oto gotowy tekst:” i nie kończ „Mam nadzieję, że to pomoże!”.
7. ZACHOWAJ WSZYSTKIE TWARDE FAKTY MARKI: konkrety działają lepiej niż przymiotniki (4,99 zł/szt., pakiet min. 8 szt. = 39,92 zł, 105+ krajów, 89+ języków zależnie od kraju, wysyłka w Polsce ORLEN Paczka i InPost w 2–3 dni, przód ze zdjęciem Polski i napisem podziękowania, rewers z QR łączącym Podróżnika z Obdarowanym, brak uploadu klienta, zero cen wysyłki i zero wymiarów/gramatury w copy).`;

interface HeuristicDetector {
  patternId: number;
  group: HumanizerGroupId;
  label: string;
  strength: 'strong' | 'weak';
  regex: RegExp;
  advice: string;
  minCount?: number;
}

const HEURISTIC_DETECTORS: HeuristicDetector[] = [
  {
    patternId: 1,
    group: 'A',
    label: '§1 Kontrast „nie X, lecz Y”',
    strength: 'strong',
    regex:
      /\b(to nie (tylko )?[^.,;!\n]{2,40}[,;]\s*(to|lecz|ale)|nie (tylko|jedynie) [^.,;!\n]{2,40}[,;]\s*(ale|lecz)|not just [^.,;!\n]{2,40},\s*but)\b/gi,
    advice: 'Usuń zaprzeczoną połowę zdania i napisz wprost sam fakt.',
  },
  {
    patternId: 2,
    group: 'A',
    label: '§2 Dramatyczna puenta / strzęp',
    strength: 'strong',
    regex:
      /\b(i to właśnie (robi różnicę|jest klucz|ma znaczenie)|proste\.\s*skuteczne\.?|read that again|let that sink in|prawda jest taka[.,:])\b/gi,
    advice: 'Zastąp slogan konkretnym skutkiem albo wytnij ostatnie zdanie.',
  },
  {
    patternId: 3,
    group: 'A',
    label: '§3 Pozornie głęboki aforyzm',
    strength: 'strong',
    regex:
      /\b(w swojej istocie|co tak naprawdę ma znaczenie|prawdziwe pytanie brzmi|at its core|what really matters)\b/gi,
    advice: 'Przejdź od razu do konkretnej sytuacji z podróży zamiast filozofowania.',
  },
  {
    patternId: 4,
    group: 'A',
    label: '§4 Teatralna rozbiegówka',
    strength: 'strong',
    regex:
      /\b(zanurzmy się|przyjrzyjmy się bliżej|spójrzmy prawdzie w oczy|szczerze\?|let'?s dive into|here'?s what you need to know)\b/gi,
    advice: 'Wytnij zapowiedź i zacznij od razu od pierwszego zdania z treścią.',
  },
  {
    patternId: 8,
    group: 'B',
    label: '§8 Nadużycie myślników (— / –)',
    strength: 'weak',
    minCount: 2,
    regex: /(?:\s(?:—|–|--)\s|—)/g,
    advice: 'Zamień większość pauz na kropki, przecinki lub dwukropki.',
  },
  {
    patternId: 12,
    group: 'C',
    label: '§12 Przegrzane słowo AI',
    strength: 'weak',
    regex:
      /\b(kluczow\w*\s+(znaczeni\w*|rol\w*|element\w*)|kompleksow\w*|rewolucyjn\w*|fundamentaln\w*|bezprecedensow\w*|delve|crucial|tapestry|vibrant|pivotal)\b/gi,
    advice: 'Zastąp przymiotnik konkretnym faktem (np. 4,99 zł/szt., 8 kartek w pakiecie, 105+ krajów).',
  },
  {
    patternId: 15,
    group: 'C',
    label: '§15 Płytki imiesłów dopinający sens',
    strength: 'weak',
    regex:
      /\b(podkreślając|odzwierciedlając|symbolizując|gwarantując niezapomnian\w*|tworząc most między|highlighting|showcasing|underscoring)\b/gi,
    advice: 'Odetnij doklejony imiesłów i zostaw zwykły opis gestu.',
  },
  {
    patternId: 16,
    group: 'C',
    label: '§16 Folderowy żargon sprzedażowy',
    strength: 'weak',
    regex:
      /\b(zapierając\w* dech|najwyższ\w* jakość|unikaln\w* doświadczeni\w*|szyte na miarę|z pasją|niezwykła podróż|must-visit|breathtaking)\b/gi,
    advice: 'Wyrzuć ulotkowe przymiotniki; podaj wagę, cenę albo reakcję gospodarza.',
  },
  {
    patternId: 19,
    group: 'D',
    label: '§19 Lista z wytłuszczonymi etykietami',
    strength: 'weak',
    minCount: 2,
    regex: /^[-*]\s+\*\*[^*\n]{2,40}:\*\*/gm,
    advice: 'Zamień etykietową wyliczankę na 1–2 krótkie, naturalne zdania.',
  },
  {
    patternId: 20,
    group: 'D',
    label: '§20 Ozdobne emoji w nagłówkach / listach',
    strength: 'weak',
    regex: /^(?:#{1,3}\s*|[-*]\s*)[🚀💡✨🔥🌟🎯📌🌍]+/gm,
    advice: 'Usuń dekoracyjne ikony z początku nagłówków i wypunktowań.',
  },
  {
    patternId: 22,
    group: 'E',
    label: '§22 Resztki z czatu (chatbot residue)',
    strength: 'strong',
    regex:
      /\b(oczywiście[!.]|świetne pytanie[!.]|oto (gotowa )?propozycja[:!]|mam nadzieję, że (to )?pomoże|chętnie pomogę|daj znać,? jeśli|i hope this helps|certainly!)\b/gi,
    advice: 'Usuń powitanie lub uprzejmą końcówkę z czatu.',
  },
];

export function scanHumanizerTells(text: string = ''): HumanizerTellMatch[] {
  const source = (text ?? '').trim();
  if (!source) return [];

  const matches: HumanizerTellMatch[] = [];
  for (const detector of HEURISTIC_DETECTORS) {
    const found = Array.from(source.matchAll(detector.regex));
    if (found.length === 0) continue;
    if (detector.minCount && found.length < detector.minCount) continue;

    const preview =
      detector.minCount && detector.minCount > 1
        ? `${found.length}× („${found[0][0].trim()}”)`
        : found[0][0].trim();

    matches.push({
      patternId: detector.patternId,
      group: detector.group,
      label: detector.label,
      matchedText: preview,
      strength: detector.strength,
      advice: detector.advice,
    });
  }

  return matches.sort((a, b) => a.patternId - b.patternId);
}

export const HUMANIZER_SAMPLE_DRAFTS: Array<{
  id: string;
  label: string;
  tone: HumanizerToneId;
  text: string;
}> = [
  {
    id: 'sample-fb-slop',
    label: 'Post FB pełen AI-maniery (do wyczyszczenia)',
    tone: 'social-pl',
    text: `Oczywiście! Oto gotowy post na Facebooka dla Twojej marki!

🚀 **Nie tylko pocztówka — to prawdziwy most między kulturami!**

W dzisiejszym zabieganym świecie — kiedy liczy się każdy gram w bagażu podręcznym — klasyczne pamiątki odchodzą do lamusa. Podróżówka to nie zwykła wizytówka z podróży, lecz kluczowy towarzysz każdej wyprawy, stworzony z pasją dla wymagających odkrywców!

- **Najwyższa jakość:** Lekka pocztówka mieszcząca się przy paszporcie i gwarantująca niezapomniane wrażenia.
- **Praktyczność:** Zmieścisz 8 sztuk (39,92 zł za arkusz, czyli 4,99 zł/szt.) zamiast 100 ml płynu.
- **Globalny język:** Kod QR z podziękowaniem — podkreślając głęboką więź z gospodarzem w ponad 105 krajach.

Proste. Skuteczne. I to właśnie robi różnicę!

Mam nadzieję, że ten tekst pomoże Ci zwiększyć sprzedaż! Daj znać, jeśli chcesz więcej wariantów.`,
  },
  {
    id: 'sample-outreach-slop',
    label: 'Mail do blogera z AI-wstępem',
    tone: 'outreach',
    text: `Zanurzmy się w świat mądrych prezentów podróżniczych! W swojej istocie drobny upominek z Polski — wręczony gospodarzowi na Erasmusie czy Couchsurfingu — pełni rolę cichego ambasadora naszej kultury, odzwierciedlając polską gościnność w zupełnie nowy sposób.

Piszę w związku z Twoim kompleksowym rankingiem prezentów przed wyjazdem z Polski — chciałbym zaproponować unikalne rozwiązanie: Podróżówkę (min. 8 kartek w cenie 39,92 zł, wysyłka w Polsce ORLEN Paczką i InPost w 2–3 dni). Będę wdzięczny za odpowiedź!`,
  },
  {
    id: 'sample-group-slop',
    label: 'Komentarz na grupę FB (zbyt długi wstęp)',
    tone: 'group-reply',
    text: `Świetne pytanie! Wielu wyjeżdżających na Erasmusa zastanawia się nad tym samym — co zabrać w małym plecaku Ryanaira, żeby nie brać ciężkiego alkoholu ani kolejnego magnesu na lodówkę. Kuszącym podejściem byłoby kupienie słodyczy na lotnisku, ale w bagażu często się gniotą. Właśnie dlatego warto rozważyć odwróconą pocztówkę Podróżówka (8 kartek na jednym arkuszu za 39,92 zł, czyli 4,99 zł/szt., z podziękowaniem w języku kraju docelowego i kodem QR łączącym Podróżnika z Obdarowanym).`,
  },
];
