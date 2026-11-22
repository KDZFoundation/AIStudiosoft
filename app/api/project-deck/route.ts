import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import {
  AGENTS,
  AgentRunRecord,
  BrandContextData,
  DEFAULT_BRAND_CONTEXT,
  INITIAL_ITERATIONS,
  INITIAL_SAMPLE_RUNS,
  IterationEntry,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import {
  createDefaultMarketingPlanState,
  MarketingPlanState,
  mergeMarketingPlanState,
} from '@/data/marketing-plan';
import { scanHumanizerTells } from '@/lib/humanizer';
import { getAntywzorceRulesSpec, lintPodrozowkaCopy } from '@/lib/lint-copy';

interface DeckScreenshot {
  id: string;
  caption: string;
  dataUrl: string;
}

interface DeckBody {
  brandContext?: BrandContextData;
  marketingPlan?: MarketingPlanState;
  runs?: AgentRunRecord[];
  selectedRunIds?: string[];
  iterations?: IterationEntry[];
  screenshots?: DeckScreenshot[];
  liveAppUrl?: string;
}

const CATALOG_PHOTO_COUNT = PODROZOWKA_CATALOG.length;

const CONTEXT_GROUPS = [
  {
    title: 'Oferta i ekonomika',
    detail: '4,99 zł/szt., min. 8 szt. (39,92 zł), 105+ krajów, 89+ języków, bez rabatów.',
  },
  {
    title: 'Reguły kartki i role',
    detail: `${CATALOG_PHOTO_COUNT} kadrów Polski z podziękowaniem na przodzie, QR łączy Podróżnika z Obdarowanym (zero uploadu).`,
  },
  {
    title: 'Język i przewagi',
    detail: 'Język wynika z kraju kartki (wybór w krajach wielojęzycznych), Karta Głosu, 5 CEP przedwyjazdowych.',
  },
  {
    title: 'Strażnicy i bramki 0 → 1',
    detail: 'Instrukcja operatora, 12 reguł Lintera, 3 Bramki Walidacji, plan wyprawy 01.2027.',
  },
];

const AGENT_SHORT_CARDS = [
  { name: 'Badacz Rynku', scope: 'Google Search Live · JTBD Push/Pull · 6–10 CEP' },
  { name: 'Strateg Wzrostu', scope: 'Segmenty STP · lejek AARRR · priorytety ICE' },
  { name: 'Copywriter Głosu', scope: 'Karta Głosu · PAS/BAB · tabela TAK/NIE' },
  { name: 'Architekt Social', scope: 'Matryca 7 Typów · rolki 9:16 · linki UTM' },
  { name: 'Audytor SEO & GEO', scope: 'Topic Clusters · AI Overviews · ChatGPT' },
  { name: 'Strateg Kampanii', scope: 'Briefy 2×2 · ICE · pełna kontrola budżetu' },
  { name: 'Analityk GA4', scope: 'zasady-analizy.md · Triangulacja 3 źródeł' },
  { name: 'Prompt Director', scope: 'Prompty foto/wideo · paleta CSS marki' },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Plan 16-pkt + Mózg Marki', note: 'Wybór zadania i twarde zasady produktu' },
  { step: '02', title: '8 Agentów + Humanizer', note: 'Research, copy, rolki 9:16 bez maniery AI' },
  { step: '03', title: 'Publikacja Meta / SEO', note: 'Posty z UTM i skan /sklep pod Google/AI' },
  { step: '04', title: 'GA4 Live + Bank GROWS', note: 'Pomiar koszyka i decyzje przed Ads' },
];

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function compactText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+\n/g, '\n').trim();
  if (clean.length <= maxChars) return clean;
  const sliced = clean.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf('\n'), sliced.lastIndexOf('. '));
  return `${(lastBreak > maxChars * 0.55 ? sliced.slice(0, lastBreak + 1) : sliced).trim()}…`;
}

function isSafeImageDataUrl(url: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url.trim());
}

async function readDeckImageAsDataUri(filename: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'images', 'deck', filename);
    const buffer = await fs.readFile(filePath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DeckBody;
    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const plan = body.marketingPlan
      ? mergeMarketingPlanState(body.marketingPlan)
      : createDefaultMarketingPlanState();

    const allRuns = body.runs?.length ? body.runs : INITIAL_SAMPLE_RUNS;
    const selectedRuns =
      body.selectedRunIds && body.selectedRunIds.length > 0
        ? allRuns.filter((r) => body.selectedRunIds!.includes(r.id)).slice(0, 3)
        : allRuns.slice(0, 3);
    const activeRuns = selectedRuns.length > 0 ? selectedRuns : allRuns.slice(0, 3);

    const deepResearchRun =
      activeRuns.find((r) => r.agentId === 'deep-research') ??
      allRuns.find((r) => r.agentId === 'deep-research') ??
      activeRuns[0];
    const secondaryRuns = activeRuns.filter((r) => r.id !== deepResearchRun?.id).slice(0, 2);

    const iterations = body.iterations?.length ? body.iterations : INITIAL_ITERATIONS;
    const displayIterations =
      iterations.length <= 6
        ? iterations
        : [...iterations.slice(0, 3), ...iterations.slice(-3)];

    const screenshots = (body.screenshots ?? [])
      .filter((s) => s.dataUrl && isSafeImageDataUrl(s.dataUrl))
      .slice(0, 4);
    const primaryScreenshots = screenshots.slice(0, 2);
    const extraScreenshots = screenshots.slice(2, 4);

    const liveUrl = (
      body.liveAppUrl?.trim() ||
      'https://ais-pre-qd7h237ohnwqsjippfpsqt-82444820632.europe-west2.run.app'
    ).trim();

    const [heroDataUri, studioDataUri, baggageDataUri] = await Promise.all([
      readDeckImageAsDataUri('hero.jpg'),
      readDeckImageAsDataUri('studio.jpg'),
      readDeckImageAsDataUri('baggage.jpg'),
    ]);

    const linterRules = getAntywzorceRulesSpec();
    const deepResearchAgent = AGENTS.find((a) => a.id === 'deep-research')!;

    const completedTasksCount = plan.tasks.filter((t) => t.completed).length;
    const customTasksCount = plan.tasks.filter((t) => t.isCustom).length;

    const renderCompactRunCard = (r: AgentRunRecord, maxChars: number) => {
      const findings = lintPodrozowkaCopy(r.output);
      const humanizerTells = scanHumanizerTells(r.output);
      const sourcesHtml =
        r.sources && r.sources.length > 0
          ? `<div class="sources"><strong>Źródła Google Search:</strong> ${r.sources
              .map((s) => escapeHtml(s.title))
              .join(' · ')}</div>`
          : '';
      return `
        <div class="run-card">
          <div class="run-head">
            <span><strong>${escapeHtml(r.agentName)}</strong> <span class="muted">· ${escapeHtml(
              r.createdAt
            )}</span></span>
            <span class="ok-text">Linter: ${findings.length} naruszeń · Humanizer: ${
              humanizerTells.length
            } nawyków AI</span>
          </div>
          <div class="run-prompt"><strong>Prompt:</strong> ${escapeHtml(
            compactText(r.prompt, 120)
          )}</div>
          <div class="run-output">${escapeHtml(compactText(r.output, maxChars))}</div>
          ${sourcesHtml}
        </div>
      `;
    };

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Projekt Zaliczeniowy · ${escapeHtml(brand.companyName)} (10 slajdów)</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; color: #121926; background: #FFFBEF; margin: 0; padding: 16px; }
    .print-note { text-align: center; margin-bottom: 12px; font-size: 12.5px; color: #646A75; }
    .slide {
      background: #ffffff;
      border: 1px solid #E8E1D3;
      border-radius: 14px;
      padding: 20px 24px;
      margin: 0 auto 18px auto;
      max-width: 1080px;
      min-height: 178mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-inside: avoid;
    }
    .slide:last-of-type { page-break-after: auto; }
    .slide-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; border-bottom: 1px solid #F1ECE1; padding-bottom: 10px; margin-bottom: 12px; }
    .kicker { font-size: 11px; font-weight: 600; color: #5B2182; margin-bottom: 3px; }
    h1 { font-size: 24px; margin: 0 0 8px 0; color: #121926; line-height: 1.22; }
    h2 { font-size: 17px; margin: 0; color: #121926; line-height: 1.26; }
    h3 { font-size: 12px; margin: 0 0 6px 0; color: #121926; }
    p, li { font-size: 11.5px; line-height: 1.45; color: #414751; margin: 0 0 5px 0; }
    ol { margin: 4px 0 0 0; padding-left: 16px; }
    .muted { color: #646A75; font-weight: 400; }
    .ok-text { color: #15803D; font-weight: 600; font-size: 10.5px; }
    .grid-12 { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; align-items: stretch; flex: 1; }
    .col-5 { grid-column: span 5; }
    .col-6 { grid-column: span 6; }
    .col-7 { grid-column: span 7; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .box { background: #FAF6EA; border: 1px solid #E8E1D3; border-radius: 10px; padding: 11px 13px; }
    .box-plum { background: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 10px; padding: 11px 13px; }
    .box-amber { background: #FFF9E2; border: 1px solid #FDE68A; border-radius: 10px; padding: 10px 12px; }
    .box-green { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 10px 12px; margin-top: 10px; }
    .mini-card { background: #ffffff; border: 1px solid #E8E1D3; border-radius: 8px; padding: 7px 10px; margin-bottom: 7px; }
    .mini-card:last-child { margin-bottom: 0; }
    .stat-num { font-size: 20px; font-weight: 700; color: #121926; line-height: 1.1; }
    .stat-lbl { font-size: 11px; color: #646A75; }
    .stats-row { border-top: 1px solid #F1ECE1; padding-top: 10px; margin-top: 10px; }
    .photo-frame { width: 100%; border-radius: 10px; overflow: hidden; border: 1px solid #E8E1D3; background: #FAF6EA; }
    .photo-frame img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .photo-hero { height: 270px; }
    .photo-side { height: 225px; }
    .caption { font-size: 10.5px; color: #646A75; margin-top: 6px; }
    .url-box { font-family: ui-monospace, monospace; font-size: 11px; color: #3B0754; background: #FFF2CC; border: 1px solid #F5D26B; border-radius: 8px; padding: 8px 11px; word-break: break-all; }
    table { width: 100%; border-collapse: collapse; font-size: 10.8px; }
    th, td { border-bottom: 1px solid #E8E1D3; text-align: left; padding: 6px 8px; vertical-align: top; }
    th { background: #FAF6EA; color: #121926; font-weight: 700; }
    pre { white-space: pre-wrap; font-family: 'JetBrains Mono', ui-monospace, monospace; background: #ffffff; border: 1px solid #E8E1D3; border-radius: 8px; padding: 8px 10px; font-size: 10px; line-height: 1.4; margin: 5px 0; color: #121926; }
    code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10.5px; color: #3B0754; }
    .run-card { background: #FAF6EA; border: 1px solid #E8E1D3; border-radius: 10px; padding: 10px 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .run-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 5px; flex-wrap: wrap; }
    .run-prompt { font-size: 10.5px; color: #414751; margin-bottom: 6px; }
    .run-output { background: #ffffff; border: 1px solid #E8E1D3; border-radius: 8px; padding: 9px 11px; font-size: 11px; line-height: 1.44; color: #121926; white-space: pre-wrap; flex: 1; }
    .sources { font-size: 10.5px; color: #5B2182; margin-top: 6px; }
    .shot-grid-1 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 10px; flex: 1; }
    .shot-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; flex: 1; }
    .shot-card { border: 1px solid #E8E1D3; border-radius: 10px; padding: 8px; background: #FAF6EA; display: flex; flex-direction: column; justify-content: space-between; }
    .shot-card img { width: 100%; height: 270px; object-fit: contain; border-radius: 6px; background: #ffffff; border: 1px solid #E8E1D3; }
    .shot-card-sm img { height: 215px; }
    .shot-caption { font-size: 11px; font-weight: 600; color: #121926; margin-top: 6px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-note { display: none; }
      .slide { border: none; margin: 0; padding: 4mm 6mm; min-height: 185mm; max-height: 188mm; }
    }
  </style>
</head>
<body>
  <div class="print-note">Aby zapisać prezentację jako 10-stronicowy PDF, naciśnij Ctrl+P / Cmd+P, ustaw układ poziomy A4 i wybierz „Zapisz jako PDF”.</div>

  <!-- SLAJD 1 / 10 -->
  <section class="slide">
    <div class="grid-12">
      <div class="col-6" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div class="kicker">Slajd 1 / 10 · Projekt Zaliczeniowy · podrozowka.pl</div>
          <h1>Podróżówka AI: system marketingowy od planu do konwersji</h1>
          <p style="font-size:12.5px;">Dla marki <strong>Podróżówka</strong> (odwrócona pocztówka kupowana w Polsce przed wylotem i wręczana lokalsom w ich języku z kodem QR) zbudowałem kompletny dashboard zamiast luźnych promptów w czacie.</p>
        </div>
        <div>
          <div class="url-box"><strong>App Live:</strong> ${escapeHtml(liveUrl)}</div>
          <div class="grid-3 stats-row">
            <div><div class="stat-num">${AGENTS.length}</div><div class="stat-lbl">agentów AI</div></div>
            <div><div class="stat-num">${plan.tasks.length}</div><div class="stat-lbl">zadań planu</div></div>
            <div><div class="stat-num">26</div><div class="stat-lbl">reguł Humanizera</div></div>
          </div>
        </div>
      </div>
      <div class="col-6" style="display:flex; flex-direction:column; justify-content:space-between;">
        ${
          heroDataUri
            ? `<div class="photo-frame photo-hero"><img src="${heroDataUri}" alt="Dashboard analityczny Podróżówki oraz fizyczna odwrócona pocztówka" /></div>`
            : `<div class="box photo-hero">Podróżówka AI Dashboard</div>`
        }
        <p class="caption">Odwrócona pocztówka: 4,99 zł/szt. (min. 8 szt. = 39,92 zł) · 105+ krajów · 89+ języków · ${CATALOG_PHOTO_COUNT} wzorów · wysyłka PL.</p>
      </div>
    </div>
  </section>

  <!-- SLAJD 2 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 2 / 10 · Pytanie 1: Co wdrożyliście i do czego</div>
        <h2>Funkcja rozwiązania i miejsce w codziennej pracy marketera</h2>
      </div>
      <span class="muted" style="font-size:11px;">Rytm pracy: 6 h/tydz. · 100% organic</span>
    </div>
    <div class="grid-12">
      <div class="col-7" style="display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div class="box">
          <h3>1. Problem, który rozwiązuje system</h3>
          <p>Kupujący nie szukają w Google nazwy „odwrócona pocztówka”, a surowe czaty AI porównywały kartkę do wizytówek i magnesów, zmyślały rabaty oraz obiecywały wgrywanie zdjęć klienta.</p>
        </div>
        <div class="box">
          <h3>2. Co dokładnie zbudowano</h3>
          <p>Jedną aplikację webową łączącą Plan 16-pkt, Dokument Kontekstowy (Mózg Marki), 8 agentów AI, generator postów/rolek z filtrem <strong>Humanizer</strong> oraz audyty na żywo (GSC, GA4, Meta, Google Ads).</p>
        </div>
        <div class="box">
          <h3>3. Gdzie przydaje się w pracy</h3>
          <p>Prowadzi operatora od wyboru zadania z planu, przez badanie intencji w Google i publikację rolek z UTM, aż po ocenę koszyka w GA4 przed wydaniem budżetu na reklamy.</p>
        </div>
      </div>
      <div class="col-5 box-plum" style="display:flex; flex-direction:column; justify-content:space-between;">
        <h3>Obieg pracy w aplikacji (4 kroki)</h3>
        <div>
          ${WORKFLOW_STEPS.map(
            (w) => `<div class="mini-card"><strong>${escapeHtml(w.step)}. ${escapeHtml(
              w.title
            )}</strong><div class="muted" style="font-size:10.5px; margin-top:2px;">${escapeHtml(
              w.note
            )}</div></div>`
          ).join('')}
        </div>
        <p style="font-size:10.5px; color:#5B2182; margin:0;">Dokument Kontekstowy działa jako wsad systemu, a nie końcowy produkt.</p>
      </div>
    </div>
  </section>

  <!-- SLAJD 3 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 3 / 10 · Pytanie 2: Konfiguracja (1/3)</div>
        <h2>Plan 16-punktowy (ICE) oraz wsad Dokumentu Kontekstowego (Mózg Marki)</h2>
      </div>
      <span class="muted" style="font-size:11px;">Zadania: ${completedTasksCount}/${plan.tasks.length} · własne: ${customTasksCount}</span>
    </div>
    <div class="grid-12">
      <div class="col-7" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <h3>16-punktowy plan wdrożenia z oceną ICE i dodawaniem własnych zadań</h3>
          <table>
            <thead><tr><th>Etap</th><th>Zakres i narzędzia</th><th style="text-align:right;">ICE</th></tr></thead>
            <tbody>
              ${plan.stages
                .map(
                  (st) =>
                    `<tr><td><strong>${escapeHtml(st.stepNumber)}</strong></td><td><strong>${escapeHtml(
                      st.framework
                    )}:</strong> ${escapeHtml(
                      st.title
                    )}</td><td style="text-align:right; color:#5B2182;"><strong>${
                      st.iceTotal
                    }</strong></td></tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <p class="caption">Obejmuje: GSC + GA4 + Clarity, Bing Webmaster Tools, SEO/GEO bez bloga (JSON-LD), 3 Bramki Walidacji oraz KPI.</p>
      </div>
      <div class="col-5 box" style="display:flex; flex-direction:column; justify-content:space-between;">
        <h3>Zawartość Mózgu Marki (11 sekcji w 4 blokach)</h3>
        <div>
          ${CONTEXT_GROUPS.map(
            (g) => `<div class="mini-card"><strong>${escapeHtml(
              g.title
            )}</strong><div style="font-size:10.5px; color:#414751; margin-top:2px;">${escapeHtml(
              g.detail
            )}</div></div>`
          ).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- SLAJD 4 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 4 / 10 · Pytanie 2: Konfiguracja (2/3)</div>
        <h2>Technikalia: kod wstrzykiwania, Skill Humanizer, Linter i 8 Agentów AI</h2>
      </div>
      <span class="muted" style="font-size:11px;">Bramka: Linter regex + 26 reguł A–F</span>
    </div>
    <div class="grid-12">
      <div class="col-6" style="display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div class="box">
          <h3>1. Wstrzykiwanie promptu i Skill <code>blader/humanizer</code></h3>
          <pre>buildBrandContextBlock(ctx) -&gt; systemInstruction
// Wsad: Oferta + Reguły foto + Anty-persona + Twarde Zakazy

Skill blader/humanizer (grupy A–F):
- A–C: usuwa napuszony ton i puste przymiotniki („pasja”)
- D (§8, §15): blokuje myślniki AI i trójpodziały
- E–F: usuwa otwarcia z czatu („Oczywiście!”)</pre>
          <p style="font-size:10.5px; margin:0;"><strong>Fragment promptu Badacza:</strong> <code>${escapeHtml(
            compactText(deepResearchAgent.systemPrompt, 150)
          )}</code></p>
        </div>
        <div class="box">
          <h3>2. Walidacja w kodzie (<code>lintPodrozowkaCopy</code>)</h3>
          <div class="grid-2" style="gap:6px;">
            ${linterRules
              .slice(0, 4)
              .map(
                (r) => `<div class="mini-card" style="margin:0; font-size:10.5px;"><strong style="color:#991B1B;">${escapeHtml(
                  r.label
                )}:</strong> ${escapeHtml(compactText(r.reason, 48))}</div>`
              )
              .join('')}
          </div>
        </div>
      </div>
      <div class="col-6 box-plum" style="display:flex; flex-direction:column; justify-content:space-between;">
        <h3>3. Zespół ${AGENTS.length} wyspecjalizowanych agentów w aplikacji</h3>
        <div class="grid-2" style="gap:7px;">
          ${AGENT_SHORT_CARDS.map(
            (ag, idx) => `<div class="mini-card" style="margin:0;"><strong>${idx + 1}. ${escapeHtml(
              ag.name
            )}</strong><div style="font-size:10.5px; color:#414751; margin-top:2px;">${escapeHtml(
              ag.scope
            )}</div></div>`
          ).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- SLAJD 5 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 5 / 10 · Pytanie 2: Konfiguracja (3/3)</div>
        <h2>Narzędzia audytu na żywo (GSC, GA4, Meta, Google Ads) i Generator Social</h2>
      </div>
      <span class="muted" style="font-size:11px;">Human-in-the-loop dla budżetów</span>
    </div>
    <div class="grid-12">
      <div class="col-7 grid-2" style="gap:10px; align-content:stretch;">
        <div class="box">
          <h3>1. Search Console, Bing i Skaner</h3>
          <p>Endpoint <code>/api/seo-geo/scan</code> sprawdza HTML <code>/sklep</code> bez JS (cena 4,99 zł, FAQ i JSON-LD Product).</p>
        </div>
        <div class="box">
          <h3>2. GA4 Live i Bank GROWS</h3>
          <p>OAuth do usługi <code>podrozowka-production</code>: lejek koszyka, próg 30 sesji i odsiew bramek P24/PayU/BLIK.</p>
        </div>
        <div class="box">
          <h3>3. Meta Apps i Google Ads</h3>
          <p>Bezpośrednia publikacja na Facebooku z UTM przez Meta Developers Apps oraz podgląd Google Ads API v26 z ręczną akceptacją budżetu.</p>
        </div>
        <div class="box">
          <h3>4. Generator Postów/Rolek + Humanizer</h3>
          <p>Parametry: typ komunikatu z Matrycy 7 Typów, segment, 1 z ${CATALOG_PHOTO_COUNT} kadrów sklepu oraz rolka 9:16 lub karuzela 7 slajdów czyszczona skillem Humanizer.</p>
        </div>
      </div>
      <div class="col-5" style="display:flex; flex-direction:column; justify-content:space-between;">
        ${
          studioDataUri
            ? `<div class="photo-frame photo-side"><img src="${studioDataUri}" alt="Nagrywanie fizycznej kartki Podróżówka telefonem pod rolkę 9:16" /></div>`
            : `<div class="box photo-side">Studio nagrań 9:16</div>`
        }
        <p class="caption">Scenariusze 9:16 opierają się na realnych ujęciach dłoni z fizyczną kartką (podziękowanie na przodzie, rewers z zachętą i kodem QR).</p>
      </div>
    </div>
  </section>

  <!-- SLAJD 6 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 6 / 10 · Pytanie 3: Efekt użycia (1/3)</div>
        <h2>Wynik Badacza Rynku na żywo z Google Search Grounding</h2>
      </div>
      <span class="ok-text">Schemat: JTBD · CEP · [FAKT] vs [HIPOTEZA]</span>
    </div>
    <div class="grid-12">
      <div class="col-7">
        ${deepResearchRun ? renderCompactRunCard(deepResearchRun, 660) : ''}
      </div>
      <div class="col-5" style="display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        ${
          baggageDataUri
            ? `<div class="photo-frame photo-side"><img src="${baggageDataUri}" alt="Karta Podróżówki w kieszeni paszportu przy bagażu podręcznym" /></div>`
            : `<div class="box photo-side">Bagaż podręczny i Podróżówka</div>`
        }
        <div class="box-amber">
          <p style="margin:0;"><strong>Wniosek wdrożony w nagłówkach:</strong> zamiast tłumaczyć definicję „odwróconej pocztówki”, startujemy od problemu bagażu 100 ml i kruszących się słodyczy.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SLAJD 7 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 7 / 10 · Pytanie 3: Efekt użycia (2/3)</div>
        <h2>Interaktywny dashboard na żywo: link produkcyjny i zrzuty ekranu</h2>
      </div>
      <span class="muted" style="font-size:11px;">Widok aplikacji (${primaryScreenshots.length} głównych zrzutów)</span>
    </div>
    <div class="url-box"><strong>Link do interaktywnej aplikacji (Live):</strong> ${escapeHtml(liveUrl)}</div>
    ${
      primaryScreenshots.length > 0
        ? `<div class="${primaryScreenshots.length === 1 ? 'shot-grid-1' : 'shot-grid-2'}">
            ${primaryScreenshots
              .map(
                (s) => `<div class="shot-card">
                  <img src="${escapeHtml(s.dataUrl)}" alt="${escapeHtml(s.caption)}" />
                  <div class="shot-caption">${escapeHtml(s.caption)}</div>
                </div>`
              )
              .join('')}
          </div>`
        : `<div class="box-amber" style="margin-top:12px;">
            <p style="margin:0;">Brak wgranych zrzutów ekranu. Dodaj 1–4 zrzuty w panelu „Projekt Zaliczeniowy”, aby wyświetliły się tutaj w dużym formacie.</p>
          </div>`
    }
  </section>

  <!-- SLAJD 8 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 8 / 10 · Pytanie 3: Efekt użycia (3/3)</div>
        <h2>${
          extraScreenshots.length > 0
            ? 'Dodatkowe zrzuty ekranu oraz wygenerowany materiał po Humanizerze'
            : 'Wygenerowane treści po filtrze Humanizer i Linterze Antywzorców'
        }</h2>
      </div>
      <span class="ok-text">Gotowe do publikacji z parametrami UTM</span>
    </div>
    ${
      extraScreenshots.length > 0
        ? `<div class="grid-12">
            <div class="col-7 grid-2" style="gap:10px;">
              ${extraScreenshots
                .map(
                  (s) => `<div class="shot-card shot-card-sm">
                    <img src="${escapeHtml(s.dataUrl)}" alt="${escapeHtml(s.caption)}" />
                    <div class="shot-caption">${escapeHtml(s.caption)}</div>
                  </div>`
                )
                .join('')}
            </div>
            <div class="col-5">
              ${secondaryRuns.slice(0, 1).map((r) => renderCompactRunCard(r, 420)).join('')}
            </div>
          </div>`
        : `<div class="grid-2" style="flex:1;">
            ${secondaryRuns.map((r) => renderCompactRunCard(r, 480)).join('')}
          </div>`
    }
  </section>

  <!-- SLAJD 9 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 9 / 10 · Pytanie 4: Historia iteracji</div>
        <h2>Co nie działało, jak zmieniliśmy konfigurację i co się poprawiło</h2>
      </div>
      <span class="muted" style="font-size:11px;">${displayIterations.length} kluczowych iteracji (z ${iterations.length} w dzienniku)</span>
    </div>
    <table style="flex:1;">
      <thead>
        <tr>
          <th style="width:22%;">Iteracja</th>
          <th style="width:26%;">Co nie zadziałało</th>
          <th style="width:28%;">Zmiana w konfiguracji</th>
          <th style="width:24%;">Efekt</th>
        </tr>
      </thead>
      <tbody>
        ${displayIterations
          .map(
            (it) =>
              `<tr><td><strong>${escapeHtml(it.title)}</strong></td><td>${escapeHtml(
                compactText(it.problemObserved, 130)
              )}</td><td>${escapeHtml(
                compactText(it.configChange, 140)
              )}</td><td style="color:#15803D; font-weight:600;">${escapeHtml(
                compactText(it.resultObserved, 120)
              )}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <!-- SLAJD 10 / 10 -->
  <section class="slide">
    <div class="slide-head">
      <div>
        <div class="kicker">Slajd 10 / 10 · Podsumowanie Operacyjne i KPI</div>
        <h2>Tygodniowy rytm pracy (6 h/tydz.) oraz metryki sukcesu podrozowka.pl</h2>
      </div>
      <span class="ok-text">Komplet 4 odpowiedzi w 10 slajdach</span>
    </div>
    <div class="grid-12">
      <div class="col-5 box" style="display:flex; flex-direction:column; justify-content:space-between;">
        <h3>Stały rytm pracy tygodniowej</h3>
        <ol style="display:flex; flex-direction:column; gap:7px;">
          <li><strong>Plan i Mózg Marki:</strong> wybór kolejnego zadania z planu 16-pkt i aktualizacja obserwacji z testów.</li>
          <li><strong>Google Search + Copywriter:</strong> nowe kąty z tabelą <code>TAK/NIE</code> i Linterem.</li>
          <li><strong>Social + Humanizer:</strong> posty i rolki 9:16 publikowane z tagiem UTM przez Meta Apps.</li>
          <li><strong>GA4 + GROWS:</strong> ocena <code>add_to_cart</code> przed decyzją o płatnym ruchu w Google Ads.</li>
        </ol>
      </div>
      <div class="col-7">
        <table>
          <thead><tr><th>Faza</th><th>Metryka KPI</th><th>Cel</th></tr></thead>
          <tbody>
            ${plan.kpis
              .slice(0, 4)
              .map(
                (kpi) =>
                  `<tr><td><strong>${escapeHtml(kpi.phase)}</strong></td><td>${escapeHtml(
                    kpi.metric
                  )}</td><td>${escapeHtml(compactText(kpi.targetDefinition, 115))}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="box-green">
      <p style="margin:0; color:#14532D;"><strong>Podsumowanie zaliczeniowe (1–4):</strong> [1] Dashboard operacyjny zamiast suchego dokumentu (Slajdy 1–2) · [2] Kod wstrzykiwania, Linter, Skill Humanizer i 8 agentów (Slajdy 3–5) · [3] Wyniki Google Search, link Live i zrzuty ekranu (Slajdy 6–8) · [4] Historia iteracji i KPI (Slajdy 9–10).</p>
    </div>
  </section>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Nie udało się wygenerować prezentacji projektu zaliczeniowego.' },
      { status: 500 }
    );
  }
}
