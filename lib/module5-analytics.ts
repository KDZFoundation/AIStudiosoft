export type GrowsExperimentStatus = 'planned' | 'running' | 'won' | 'dropped';
export type GrowsDataSource = 'GA4' | 'Clarity' | 'GSC' | 'UTM/Social';
export type Module5AnalysisMode =
  | 'three-sentence-diagnosis'
  | 'funnel-cro'
  | 'segment-utm';

export interface Ga4HygieneRule {
  id: string;
  code: string;
  title: string;
  detail: string;
  done: boolean;
}

export interface GrowsExperimentItem {
  id: string;
  title: string;
  source: GrowsDataSource;
  hypothesis: string;
  metric: string;
  impact: number;
  confidence: number;
  ease: number;
  status: GrowsExperimentStatus;
  studyNotes?: string;
  isCustom?: boolean;
}

export interface Module5PersistedState {
  version: number;
  updatedAt: string;
  clarityAndGscNotes: string;
  lastDecisionOutput: string;
  lastDecisionMode: Module5AnalysisMode;
  lastDecisionAt?: string;
  hygiene: Ga4HygieneRule[];
  experiments: GrowsExperimentItem[];
}

export const MODULE5_STORAGE_KEY = 'podrozowka_module5_grows_v1';

export const MODULE5_MODES: Array<{
  id: Module5AnalysisMode;
  label: string;
  subtitle: string;
}> = [
  {
    id: 'three-sentence-diagnosis',
    label: 'Reguła 3 zdań (A4)',
    subtitle: '[POMIAR] → [KONTEKST] → [HIPOTEZA + ICE] wg zasady-analizy.md',
  },
  {
    id: 'funnel-cro',
    label: 'Lejek /sklep & Clarity (CRO)',
    subtitle: 'Wąskie gardła view_item → add_to_cart (min. 8 szt.) → purchase',
  },
  {
    id: 'segment-utm',
    label: 'Kanały & UTM (Zwycięzcy vs Odcięcie)',
    subtitle: 'Ocena ruchu organicznego z grup FB / rolek przy limicie 6 h/tydz.',
  },
];

export const GA4_HYGIENE_CHECKS: Ga4HygieneRule[] = [
  {
    id: 'hyg-1',
    code: 'zasady-analizy A3',
    title: 'Wyklucz bramki płatności z listy odesłań GA4',
    detail:
      'Dodaj przelewy24.pl, payu.pl, stripe.com, tpay.com, autopay.pl i banki do niechcianych odesłań w strumieniu danych GA4, aby powrót po płatności nie nadpisywał źródła UTM.',
    done: false,
  },
  {
    id: 'hyg-2',
    code: 'zasady-analizy A2',
    title: 'Pilnuj progu minimum 30 sesji przed twardym werdyktem',
    detail:
      'Przy < 30 sesjach na wariant lub kanał oznaczaj wynik jako [ZA MAŁO DANYCH] i traktuj go wyłącznie jako sygnał kierunkowy, nigdy dowód statystyczny.',
    done: false,
  },
  {
    id: 'hyg-3',
    code: 'zasady-analizy A1',
    title: 'Zweryfikuj zdarzenia lejka na /sklep (8 szt. = 39,92 zł)',
    detail:
      'Sprawdź w DebugView / raporcie zdarzeń, czy page_view, view_item, add_to_cart (pakiet 8 szt.), begin_checkout i purchase strzelają poprawnie na mobile i desktop.',
    done: false,
  },
  {
    id: 'hyg-4',
    code: 'UTM & Atrybucja',
    title: 'Taguj każdy link organiczny w bio, postach FB i rolkach',
    detail:
      'Każdy link do /sklep powinien nieść utm_source, utm_medium i utm_campaign (np. erasmus_pl vs bagaz_100ml), żeby ruch nie wpadał do (direct) / (none).',
    done: false,
  },
  {
    id: 'hyg-5',
    code: 'Triangulacja 3 źródeł',
    title: 'Zestawiaj GA4 + Microsoft Clarity + Google Search Console',
    detail:
      'GA4 pokazuje GDZIE odpadają klienci, Clarity pokazuje DLACZEGO (zatrzymania scrolla, rage clicks), a GSC pokazuje JAKICH zapytań szukają przed wejściem.',
    done: false,
  },
];

export const DEFAULT_GROWS_EXPERIMENTS: GrowsExperimentItem[] = [
  {
    id: 'exp-1',
    title: 'Hero /sklep wg BLUF: awers z podziękowaniem + rewers QR relacyjny + cena 39,92 zł',
    source: 'Clarity',
    hypothesis:
      'Jeśli nad pierwszym zgięciem na /sklep pokażemy obok siebie przód (zdjęcie Polski + podziękowanie w języku kraju) i tył (mapa + QR łączący Podróżnika z Obdarowanym) oraz jawną cenę 8 szt. (39,92 zł), to wskaźnik przejścia do add_to_cart wzrośnie, bo użytkownik w 5 sekund zrozumie „odwróconą pocztówkę”.',
    metric: 'add_to_cart / view_item (%) + czas do 1. interakcji w Clarity',
    impact: 9,
    confidence: 8,
    ease: 8,
    status: 'planned',
    studyNotes: '',
  },
  {
    id: 'exp-2',
    title: 'Sekcja FAQ 4 obiekcji + jawna dostawa w Polsce (ORLEN Paczka i InPost, 2–3 dni)',
    source: 'GA4',
    hypothesis:
      'Jeśli tuż pod wyborem 8 kartek umieścimy krótkie FAQ zbijające 4 główne obiekcje (min. 8 szt., wybór języka wynikający z kraju, stałe kadry bez uploadu, wysyłka wyłącznie w Polsce ORLEN Paczką lub InPost w 2–3 dni robocze), to spadnie porzucenie w begin_checkout.',
    metric: 'begin_checkout → purchase (%)',
    impact: 8,
    confidence: 9,
    ease: 8,
    status: 'planned',
    studyNotes: '',
  },
  {
    id: 'exp-3',
    title: 'Test kątów UTM: „100 ml płynu vs 8 kartek” kontra „Prezent dla gospodarza (Erasmus+)”',
    source: 'UTM/Social',
    hypothesis:
      'Jeśli opublikujemy 2 równoległe posty i rolki 9:16 z fizycznymi kartkami z osobnymi tagami utm_campaign=bagaz_100ml i utm_campaign=erasmus_pl w polskich grupach wyjazdowych, to wyłonimy kąt o wyższym zaangażowaniu i dodaniach do koszyka przy budżecie 6 h/tydz.',
    metric: 'Sesje zaangażowane oraz add_to_cart per utm_campaign',
    impact: 8,
    confidence: 8,
    ease: 8,
    status: 'planned',
    studyNotes: '',
  },
  {
    id: 'exp-4',
    title: 'Wdrożenie Schema.org JSON-LD (Product + FAQPage) i test zapytań w GSC',
    source: 'GSC',
    hypothesis:
      'Jeśli na stronie głównej i /sklep wdrożymy poprawny JSON-LD z ceną 39,92 zł i FAQ (bez fałszywych gwiazdek wg Omnibus) zamiast nieistniejącego bloga, to wzrośnie liczba wyświetleń i CTR na frazy prezentowe z Polski przed wyjazdem.',
    metric: 'Wyświetlenia i CTR w GSC na frazy „drobny prezent z Polski za granicę”',
    impact: 7,
    confidence: 8,
    ease: 8,
    status: 'planned',
    studyNotes: '',
  },
  {
    id: 'exp-5',
    title: 'Dodanie 1–3 autentycznych zdjęć wręczenia z paczek testowych na /sklep',
    source: 'GA4',
    hypothesis:
      'Jeśli przy starcie od 0 zamówień pozyskamy 3–5 prawdziwych zdjęć wręczenia w zamian za darmowe arkusze testowe wysłane w Polsce i wkleimy je przy wyborze zestawu (z oznaczeniem Omnibus), to wskaźnik zaufania i finalizacji purchase wzrośnie.',
    metric: 'purchase / session (%) oraz kliknięcia w galerię /sklep',
    impact: 9,
    confidence: 7,
    ease: 7,
    status: 'planned',
    studyNotes: '',
  },
];

export function calcIce(impact: number, confidence: number, ease: number): number {
  const i = Math.min(10, Math.max(1, Math.round(impact)));
  const c = Math.min(10, Math.max(1, Math.round(confidence)));
  const e = Math.min(10, Math.max(1, Math.round(ease)));
  return i * c * e;
}

export function createDefaultModule5State(): Module5PersistedState {
  return {
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 10),
    clarityAndGscNotes: '',
    lastDecisionOutput: '',
    lastDecisionMode: 'three-sentence-diagnosis',
    hygiene: GA4_HYGIENE_CHECKS.map((h) => ({ ...h })),
    experiments: DEFAULT_GROWS_EXPERIMENTS.map((exp) => ({ ...exp })),
  };
}

export function mergeModule5State(
  raw: Partial<Module5PersistedState> | null | undefined
): Module5PersistedState {
  const base = createDefaultModule5State();
  if (!raw || typeof raw !== 'object') return base;

  const savedHygieneMap = new Map(
    (Array.isArray(raw.hygiene) ? raw.hygiene : []).map((h) => [h.id, h])
  );
  const hygiene = base.hygiene.map((def) => {
    const prev = savedHygieneMap.get(def.id);
    return prev ? { ...def, done: Boolean(prev.done) } : def;
  });

  const savedExpMap = new Map(
    (Array.isArray(raw.experiments) ? raw.experiments : []).map((e) => [e.id, e])
  );
  const builtInIds = new Set(base.experiments.map((e) => e.id));
  const mergedBuiltIns = base.experiments.map((def) => {
    const prev = savedExpMap.get(def.id);
    if (!prev) return def;
    return {
      ...def,
      status: prev.status ?? def.status,
      studyNotes: typeof prev.studyNotes === 'string' ? prev.studyNotes : def.studyNotes,
      impact: typeof prev.impact === 'number' ? prev.impact : def.impact,
      confidence: typeof prev.confidence === 'number' ? prev.confidence : def.confidence,
      ease: typeof prev.ease === 'number' ? prev.ease : def.ease,
    };
  });

  const customExps = (Array.isArray(raw.experiments) ? raw.experiments : []).filter(
    (e) => e && e.id && !builtInIds.has(e.id)
  );

  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : base.updatedAt,
    clarityAndGscNotes:
      typeof raw.clarityAndGscNotes === 'string' ? raw.clarityAndGscNotes : '',
    lastDecisionOutput:
      typeof raw.lastDecisionOutput === 'string' ? raw.lastDecisionOutput : '',
    lastDecisionMode:
      raw.lastDecisionMode === 'funnel-cro' || raw.lastDecisionMode === 'segment-utm'
        ? raw.lastDecisionMode
        : 'three-sentence-diagnosis',
    lastDecisionAt:
      typeof raw.lastDecisionAt === 'string' ? raw.lastDecisionAt : undefined,
    hygiene,
    experiments: [...mergedBuiltIns, ...customExps],
  };
}

export function formatModule5Markdown(state: Module5PersistedState): string {
  const sorted = [...state.experiments].sort(
    (a, b) =>
      calcIce(b.impact, b.confidence, b.ease) - calcIce(a.impact, a.confidence, a.ease)
  );
  const doneHygiene = state.hygiene.filter((h) => h.done).length;

  const lines: string[] = [
    `# Analityka GA4 & Pętla GROWS (podrozowka.pl)`,
    `Aktualizacja: ${state.updatedAt}`,
    ``,
    `## 1. Higiena pomiaru (${doneHygiene}/${state.hygiene.length})`,
    ...state.hygiene.map(
      (h) => `- [${h.done ? 'x' : ' '}] **${h.title}** (${h.code}): ${h.detail}`
    ),
    ``,
    `## 2. Bank Eksperymentów GROWS (posortowany wg ICE)`,
    ...sorted.map((exp, idx) => {
      const ice = calcIce(exp.impact, exp.confidence, exp.ease);
      return [
        `### ${idx + 1}. ${exp.title} [ICE: ${ice} (${exp.impact}×${exp.confidence}×${exp.ease}) | ${exp.source} | Status: ${exp.status}]`,
        `- **Hipoteza:** ${exp.hypothesis}`,
        `- **Metryka sukcesu (KPI):** ${exp.metric}`,
        exp.studyNotes ? `- **Wnioski (Study):** ${exp.studyNotes}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }),
  ];

  if (state.clarityAndGscNotes.trim()) {
    lines.push('', '## 3. Obserwacje Microsoft Clarity / GSC / QR', state.clarityAndGscNotes.trim());
  }

  if (state.lastDecisionOutput.trim()) {
    lines.push('', '## 4. Ostatnia decyzja AI (GA4 & GROWS)', state.lastDecisionOutput.trim());
  }

  return lines.join('\n');
}
