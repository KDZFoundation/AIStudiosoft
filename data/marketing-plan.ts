import type { WorkspaceTabId } from '@/components/OverviewPanel';
import { PODROZOWKA_CATALOG } from '@/data/podrozowka-kb';

export interface AppShortcut {
  tab: WorkspaceTabId;
  agentId?: string;
  label: string;
}

export interface MarketingPlanTask {
  id: string;
  stageId: string;
  title: string;
  details: string;
  tools: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
  isCustom?: boolean;
  shortcut?: AppShortcut;
}

export interface MarketingPlanStage {
  id: string;
  stepNumber: string;
  title: string;
  timeframe: string;
  framework: string;
  iceImpact: number;
  iceConfidence: number;
  iceEase: number;
  iceTotal: number;
  goal: string;
}

export interface DiagnosticQuestion {
  id: string;
  number: number;
  title: string;
  question: string;
  answer: string;
}

export interface MarketingKpiRow {
  phase: string;
  metric: string;
  targetDefinition: string;
  tool: string;
}

export type ValidationGateId = 'gate-first-sale' | 'gate-first-qr' | 'gate-first-reviews';
export type ValidationGateStatus = 'niezaliczona' | 'zaliczona';

export interface ValidationGate {
  id: ValidationGateId;
  label: string;
  stepsLabel: string;
  description: string;
  status: ValidationGateStatus;
  date?: string;
  note?: string;
}

export interface MarketingPlanState {
  version: number;
  updatedAt: string;
  stages: MarketingPlanStage[];
  tasks: MarketingPlanTask[];
  questions: DiagnosticQuestion[];
  kpis: MarketingKpiRow[];
  validationGates: ValidationGate[];
}

export const MARKETING_PLAN_STORAGE_KEY = 'podrozowka_marketing_plan_v1';

const PHOTO_COUNT = PODROZOWKA_CATALOG.length;

export const DEFAULT_VALIDATION_GATES: ValidationGate[] = [
  {
    id: 'gate-first-sale',
    label: 'Pierwsza sprzedaż',
    stepsLabel: 'Krok 0 i 2',
    description:
      'Pierwsze opłacone zamówienie pakietu min. 8 kartek (39,92 zł) potwierdzone w GA4 i sklepie.',
    status: 'niezaliczona',
    date: '',
    note: '',
  },
  {
    id: 'gate-first-qr',
    label: 'Pierwsza relacja przez QR',
    stepsLabel: 'Krok 4',
    description:
      'Obdarowany zeskanował kod QR z rewersu i zarejestrował kartkę na podrozowka.pl, łącząc się z Podróżnikiem.',
    status: 'niezaliczona',
    date: '',
    note: '',
  },
  {
    id: 'gate-first-reviews',
    label: 'Pierwsze opinie klientów',
    stepsLabel: 'Krok 3 i 4',
    description:
      'Zebrane autentyczne zdjęcia z wręczenia lub prawdziwe historie z drogi (np. ze styczniowej wyprawy 2027 po Europie i Afryce).',
    status: 'niezaliczona',
    date: '',
    note: '',
  },
];

export const DEFAULT_STAGES: MarketingPlanStage[] = [
  {
    id: 'stage-0',
    stepNumber: 'Krok 0',
    title: 'Fundament analityczny i techniczny (przed pierwszym postem)',
    timeframe: 'Dni 1–5',
    framework: 'GSC + GA4 + Clarity',
    iceImpact: 9,
    iceConfidence: 9,
    iceEase: 9,
    iceTotal: 729,
    goal: 'Zapewnić indeksację treści przez boty Google/AI oraz czysty pomiar zdarzeń koszyka w /sklep bez zakłamań z bramek płatności.',
  },
  {
    id: 'stage-1',
    stepNumber: 'Krok 1',
    title: 'Czytelność oferty w 5 sekund na stronie głównej i w /sklep',
    timeframe: 'Dni 4–10',
    framework: 'BLUF + BJ Fogg (B = MAP)',
    iceImpact: 9,
    iceConfidence: 8,
    iceEase: 8,
    iceTotal: 576,
    goal: 'Wyjaśnić w 5 sekund mechanizm odwróconej pocztówki: przód ze zdjęciem i napisem w języku kraju docelowego, tył z mapą, miejscem na wiadomość, QR i zachętą do rejestracji relacji Podróżnik–Obdarowany.',
  },
  {
    id: 'stage-2',
    stepNumber: 'Krok 2',
    title: 'Maszyna treści organicznych i równorzędne testy 4 segmentów',
    timeframe: 'Tydzień 2–8 (6 h/tydz.)',
    framework: 'STP + PAS / BAB + UTM',
    iceImpact: 8,
    iceConfidence: 8,
    iceEase: 8,
    iceTotal: 512,
    goal: 'Przy limicie 6 h/tydz. testować polskie grupy wyjazdowe i rolki z fizycznych kartek (wysyłka w Polsce ORLEN Paczką i InPost, bez cen wysyłki w komunikacji) z pomiarem UTM.',
  },
  {
    id: 'stage-3',
    stepNumber: 'Krok 3',
    title: 'Widoczność w Google (SEO) i LLM-ach (GEO) bez bloga + Prawo',
    timeframe: 'Tydzień 3–10',
    framework: 'BLUF na /sklep + JSON-LD + Omnibus',
    iceImpact: 8,
    iceConfidence: 8,
    iceEase: 7,
    iceTotal: 448,
    goal: 'Brak miejsca na bloga zastępujemy czytelnością strony głównej i /sklep (FAQ + JSON-LD Product/FAQPage), audytem w GSC oraz wzmiankami u blogerów podróżniczych.',
  },
  {
    id: 'stage-4',
    stepNumber: 'Krok 4',
    title: 'Pierwsze paczki testowe, wyprawa 2027 i walidacja w GA4',
    timeframe: 'Dni 30–90 + wyprawa 01.2027',
    framework: 'Triangulacja 3 źródeł (Mózg × Research × GA4)',
    iceImpact: 9,
    iceConfidence: 9,
    iceEase: 7,
    iceTotal: 567,
    goal: 'Wyjść ze stanu 0 zamówień i 0 relacji QR: zebrać pierwsze zdjęcia i relacje z paczek testowych oraz samochodowej wyprawy po Europie i Afryce (koniec stycznia 2027), potem odciąć najsłabsze komunikaty w GA4.',
  },
];

export const DEFAULT_TASKS: MarketingPlanTask[] = [
  {
    id: 'task-0-1',
    stageId: 'stage-0',
    title: 'Prześlij sitemap.xml w Google Search Console i sprawdź indeksację podstron',
    details:
      'Masz już dostęp do GSC: zweryfikuj w raporcie „Strony”, czy Google indeksuje stronę główną i /sklep bez błędów.',
    tools: 'Google Search Console',
    completed: false,
    shortcut: { tab: 'seo-geo', label: 'Otwórz Skaner SEO & GEO' },
  },
  {
    id: 'task-0-2',
    stageId: 'stage-0',
    title: 'Przetestuj renderowanie strony dla botów (czy widać cenę 4,99 zł i 8 szt. bez JS)',
    details:
      'Uruchom skan w zakładce SEO, GEO & Prawo oraz w GSC („Sprawdź adres URL → Testuj opublikowany URL”), aby wykluczyć pusty kontener JS i wychwycić słowa z Karty Głosu (np. „wizytówka”).',
    tools: 'Skaner SEO/GEO + Google Search Console',
    completed: false,
    shortcut: { tab: 'seo-geo', label: 'Skanuj podrozowka.pl' },
  },
  {
    id: 'task-0-3',
    stageId: 'stage-0',
    title: 'Dodaj domenę do Bing Webmaster Tools',
    details:
      'Darmowa rejestracja i mapa witryny pod widoczność w indeksie Bing, z którego korzysta Copilot i wyszukiwania AI.',
    tools: 'Bing Webmaster Tools',
    completed: false,
  },
  {
    id: 'task-0-4',
    stageId: 'stage-0',
    title: 'Zainstaluj Microsoft Clarity na stronie głównej i w /sklep',
    details:
      'Darmowe nagrania sesji i heatmapy pokażą po pierwszych wizytach, gdzie Podróżnicy zatrzymują się przy zestawie 8 kartek.',
    tools: 'Microsoft Clarity (skrypt bezpłatny)',
    completed: false,
  },
  {
    id: 'task-0-5',
    stageId: 'stage-0',
    title: 'Wyklucz bramki płatności w GA4 i potwierdź zdarzenia e-commerce',
    details:
      'Dodaj Przelewy24 / PayU / Stripe / BLIK do wykluczonych odesłań i sprawdź rejestrację view_item, add_to_cart (min. 39,92 zł), begin_checkout i purchase.',
    tools: 'Google Analytics 4 (podrozowka-production)',
    completed: false,
    shortcut: { tab: 'analytics', label: 'Otwórz Google Analytics' },
  },
  {
    id: 'task-1-1',
    stageId: 'stage-1',
    title: 'Przepisz sekcję Hero wg zasady BLUF / B = MAP (zrozumienie w 5 sekund)',
    details:
      'W pierwszym zdaniu wyjaśnij relację Podróżnik ↔ Obdarowany: Podróżnik kupuje przed wyjazdem w Polsce i wręcza kartkę za granicą z podziękowaniem na przodzie w języku kraju docelowego.',
    tools: 'Generator BLUF + Copywriter Głosu',
    completed: false,
    shortcut: {
      tab: 'seo-geo',
      label: 'Otwórz Generator SEO & BLUF',
    },
  },
  {
    id: 'task-1-2',
    stageId: 'stage-1',
    title: 'Zestaw obok siebie przód (zdjęcie + napis) i tył (mapa, wpis, QR + zachęta) z ceną',
    details:
      'Widoczny blok na /sklep: 4,99 zł/szt., min. 8 szt. (39,92 zł), 105+ krajów, 89+ języków (język wynika z kraju lub wyboru w kraju wielojęzycznym), wysyłka ORLEN Paczka i InPost.',
    tools: 'Design System + edytor /sklep',
    completed: false,
    shortcut: { tab: 'design', label: 'Otwórz Design System' },
  },
  {
    id: 'task-1-3',
    stageId: 'stage-1',
    title: 'Wklej na /sklep sekcję FAQ zbijającą 4 obiekcje (bez budowania bloga)',
    details: `Wykorzystaj gotowe FAQ ze skanera sklepu: dlaczego min. 8 kartek (39,92 zł), jak działa napis z przodu i QR do połączenia z Obdarowanym na podrozowka.pl, wybór spośród ${PHOTO_COUNT} wzorów w 5 kategoriach bez uploadu oraz wysyłka ORLEN Paczka / InPost.`,
    tools: 'Generator FAQ + Mózg Marki',
    completed: false,
    shortcut: { tab: 'seo-geo', label: 'Pobierz FAQ i JSON-LD' },
  },
  {
    id: 'task-1-4',
    stageId: 'stage-1',
    title: 'Włóż prostą karteczkę/notkę z prośbą o zdjęcie z wręczenia do każdej paczki',
    details:
      'Skoro system mailingowy nie działa i mamy limit 6 h/tydz., nie stawiamy teraz automatyzacji e-mail. Przy pierwszych paczkach prosimy Podróżnika o zdjęcie na dołączonej notatce lub przy ręcznym potwierdzeniu wysyłki.',
    tools: 'Własna notatka w paczce / ręczny kontakt',
    completed: false,
  },
  {
    id: 'task-2-1',
    stageId: 'stage-2',
    title: 'Nagraj telefonem 3 krótkie ujęcia fizycznych kartek w dłoni (zamiast stocków)',
    details:
      'Masz fizyczne kartki, więc w 1 godzinę nagraj: przód ze zdjęciem Polski i napisem podziękowania, obrót na tył z mapą, liniami, kodem QR i zachętą do skanowania oraz pakowanie 8 szt. do bagażu podręcznego.',
    tools: 'Shot List Social + Smartfon + CapCut',
    completed: false,
    shortcut: { tab: 'social-m4', label: 'Otwórz Shot List' },
  },
  {
    id: 'task-2-2',
    stageId: 'stage-2',
    title: 'Utrzymuj realistyczny rytm 6 h/tydz.: 1–2 posty FB + 1 rolka + grupy w Polsce',
    details:
      'Target wyłącznie dla osób wylatujących z Polski (Erasmus+, Couchsurfing, odwiedziny u znajomych/rodziny). Równe testy kątów: limit 100 ml vs 8 kartek, rejestracja QR Podróżnik–Obdarowany, zapowiedź wyprawy Europa–Afryka 2027.',
    tools: '7 Typów Postów + Facebook (Organic)',
    completed: false,
    shortcut: {
      tab: 'social-m4',
      label: 'Otwórz Social Media',
    },
  },
  {
    id: 'task-2-3',
    stageId: 'stage-2',
    title: 'Dodaj unikalny tag UTM segmentu do każdego linku prowadzącego do /sklep',
    details:
      'Używaj kreatora UTM (np. utm_campaign=erasmus_pl vs bagaz_100ml), aby w GA4 dokładnie rozdzielić, który komunikat daje dodania 8 kartek do koszyka.',
    tools: 'Zakładka Facebook (Organic) + GA4',
    completed: false,
    shortcut: { tab: 'facebook', label: 'Otwórz Facebook + UTM' },
  },
  {
    id: 'task-2-4',
    stageId: 'stage-2',
    title: 'Wyślij 3–5 darmowych paczek testowych w Polsce za prawdziwe zdjęcia z wręczenia',
    details:
      'Startujemy od 0 zamówień, więc wyślij ORLEN Paczką lub InPostem 3–5 zestawów (8 szt.) wyjeżdżającym z grup Erasmus+/Couchsurfing w zamian za szczere zdjęcie i zgodę na publikację (zgodnie z Omnibus).',
    tools: 'Grupy FB w Polsce + ORLEN Paczka / InPost',
    completed: false,
  },
  {
    id: 'task-3-1',
    stageId: 'stage-3',
    title: 'Wdróż Schema.org JSON-LD (Product + FAQPage) oraz sprawdź Bramkę Prawną',
    details:
      'Zamiast bloga wklej na /sklep kod JSON-LD ze skanera sklepu (cena 39,92 zł, 4,99 zł/szt., bez fałszywych gwiazdek aggregateRating wg Dyrektywy Omnibus).',
    tools: 'Generator JSON-LD + Bramka Prawna',
    completed: false,
    shortcut: {
      tab: 'seo-geo',
      label: 'Kopiuj JSON-LD',
    },
  },
  {
    id: 'task-3-2',
    stageId: 'stage-3',
    title: 'Zrób test 10 pytań GEO w ChatGPT/Perplexity i zdobądź wzmianki poza domeną',
    details:
      'Ponieważ nie ma bloga na podrozowka.pl, sprawdzaj w zakładce SEO & GEO które listy prezentowe są cytowane przez AI i wysyłaj autorom krótką notkę z linkiem UTM.',
    tools: 'Test 10 Pytań GEO + Google Search',
    completed: false,
    shortcut: {
      tab: 'seo-geo',
      label: 'Otwórz 10 Pytań GEO',
    },
  },
  {
    id: 'task-4-1',
    stageId: 'stage-4',
    title: 'Przeprowadź Triangulację 3 źródeł i zbierz realne dowody z wyprawy 01.2027',
    details:
      'Zestaw Mózg Marki × GA4 × Clarity; zbierz pierwsze zdjęcia z drogi podczas samochodowego tripu po Europie i Afryce (koniec stycznia 2027), rejestracje QR Podróżnik–Obdarowany oraz zalicz bramki walidacji.',
    tools: 'Google Analytics · Pętla Decyzyjna AI · Bank GROWS (ICE) + Clarity',
    completed: false,
    shortcut: {
      tab: 'analytics',
      label: 'Otwórz GA4 & Bank GROWS',
    },
  },
];

export const DEFAULT_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'q-1',
    number: 1,
    title: 'Zaplecze techniczne podrozowka.pl (blog, GSC, SSR)',
    question:
      'Czy na obecnej stronie masz już miejsce na publikację artykułów poradnikowych (blog/CMS) oraz dostęp do Google Search Console i wklejenia skryptu Microsoft Clarity? (Strona działa jako aplikacja JS: czy możesz dodać SSR/statyczne podstrony poradnikowe?)',
    answer: '',
  },
  {
    id: 'q-2',
    number: 2,
    title: 'Stan „zero” vs pierwsze testowe zamówienia',
    question:
      'Czy ktokolwiek kupił już lub otrzymał testowo pierwsze Podróżówki i masz z tego choćby 1–2 prawdziwe historie/zdjęcia wręczenia, czy startujemy w 100% od 0 zamówień do czasu pierwszych paczek testowych i wyprawy pod koniec stycznia 2027?',
    answer: '',
  },
  {
    id: 'q-3',
    number: 3,
    title: 'Zasoby czasowe i fizyczne kartki do nagrań',
    question:
      'Ile godzin tygodniowo masz na realizację planu i czy masz pod ręką fizyczne wydrukowane kartki, żeby nagrać telefonem proste ujęcia dłoni (przód z podziękowaniem, tył z QR i mapą) pod rolki 9:16?',
    answer: '',
  },
  {
    id: 'q-4',
    number: 4,
    title: 'System mailingowy i zbieranie zgód',
    question:
      'Czy w sklepie działa już jakieś narzędzie do maili (np. MailerLite, Brevo, własny system powiadomień po zakupie), w którym możemy ustawić zapis na powiadomienia przed kolejnym wyjazdem i prośbę o zdjęcie/opinię po dostawie?',
    answer: '',
  },
  {
    id: 'q-5',
    number: 5,
    title: 'Logistyka geograficzna na ten rok',
    question:
      'Czy w tym etapie sprzedajesz i wysyłasz wyłącznie na terenie Polski (ORLEN Paczka i InPost do Podróżników przed wylotem), czy obsługujesz też Polonię z wysyłką zagraniczną?',
    answer: '',
  },
];

export const DEFAULT_KPIS: MarketingKpiRow[] = [
  {
    phase: 'Tydzień 1–2 (Higiena)',
    metric: 'Indeksacja podrozowka.pl (bez bloga) + czystość GA4',
    targetDefinition:
      'Bot Google/AI widzi cenę 4,99 zł, FAQ i JSON-LD w HTML /sklep, bramki płatności są wykluczone w GA4, Clarity nagrywa sesje.',
    tool: 'Skaner SEO/GEO · GSC · GA4 · Clarity',
  },
  {
    phase: 'Dni 15–60 (6 h/tydz.)',
    metric: 'Wejścia do /sklep i add_to_cart z grup i rolek fizycznych kartek',
    targetDefinition:
      'Porównanie przejść do /sklep i dodań 8 szt. (39,92 zł) wg UTM dla Polaków wyjeżdżających na Erasmusa, Couchsurfing, do rodziny i w delegacje.',
    tool: 'GA4 · Facebook (UTM) · Nagrania telefonem',
  },
  {
    phase: 'Bramki 0 → 1 & Wyprawa 01.2027',
    metric: 'Zaliczona Pierwsza sprzedaż, Pierwsza relacja QR i Pierwsze opinie klientów',
    targetDefinition:
      'Pierwsze opłacone zakupy, pierwsze rejestracje QR przez Obdarowanych na podrozowka.pl oraz pierwsze prawdziwe zdjęcia z wyprawy po Europie i Afryce (koniec stycznia 2027).',
    tool: 'Baza QR podrozowka.pl · Wysyłka PL · Raporty GA4',
  },
  {
    phase: 'Dni 30–90 (GEO poza blogiem)',
    metric: 'Frazy CEP w GSC i wzmianki na listach cytowanych przez AI',
    targetDefinition:
      'Wyświetlenia /sklep na frazy prezentowe w GSC oraz pierwsze wzmianki na blogach/listach pojawiających się w 10-pytaniowym teście ChatGPT/Perplexity.',
    tool: 'Google Search Console · Test 10 Pytań GEO',
  },
];

export function createDefaultMarketingPlanState(): MarketingPlanState {
  return {
    version: 2,
    updatedAt: new Date().toISOString().slice(0, 10),
    stages: DEFAULT_STAGES,
    tasks: DEFAULT_TASKS,
    questions: DEFAULT_DIAGNOSTIC_QUESTIONS,
    kpis: DEFAULT_KPIS,
    validationGates: DEFAULT_VALIDATION_GATES.map((g) => ({ ...g })),
  };
}

export function mergeMarketingPlanState(
  partial?: Partial<MarketingPlanState> | null
): MarketingPlanState {
  const base = createDefaultMarketingPlanState();
  if (!partial) return base;

  const incomingTasks = Array.isArray(partial.tasks) ? partial.tasks : [];
  const incomingById = new Map(incomingTasks.map((t) => [t.id, t]));

  const mergedDefaultTasks = base.tasks.map((defTask) => {
    const saved = incomingById.get(defTask.id);
    if (!saved) return defTask;
    return {
      ...defTask,
      completed: Boolean(saved.completed),
      completedAt: saved.completedAt,
      note: saved.note ?? defTask.note,
    };
  });

  const customTasks = incomingTasks.filter(
    (t) => t.isCustom && !base.tasks.some((def) => def.id === t.id)
  );

  const incomingQuestions = Array.isArray(partial.questions) ? partial.questions : [];
  const qById = new Map(incomingQuestions.map((q) => [q.id, q]));
  const mergedQuestions = base.questions.map((q) => {
    const saved = qById.get(q.id);
    return saved ? { ...q, answer: saved.answer ?? '' } : q;
  });

  const incomingGates = Array.isArray(partial.validationGates) ? partial.validationGates : [];
  const gatesById = new Map(incomingGates.map((g) => [g.id, g]));
  const mergedGates = base.validationGates.map((defGate) => {
    const saved = gatesById.get(defGate.id);
    if (!saved) return defGate;
    return {
      ...defGate,
      status: saved.status === 'zaliczona' ? ('zaliczona' as const) : ('niezaliczona' as const),
      date: typeof saved.date === 'string' ? saved.date : defGate.date,
      note: typeof saved.note === 'string' ? saved.note : defGate.note,
    };
  });

  return {
    version: 2,
    updatedAt: partial.updatedAt || base.updatedAt,
    stages: base.stages,
    tasks: [...mergedDefaultTasks, ...customTasks],
    questions: mergedQuestions,
    kpis: base.kpis,
    validationGates: mergedGates,
  };
}

export function formatMarketingPlanMarkdown(state: MarketingPlanState): string {
  const doneCount = state.tasks.filter((t) => t.completed).length;
  const gates = state.validationGates ?? DEFAULT_VALIDATION_GATES;
  const passedGates = gates.filter((g) => g.status === 'zaliczona').length;

  const lines: string[] = [
    `# Plan Marketingowy 0 → 1 (podrozowka.pl)`,
    ``,
    `Postęp zadań: **${doneCount} / ${state.tasks.length} ukończonych** · Bramki walidacji: **${passedGates} / ${gates.length} zaliczone** · Aktualizacja: ${state.updatedAt}`,
    ``,
    `## Bramki walidacji`,
    ``,
    ...gates.map((gate) => {
      const icon = gate.status === 'zaliczona' ? '[x]' : '[ ]';
      const dateStr = gate.date ? ` · data: ${gate.date}` : '';
      const noteStr = gate.note?.trim() ? ` · notatka: ${gate.note.trim()}` : '';
      return `- ${icon} **${gate.label}** (${gate.stepsLabel}) — status: **${gate.status}**${dateStr}${noteStr}`;
    }),
    ``,
  ];

  for (const stage of state.stages) {
    const stageTasks = state.tasks.filter((t) => t.stageId === stage.id);
    lines.push(
      `## ${stage.stepNumber}: ${stage.title} (${stage.timeframe} · ICE ${stage.iceTotal})`
    );
    lines.push(`Cel: ${stage.goal}`);
    lines.push('');
    for (const task of stageTasks) {
      const box = task.completed ? '[x]' : '[ ]';
      const dateStr = task.completed && task.completedAt ? ` (ukończono: ${task.completedAt})` : '';
      lines.push(`- ${box} **${task.title}**${dateStr}`);
      lines.push(`  - Narzędzie: ${task.tools}`);
      lines.push(`  - Szczegóły: ${task.details}`);
      if (task.note?.trim()) {
        lines.push(`  - Notatka: ${task.note.trim()}`);
      }
    }
    lines.push('');
  }

  lines.push('## Pytania diagnostyczne przed wdrożeniem SEO & GEO');
  lines.push('');
  for (const q of state.questions) {
    lines.push(`### ${q.number}. ${q.title}`);
    lines.push(q.question);
    lines.push(`Odpowiedź: ${q.answer.trim() ? q.answer.trim() : '_Brak odpowiedzi_'}`);
    lines.push('');
  }

  return lines.join('\n');
}
