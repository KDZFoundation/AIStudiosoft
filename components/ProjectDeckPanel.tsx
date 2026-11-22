'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  ImagePlus,
  Link2,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  AGENTS,
  AgentRunRecord,
  BrandContextData,
  IterationEntry,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import {
  createDefaultMarketingPlanState,
  MarketingPlanState,
} from '@/data/marketing-plan';
import { scanHumanizerTells } from '@/lib/humanizer';
import { getAntywzorceRulesSpec, lintPodrozowkaCopy } from '@/lib/lint-copy';

interface DeckScreenshot {
  id: string;
  caption: string;
  dataUrl: string;
}

interface ProjectDeckPanelProps {
  brandContext: BrandContextData;
  marketingPlan?: MarketingPlanState;
  runs: AgentRunRecord[];
  iterations: IterationEntry[];
  onAddIteration: (entry: IterationEntry) => void;
}

const DEFAULT_LIVE_APP_URL =
  'https://ais-pre-qd7h237ohnwqsjippfpsqt-82444820632.europe-west2.run.app';
const SCREENSHOTS_STORAGE_KEY = 'podrozowka_deck_screenshots_v1';
const LIVE_URL_STORAGE_KEY = 'podrozowka_deck_live_url_v1';
const MAX_SCREENSHOTS = 4;
const EMPTY_SCREENSHOTS: DeckScreenshot[] = [];

let cachedScreenshotsRaw: string | null = null;
let cachedScreenshotsValue: DeckScreenshot[] = EMPTY_SCREENSHOTS;

const CONTEXT_GROUPS = [
  {
    title: 'Oferta i ekonomika',
    detail: '4,99 zł/szt., min. 8 szt. (39,92 zł), 105+ krajów, Churn/LTV bez rabatów.',
  },
  {
    title: 'Reguły foto i role',
    detail: `${PODROZOWKA_CATALOG.length} gotowych kadrów z podziękowaniem na przodzie (zero uploadu), role Podróżnik i Obdarowany.`,
  },
  {
    title: 'Język i przewagi',
    detail: 'Karta Głosu, 5 CEP przedwyjazdowych, bóle alternatyw (100 ml / słodycze).',
  },
  {
    title: 'Strażnicy i zakazy',
    detail: 'Instrukcja operatora, dobre/złe przykłady, Obietnice Zakazane, [FAKT] vs [HIPOTEZA].',
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

function compactText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+\n/g, '\n').trim();
  if (clean.length <= maxChars) return clean;
  const sliced = clean.slice(0, maxChars);
  const lastBreak = Math.max(sliced.lastIndexOf('\n'), sliced.lastIndexOf('. '));
  return `${(lastBreak > maxChars * 0.55 ? sliced.slice(0, lastBreak + 1) : sliced).trim()}…`;
}

function subscribeDeckStore(onChange: () => void) {
  window.addEventListener('podrozowka-deck-store', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-deck-store', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getScreenshotsSnapshot(): DeckScreenshot[] {
  try {
    const raw = localStorage.getItem(SCREENSHOTS_STORAGE_KEY);
    if (!raw) return EMPTY_SCREENSHOTS;
    if (cachedScreenshotsRaw === raw) return cachedScreenshotsValue;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_SCREENSHOTS;
    const valid = parsed.filter(
      (item): item is DeckScreenshot =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as DeckScreenshot).id === 'string' &&
        typeof (item as DeckScreenshot).caption === 'string' &&
        typeof (item as DeckScreenshot).dataUrl === 'string' &&
        /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test((item as DeckScreenshot).dataUrl)
    );
    cachedScreenshotsRaw = raw;
    cachedScreenshotsValue = valid.slice(0, MAX_SCREENSHOTS);
    return cachedScreenshotsValue;
  } catch {
    return EMPTY_SCREENSHOTS;
  }
}

function getScreenshotsServerSnapshot(): DeckScreenshot[] {
  return EMPTY_SCREENSHOTS;
}

function getLiveUrlSnapshot(): string {
  try {
    const stored = localStorage.getItem(LIVE_URL_STORAGE_KEY);
    return stored && stored.trim() ? stored : DEFAULT_LIVE_APP_URL;
  } catch {
    return DEFAULT_LIVE_APP_URL;
  }
}

function getLiveUrlServerSnapshot(): string {
  return DEFAULT_LIVE_APP_URL;
}

function saveScreenshotsToStore(next: DeckScreenshot[]): boolean {
  try {
    const trimmed = next.slice(0, MAX_SCREENSHOTS);
    const serialized = JSON.stringify(trimmed);
    localStorage.setItem(SCREENSHOTS_STORAGE_KEY, serialized);
    cachedScreenshotsRaw = serialized;
    cachedScreenshotsValue = trimmed;
    window.dispatchEvent(new Event('podrozowka-deck-store'));
    return true;
  } catch {
    return false;
  }
}

function saveLiveUrlToStore(nextUrl: string) {
  try {
    localStorage.setItem(LIVE_URL_STORAGE_KEY, nextUrl);
    window.dispatchEvent(new Event('podrozowka-deck-store'));
  } catch {
    // Ignore storage errors
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Nie udało się odczytać pliku obrazu.'));
      }
    };
    reader.onerror = () => reject(new Error('Błąd odczytu pliku obrazu.'));
    reader.readAsDataURL(file);
  });
}

export default function ProjectDeckPanel({
  brandContext,
  marketingPlan,
  runs,
  iterations,
  onAddIteration,
}: ProjectDeckPanelProps) {
  const screenshots = useSyncExternalStore(
    subscribeDeckStore,
    getScreenshotsSnapshot,
    getScreenshotsServerSnapshot
  );
  const liveAppUrl = useSyncExternalStore(
    subscribeDeckStore,
    getLiveUrlSnapshot,
    getLiveUrlServerSnapshot
  );

  const [selectedRunIds, setSelectedRunIds] = useState<string[]>(() =>
    runs.slice(0, 3).map((r) => r.id)
  );
  const [iterTitle, setIterTitle] = useState('');
  const [iterProblem, setIterProblem] = useState('');
  const [iterChange, setIterChange] = useState('');
  const [iterResult, setIterResult] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const plan = marketingPlan ?? createDefaultMarketingPlanState();
  const completedTasksCount = plan.tasks.filter((t) => t.completed).length;
  const customTasksCount = plan.tasks.filter((t) => t.isCustom).length;

  const linterRules = getAntywzorceRulesSpec();
  const deepResearchAgent = AGENTS.find((a) => a.id === 'deep-research')!;

  const activeRuns =
    selectedRunIds.length > 0
      ? runs.filter((r) => selectedRunIds.includes(r.id)).slice(0, 3)
      : runs.slice(0, 3);
  const resolvedRuns = activeRuns.length > 0 ? activeRuns : runs.slice(0, 3);

  const deepResearchRun =
    resolvedRuns.find((r) => r.agentId === 'deep-research') ??
    runs.find((r) => r.agentId === 'deep-research') ??
    resolvedRuns[0];
  const secondaryRuns = resolvedRuns
    .filter((r) => r.id !== deepResearchRun?.id)
    .slice(0, 2);

  const primaryScreenshots = screenshots.slice(0, 2);
  const extraScreenshots = screenshots.slice(2, 4);

  // Keep Slajd 9 scannable on 1 A4 page: prioritize user-added + key milestone iterations
  const displayIterations =
    iterations.length <= 6
      ? iterations
      : [...iterations.slice(0, 3), ...iterations.slice(-3)];

  const toggleRunSelection = (id: string) => {
    setSelectedRunIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleUploadScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = MAX_SCREENSHOTS - screenshots.length;
    if (remainingSlots <= 0) {
      setUploadError(
        `Możesz załączyć maksymalnie ${MAX_SCREENSHOTS} zrzuty ekranu (Slajd 7 i 8). Usuń jeden, aby dodać nowy.`
      );
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    const added: DeckScreenshot[] = [];

    for (const file of toProcess) {
      if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
        setUploadError(`Pominięto plik „${file.name}”. Obsługiwane formaty to PNG, JPG i WebP.`);
        continue;
      }
      if (file.size > 1.8 * 1024 * 1024) {
        setUploadError(`Plik „${file.name}” przekracza 1,8 MB. Zmniejsz zrzut przed osadzeniem w PDF.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        added.push({
          id: `shot-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now()}`,
          caption: cleanName || `Zrzut ekranu ${screenshots.length + added.length + 1}`,
          dataUrl,
        });
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : 'Nie udało się wczytać pliku obrazu.');
      }
    }

    if (added.length > 0) {
      const ok = saveScreenshotsToStore([...screenshots, ...added]);
      if (!ok) {
        setUploadError(
          'Brak miejsca w pamięci przeglądarki dla tak dużego zrzutu. Użyj mniejszego pliku PNG/JPG.'
        );
      }
    }
  };

  const handleUpdateShotCaption = (id: string, caption: string) => {
    saveScreenshotsToStore(
      screenshots.map((shot) => (shot.id === id ? { ...shot, caption } : shot))
    );
  };

  const handleRemoveShot = (id: string) => {
    setUploadError(null);
    saveScreenshotsToStore(screenshots.filter((shot) => shot.id !== id));
  };

  const handleAddIteration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iterTitle.trim() || !iterProblem.trim() || !iterChange.trim()) return;

    const nextIndex = iterations.length + 1;
    onAddIteration({
      id: `iter-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : nextIndex}`,
      date: `Iteracja ${nextIndex}`,
      title: iterTitle.trim(),
      problemObserved: iterProblem.trim(),
      configChange: iterChange.trim(),
      resultObserved: iterResult.trim() || 'Wdrożono poprawkę do konfiguracji systemu.',
    });

    setIterTitle('');
    setIterProblem('');
    setIterChange('');
    setIterResult('');
  };

  const handleExportHtmlDeck = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/project-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandContext,
          marketingPlan: plan,
          runs,
          selectedRunIds: resolvedRuns.map((r) => r.id),
          iterations,
          screenshots,
          liveAppUrl,
        }),
      });
      if (!res.ok) {
        throw new Error('Nie udało się wygenerować prezentacji HTML.');
      }
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projekt-zaliczeniowy-podrozowka.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(
        err instanceof Error ? err.message : 'Błąd podczas generowania prezentacji.'
      );
    } finally {
      setExporting(false);
    }
  };

  const renderCompactRunCard = (r: AgentRunRecord, maxChars: number) => {
    const findings = lintPodrozowkaCopy(r.output);
    const tells = scanHumanizerTells(r.output);
    return (
      <div key={r.id} className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-[#121926]">
            {r.agentName}{' '}
            <span className="font-mono font-normal text-[#646A75] tabular-nums">
              · {r.createdAt}
            </span>
          </div>
          <div className="text-[11px] font-medium text-[#15803D] tabular-nums">
            Linter: {findings.length} naruszeń · Humanizer: {tells.length} nawyków AI
          </div>
        </div>
        <p className="text-[11px] text-[#414751]">
          <strong className="text-[#121926]">Prompt:</strong> {compactText(r.prompt, 120)}
        </p>
        <div className="rounded-lg bg-white border border-[#E8E1D3] p-3 text-xs text-[#121926] whitespace-pre-wrap leading-relaxed">
          {compactText(r.output, maxChars)}
        </div>
        {r.sources && r.sources.length > 0 && (
          <p className="text-[11px] text-[#5B2182]">
            <strong>Źródła Google Search:</strong>{' '}
            {r.sources.map((s) => s.title).join(' · ')}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print bg-white border border-[#E8E1D3] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#5B2182]">
            Projekt Zaliczeniowy · 10 slajdów A4 (grafika + zwięzła treść)
          </p>
          <h2 className="text-xl font-bold text-[#121926] mt-1">
            Prezentacja Zaliczeniowa · {brandContext.companyName}
          </h2>
          <p className="text-sm text-[#414751] mt-1">
            Każdy slajd mieści się na 1 stronie A4 i odpowiada na 4 pytania projektu: funkcja
            systemu, technikalia konfiguracji, zrzuty z efektem użycia oraz historia iteracji.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportHtmlDeck}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Generowanie…' : 'Pobierz 10 slajdów (.html → PDF)'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drukuj / Zapisz PDF</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="no-print bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs px-4 py-3 rounded-xl">
          {exportError}
        </div>
      )}

      {/* Compact 4-point checklist */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {[
          '1. Co wdrożono i do czego (Slajdy 1–2)',
          '2. Konfiguracja i skille (Slajdy 3–5)',
          `3. Efekt użycia + zrzuty (${screenshots.length}/${MAX_SCREENSHOTS}, Slajdy 6–8)`,
          `4. Historia iteracji (${displayIterations.length} wpisów, Slajdy 9–10)`,
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532D] font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Controls: Live URL + Screenshots + Run Selector */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-6 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="deck-live-url"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#121926]"
            >
              <Link2 className="w-4 h-4 text-[#5B2182]" />
              <span>Link do działającej aplikacji webowej (Slajd 1 i Slajd 7)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="deck-live-url"
                type="url"
                value={liveAppUrl}
                onChange={(e) => saveLiveUrlToStore(e.target.value)}
                placeholder={DEFAULT_LIVE_APP_URL}
                className="flex-1 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-mono text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              />
              <button
                type="button"
                onClick={() => saveLiveUrlToStore(DEFAULT_LIVE_APP_URL)}
                title="Przywróć domyślny adres aplikacji"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#414751] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-xl transition-colors shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Domyślny</span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#F1ECE1] pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#121926]">
                  Zrzuty ekranu dashboardu (maks. {MAX_SCREENSHOTS}: Slajd 7 i 8)
                </h3>
                <p className="text-xs text-[#646A75]">
                  Pierwsze 2 trafiają w dużym formacie na Slajd 7, kolejne 2 na Slajd 8.
                </p>
              </div>
              <label
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  screenshots.length >= MAX_SCREENSHOTS
                    ? 'bg-[#F1ECE1] text-[#646A75] cursor-not-allowed'
                    : 'bg-[#FFBF00] hover:bg-[#F0B200] text-[#121926]'
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>
                  Dodaj zrzut ({screenshots.length}/{MAX_SCREENSHOTS})
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={screenshots.length >= MAX_SCREENSHOTS}
                  onChange={handleUploadScreenshots}
                  className="sr-only"
                />
              </label>
            </div>

            {uploadError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs px-3 py-2 rounded-xl">
                {uploadError}
              </div>
            )}

            {screenshots.length > 0 ? (
              <div className="space-y-2.5">
                {screenshots.map((shot, idx) => (
                  <div
                    key={shot.id}
                    className="flex items-center gap-3 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-2.5"
                  >
                    <div className="relative w-20 h-14 rounded-lg border border-[#E8E1D3] bg-white overflow-hidden shrink-0">
                      <Image
                        src={shot.dataUrl}
                        alt={shot.caption}
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-[11px] font-medium text-[#5B2182] mb-1">
                        Zrzut #{idx + 1} · {idx < 2 ? 'Slajd 7' : 'Slajd 8'}
                      </label>
                      <input
                        type="text"
                        value={shot.caption}
                        onChange={(e) => handleUpdateShotCaption(shot.id, e.target.value)}
                        className="w-full rounded-lg border border-[#E8E1D3] bg-white px-2.5 py-1.5 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveShot(shot.id)}
                      aria-label="Usuń zrzut ekranu"
                      className="p-2 text-[#646A75] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D8CEBB] bg-[#FAF6EA] px-4 py-3 text-xs text-[#646A75]">
                Dodaj zrzuty z aplikacji (np. Studio 8 Agentów, Plan 16-pkt, Raport GA4 Live,
                Generator Humanizer).
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-6 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[#121926]">
                Wybór próbek wyników do Slajdu 6 i 8 (maks. 3)
              </h3>
              <p className="text-xs text-[#646A75]">
                Badacz Rynku trafia na Slajd 6, a wygenerowany post/analiza na Slajd 8.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#5B2182] tabular-nums shrink-0">
              Wybrano: {resolvedRuns.length}/3
            </span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {runs.map((r) => {
              const checked = resolvedRuns.some((item) => item.id === r.id);
              const findings = lintPodrozowkaCopy(r.output);
              const tells = scanHumanizerTells(r.output);
              return (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#FFF9E2] border-[#FFBF00]'
                      : 'bg-[#FAF6EA] border-[#E8E1D3] hover:border-[#D8CEBB]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRunSelection(r.id)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#3B0754]"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#121926]">{r.agentName}</span>
                      <span className="font-mono text-[11px] text-[#646A75] tabular-nums">
                        {r.createdAt} · Linter {findings.length} · AI {tells.length}
                      </span>
                    </div>
                    <p className="text-[#414751] truncate">{r.prompt}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>
      </div>

      {/* Add Iteration Form */}
      <section className="no-print bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#121926]">
            Dopisz własną iterację (Slajd 9 prezentacji)
          </h3>
          <p className="text-xs text-[#646A75] mt-0.5">
            Krótko: co nie zadziałało, co zmieniono w konfiguracji i jaki był efekt.
          </p>
        </div>

        <form onSubmit={handleAddIteration} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            value={iterTitle}
            onChange={(e) => setIterTitle(e.target.value)}
            placeholder="Temat (np. Filtry UTM)"
            className="md:col-span-3 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            required
          />
          <input
            type="text"
            value={iterProblem}
            onChange={(e) => setIterProblem(e.target.value)}
            placeholder="Co nie zadziałało"
            className="md:col-span-3 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            required
          />
          <input
            type="text"
            value={iterChange}
            onChange={(e) => setIterChange(e.target.value)}
            placeholder="Zmiana w konfiguracji"
            className="md:col-span-3 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            required
          />
          <input
            type="text"
            value={iterResult}
            onChange={(e) => setIterResult(e.target.value)}
            placeholder="Efekt (opcjonalnie)"
            className="md:col-span-2 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
          />
          <button
            type="submit"
            className="md:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj</span>
          </button>
        </form>
      </section>

      {/* 10 SLIDES PREVIEW */}
      <div className="print-deck space-y-5">
        {/* SLIDE 1 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <p className="text-xs font-medium text-[#5B2182]">
                  Slajd 1 / 10 · Projekt Zaliczeniowy · podrozowka.pl
                </p>
                <h3 className="text-2xl font-bold text-[#121926] leading-tight">
                  Podróżówka AI: system marketingowy od planu do konwersji
                </h3>
                <p className="text-sm text-[#414751] leading-relaxed">
                  Dla marki <strong>Podróżówka</strong> (odwrócona pocztówka: kupowana w Polsce
                  przed wylotem, wręczana lokalsom w ich języku z kodem QR) zbudowałem kompletny
                  dashboard zamiast luźnych promptów w czacie.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={liveAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF2CC] border border-[#F5D26B] px-3.5 py-2.5 text-xs text-[#3B0754] hover:bg-[#FFE9A3] transition-colors"
                >
                  <span className="font-mono truncate">
                    <strong>App Live:</strong> {liveAppUrl}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#F1ECE1] text-xs">
                  <div>
                    <div className="text-lg font-bold text-[#121926] tabular-nums">
                      {AGENTS.length}
                    </div>
                    <div className="text-[#646A75]">agentów AI</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#121926] tabular-nums">
                      {plan.tasks.length}
                    </div>
                    <div className="text-[#646A75]">zadań planu</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#121926] tabular-nums">26</div>
                    <div className="text-[#646A75]">reguł Humanizera</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between gap-2">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#FAF6EA]">
                <Image
                  src="/images/deck/hero.jpg"
                  alt="Dashboard analityczny Podróżówki oraz odwrócona pocztówka"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-[#646A75]">
                Produkt: 4,99 zł/szt. (min. 8 szt. = 39,92 zł) · 105+ krajów · 89+ języków · awers
                ze zdjęciem Polski i podziękowaniem + rewers z kodem QR.
              </p>
            </div>
          </div>
        </article>

        {/* SLIDE 2 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 2 / 10 · Pytanie 1: Co wdrożyliście i do czego
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Funkcja rozwiązania i miejsce w codziennej pracy marketera
              </h3>
            </div>
            <span className="text-xs text-[#646A75]">Rytm pracy: 6 h/tydz. · 100% organic</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 space-y-3 text-xs text-[#414751]">
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-4">
                <p className="font-semibold text-[#121926] mb-1">
                  1. Problem, który rozwiązuje system
                </p>
                <p className="leading-relaxed">
                  Kupujący nie szukają w Google nazwy „odwrócona pocztówka”, a surowe czaty AI
                  porównywały kartkę do wizytówek i magnesów, zmyślały rabaty oraz obiecywały
                  wgrywanie zdjęć klienta.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-4">
                <p className="font-semibold text-[#121926] mb-1">2. Co dokładnie zbudowano</p>
                <p className="leading-relaxed">
                  Jedną aplikację webową łączącą Plan 16-pkt, Dokument Kontekstowy (Mózg Marki), 8
                  agentów AI, generator postów/rolek z filtrem <strong>Humanizer</strong> oraz
                  audyty na żywo (GSC, GA4, Meta, Google Ads).
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-4">
                <p className="font-semibold text-[#121926] mb-1">
                  3. Gdzie przydaje się w pracy
                </p>
                <p className="leading-relaxed">
                  Prowadzi operatora od wyboru zadania z planu, przez badanie intencji w Google i
                  publikację rolek z UTM, aż po ocenę koszyka w GA4 przed wydaniem budżetu na
                  reklamy.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] p-4 flex flex-col justify-between">
              <p className="text-xs font-semibold text-[#121926]">
                Obieg pracy w aplikacji (4 kroki)
              </p>
              <div className="space-y-2.5 my-2">
                {WORKFLOW_STEPS.map((w) => (
                  <div
                    key={w.step}
                    className="flex items-start gap-3 rounded-lg bg-white border border-[#E8E1D3] px-3 py-2"
                  >
                    <span className="font-mono text-xs font-bold text-[#5B2182] tabular-nums pt-0.5">
                      {w.step}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[#121926]">{w.title}</div>
                      <div className="text-[11px] text-[#646A75]">{w.note}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#5B2182]">
                Dokument Kontekstowy działa jako wsad systemu, a nie końcowy produkt.
              </p>
            </div>
          </div>
        </article>

        {/* SLIDE 3 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 3 / 10 · Pytanie 2: Konfiguracja (1/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Plan 16-punktowy (ICE) oraz wsad Dokumentu Kontekstowego (Mózg Marki)
              </h3>
            </div>
            <span className="text-xs text-[#646A75] tabular-nums">
              Zadania: {completedTasksCount}/{plan.tasks.length} · własne: {customTasksCount}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 space-y-2.5">
              <p className="text-xs font-semibold text-[#121926]">
                16-punktowy plan wdrożenia z oceną ICE i dodawaniem własnych zadań
              </p>
              <div className="rounded-xl border border-[#E8E1D3] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF6EA] border-b border-[#E8E1D3] text-[#121926]">
                      <th className="py-2 px-3 font-semibold">Etap</th>
                      <th className="py-2 px-3 font-semibold">Zakres i narzędzia</th>
                      <th className="py-2 px-3 font-semibold text-right">ICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1ECE1] bg-white">
                    {plan.stages.map((st) => (
                      <tr key={st.id}>
                        <td className="py-2 px-3 font-semibold text-[#121926] whitespace-nowrap">
                          {st.stepNumber}
                        </td>
                        <td className="py-2 px-3 text-[#414751]">
                          <span className="font-semibold text-[#121926]">{st.framework}:</span>{' '}
                          {st.title}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#5B2182] text-right tabular-nums">
                          {st.iceTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#646A75]">
                Obejmuje: GSC + GA4 + Clarity, Bing Webmaster Tools, SEO/GEO bez bloga (JSON-LD),
                KPI oraz 3 bramki walidacji (0 → 1) odblokowujące opinie i case studies.
              </p>
            </div>

            <div className="lg:col-span-5 rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-4 space-y-2.5">
              <p className="text-xs font-semibold text-[#121926]">
                Zawartość Mózgu Marki (11 sekcji w 4 blokach)
              </p>
              <div className="space-y-2">
                {CONTEXT_GROUPS.map((g) => (
                  <div
                    key={g.title}
                    className="rounded-lg bg-white border border-[#E8E1D3] px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-[#121926]">{g.title}</div>
                    <div className="text-[11px] text-[#414751] mt-0.5">{g.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* SLIDE 4 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 4 / 10 · Pytanie 2: Konfiguracja (2/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Technikalia: kod wstrzykiwania, Skill Humanizer, Linter i 8 Agentów AI
              </h3>
            </div>
            <span className="text-xs text-[#646A75]">Bramka: Linter regex + 26 reguł A–F</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 space-y-3 text-xs">
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-2">
                <p className="font-semibold text-[#121926]">
                  1. Wstrzykiwanie promptu i Skill <code className="font-mono">blader/humanizer</code>
                </p>
                <pre className="whitespace-pre-wrap font-mono text-[10.5px] bg-white border border-[#E8E1D3] rounded-lg p-2.5 text-[#121926] leading-relaxed">
{`buildBrandContextBlock(ctx) -> systemInstruction
// Wsad: Oferta + Reguły foto + Anty-persona + Twarde Zakazy

Skill blader/humanizer (grupy A–F):
- A–C: usuwa napuszony ton i puste przymiotniki („pasja”)
- D (§8, §15): blokuje myślniki AI i trójpodziały
- E–F: usuwa otwarcia z czatu („Oczywiście!”)`}
                </pre>
                <p className="text-[11px] text-[#414751]">
                  <strong>Fragment promptu Badacza:</strong>{' '}
                  <code className="font-mono text-[#3B0754]">
                    {compactText(deepResearchAgent.systemPrompt, 150)}
                  </code>
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-1.5">
                <p className="font-semibold text-[#121926]">
                  2. Walidacja w kodzie (<code className="font-mono">lintPodrozowkaCopy</code>)
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#414751]">
                  {linterRules.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-md bg-white border border-[#E8E1D3] px-2.5 py-1.5"
                    >
                      <span className="font-semibold text-[#991B1B]">{r.label}:</span>{' '}
                      {compactText(r.reason, 48)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] p-4 space-y-2.5">
              <p className="text-xs font-semibold text-[#121926]">
                3. Zespół {AGENTS.length} wyspecjalizowanych agentów w aplikacji
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AGENT_SHORT_CARDS.map((ag, idx) => (
                  <div
                    key={ag.name}
                    className="rounded-lg bg-white border border-[#E8E1D3] px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-[#121926]">
                      {idx + 1}. {ag.name}
                    </div>
                    <div className="text-[11px] text-[#414751] mt-0.5">{ag.scope}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* SLIDE 5 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 5 / 10 · Pytanie 2: Konfiguracja (3/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Narzędzia audytu na żywo (GSC, GA4, Meta, Google Ads) i Generator Social
              </h3>
            </div>
            <span className="text-xs text-[#646A75]">Human-in-the-loop dla budżetów</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#414751]">
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-1">
                <p className="font-semibold text-[#121926]">1. Search Console, Bing i Skaner</p>
                <p className="leading-relaxed">
                  Endpoint <code className="font-mono">/api/seo-geo/scan</code> sprawdza HTML{' '}
                  <code className="font-mono">/sklep</code> bez JS (cena 4,99 zł, FAQ i JSON-LD
                  Product).
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-1">
                <p className="font-semibold text-[#121926]">2. GA4 Live i Bank GROWS</p>
                <p className="leading-relaxed">
                  OAuth do usługi <code className="font-mono">podrozowka-production</code>: lejek
                  koszyka, próg 30 sesji i odsiew bramek P24/PayU/BLIK.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-1">
                <p className="font-semibold text-[#121926]">3. Meta Apps i Google Ads</p>
                <p className="leading-relaxed">
                  Bezpośrednia publikacja na Facebooku z UTM przez Meta Developers Apps oraz podgląd
                  Google Ads API v26 z ręczną akceptacją budżetu.
                </p>
              </div>
              <div className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3.5 space-y-1">
                <p className="font-semibold text-[#121926]">4. Generator Postów/Rolek + Humanizer</p>
                <p className="leading-relaxed">
                  Parametry: matryca 7 typów, karuzela 7 slajdów (ze Slajdem 6: zapowiedź tripu
                  01.2027), 1 z {PODROZOWKA_CATALOG.length} kadrów sklepu oraz rolki 9:16 po
                  Humanizerze.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-2">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#FAF6EA]">
                <Image
                  src="/images/deck/studio.jpg"
                  alt="Nagrywanie odwróconej pocztówki telefonem pod rolkę 9:16"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-[#646A75]">
                Scenariusze 9:16 pokazują awers ze zdjęciem Polski i podziękowaniem oraz rewers z
                kodem QR łączącym Podróżnika z Obdarowanym.
              </p>
            </div>
          </div>
        </article>

        {/* SLIDE 6 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 6 / 10 · Pytanie 3: Efekt użycia (1/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Wynik Badacza Rynku na żywo z Google Search Grounding
              </h3>
            </div>
            <span className="text-xs text-[#15803D] font-medium">
              Schemat: JTBD · CEP · [FAKT] vs [HIPOTEZA]
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between">
              {deepResearchRun && renderCompactRunCard(deepResearchRun, 660)}
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#FAF6EA]">
                <Image
                  src="/images/deck/baggage.jpg"
                  alt="Karta Podróżówki w kieszeni paszportu przy bagażu podręcznym"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="rounded-xl bg-[#FFF9E2] border border-[#FDE68A] p-3 text-xs text-[#414751]">
                <strong className="text-[#121926]">Wniosek wdrożony w nagłówkach:</strong> zamiast
                tłumaczyć definicję „odwróconej pocztówki”, startujemy od problemu bagażu 100 ml i
                kruszących się słodyczy.
              </div>
            </div>
          </div>
        </article>

        {/* SLIDE 7 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 7 / 10 · Pytanie 3: Efekt użycia (2/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Interaktywny dashboard na żywo: link produkcyjny i zrzuty ekranu
              </h3>
            </div>
            <span className="text-xs text-[#646A75] tabular-nums">
              Widok aplikacji ({primaryScreenshots.length} głównych zrzutów)
            </span>
          </div>

          <a
            href={liveAppUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF2CC] border border-[#F5D26B] px-4 py-2.5 text-xs text-[#3B0754] hover:bg-[#FFE9A3] transition-colors"
          >
            <span className="font-mono break-all">
              <strong>Link do interaktywnej aplikacji (Live):</strong> {liveAppUrl}
            </span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>

          {primaryScreenshots.length > 0 ? (
            <div
              className={`grid gap-4 ${
                primaryScreenshots.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {primaryScreenshots.map((shot) => (
                <div
                  key={shot.id}
                  className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-3 space-y-2"
                >
                  <div className="relative h-[280px] w-full rounded-lg border border-[#E8E1D3] bg-white overflow-hidden">
                    <Image
                      src={shot.dataUrl}
                      alt={shot.caption}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#121926]">{shot.caption}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8CEBB] bg-[#FAF6EA] p-6 text-xs text-[#414751]">
              Brak wgranych zrzutów ekranu. Dodaj 1–4 zrzuty w panelu powyżej, aby wyświetliły się
              tutaj w pełnym rozmiarze w pliku PDF.
            </div>
          )}
        </article>

        {/* SLIDE 8 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 8 / 10 · Pytanie 3: Efekt użycia (3/3)
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                {extraScreenshots.length > 0
                  ? 'Dodatkowe zrzuty ekranu oraz wygenerowany materiał po Humanizerze'
                  : 'Wygenerowane treści po filtrze Humanizer i Linterze Antywzorców'}
              </h3>
            </div>
            <span className="text-xs text-[#15803D] font-medium">
              Gotowe do publikacji z parametrami UTM
            </span>
          </div>

          {extraScreenshots.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extraScreenshots.map((shot) => (
                  <div
                    key={shot.id}
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-2.5 space-y-1.5"
                  >
                    <div className="relative h-[220px] w-full rounded-lg border border-[#E8E1D3] bg-white overflow-hidden">
                      <Image
                        src={shot.dataUrl}
                        alt={shot.caption}
                        fill
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-[#121926]">{shot.caption}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5 space-y-3">
                {secondaryRuns.slice(0, 1).map((r) => renderCompactRunCard(r, 420))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryRuns.map((r) => renderCompactRunCard(r, 480))}
            </div>
          )}
        </article>

        {/* SLIDE 9 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 9 / 10 · Pytanie 4: Historia iteracji
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Co nie działało, jak zmieniliśmy konfigurację i co się poprawiło
              </h3>
            </div>
            <span className="text-xs text-[#646A75] tabular-nums">
              {displayIterations.length} kluczowych iteracji (z {iterations.length} w dzienniku)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E8E1D3]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6EA] border-b border-[#E8E1D3] text-[#121926]">
                  <th className="py-2 px-3 font-semibold w-[22%]">Iteracja</th>
                  <th className="py-2 px-3 font-semibold w-[26%]">Co nie zadziałało</th>
                  <th className="py-2 px-3 font-semibold w-[28%]">Zmiana w konfiguracji</th>
                  <th className="py-2 px-3 font-semibold w-[24%]">Efekt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE1] bg-white">
                {displayIterations.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 align-top font-semibold text-[#121926]">
                      {it.title}
                    </td>
                    <td className="py-2 px-3 align-top text-[#414751]">
                      {compactText(it.problemObserved, 130)}
                    </td>
                    <td className="py-2 px-3 align-top text-[#414751]">
                      {compactText(it.configChange, 140)}
                    </td>
                    <td className="py-2 px-3 align-top text-[#15803D] font-medium">
                      {compactText(it.resultObserved, 120)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* SLIDE 10 / 10 */}
        <article className="print-slide bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
            <div>
              <p className="text-xs font-medium text-[#5B2182]">
                Slajd 10 / 10 · Podsumowanie Operacyjne i KPI
              </p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">
                Tygodniowy rytm pracy (6 h/tydz.) oraz metryki sukcesu podrozowka.pl
              </h3>
            </div>
            <span className="text-xs text-[#15803D] font-medium">
              Komplet 4 odpowiedzi w 10 slajdach
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs text-[#414751]">
            <div className="md:col-span-5 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-4 space-y-2">
              <p className="font-semibold text-[#121926]">Stały rytm pracy tygodniowej</p>
              <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                <li>
                  <strong>Plan i Mózg Marki:</strong> wybór kolejnego zadania z planu 16-pkt i
                  aktualizacja obserwacji z testów.
                </li>
                <li>
                  <strong>Google Search + Copywriter:</strong> nowe kąty z tabelą{' '}
                  <code className="font-mono text-[#3B0754]">TAK/NIE</code> i Linterem.
                </li>
                <li>
                  <strong>Social + Humanizer:</strong> posty i rolki 9:16 publikowane z tagiem UTM
                  przez Meta Apps.
                </li>
                <li>
                  <strong>GA4 + GROWS:</strong> ocena <code className="font-mono">add_to_cart</code>{' '}
                  przed decyzją o płatnym ruchu w Google Ads.
                </li>
              </ol>
            </div>

            <div className="md:col-span-7 rounded-xl border border-[#E8E1D3] overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF6EA] border-b border-[#E8E1D3] text-[#121926]">
                    <th className="py-2 px-3 font-semibold">Faza</th>
                    <th className="py-2 px-3 font-semibold">Metryka KPI</th>
                    <th className="py-2 px-3 font-semibold">Cel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1ECE1]">
                  {plan.kpis.slice(0, 4).map((kpi) => (
                    <tr key={kpi.metric}>
                      <td className="py-2 px-3 font-semibold text-[#121926] whitespace-nowrap">
                        {kpi.phase}
                      </td>
                      <td className="py-2 px-3 text-[#121926]">{kpi.metric}</td>
                      <td className="py-2 px-3 text-[#414751]">
                        {compactText(kpi.targetDefinition, 115)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3.5 text-xs text-[#14532D]">
            <strong>Podsumowanie zaliczeniowe (1–4):</strong> [1] Dashboard operacyjny zamiast
            suchego dokumentu (Slajdy 1–2) · [2] Kod wstrzykiwania, Linter, Skill Humanizer i 8
            agentów (Slajdy 3–5) · [3] Wyniki Google Search, link Live i zrzuty ekranu (Slajdy 6–8) ·
            [4] Historia iteracji i KPI (Slajdy 9–10).
          </div>
        </article>
      </div>
    </div>
  );
}
