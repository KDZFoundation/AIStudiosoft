'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  BookmarkPlus,
  CheckCircle2,
  Copy,
  Download,
  Film,
  Grid2x2,
  ImageIcon,
  Layers,
  Palette,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import {
  AgentRunRecord,
  BrandContextData,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import {
  buildSocialCardPreviewHtml,
  buildVerifiedBaselineDesignSystem,
  DesignSystemSnapshot,
  PROMPT_DIRECTOR_PRESETS,
  PromptDirectorWorkflow,
  TargetGenModel,
} from '@/lib/design-system';
import { CopyLintFinding, lintPodrozowkaCopy } from '@/lib/lint-copy';

interface DesignSystemPanelProps {
  brandContext: BrandContextData;
  onSaveRun: (run: AgentRunRecord) => void;
  onSendToFacebook: (draftText: string) => void;
}

type SubTabId = 'tokens' | 'director';

const WORKFLOW_OPTIONS: Array<{
  id: PromptDirectorWorkflow;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'exploration-4up',
    label: 'Eksploracja 4-up (2×2)',
    desc: '4 różne kierunki z jednego briefu przed wyborem finału',
    icon: Grid2x2,
  },
  {
    id: 'final-image',
    label: 'Final Image',
    desc: 'Kompletny prompt [GOAL/SUBJECT/LIGHT/LOCK] pod 1 kadr',
    icon: ImageIcon,
  },
  {
    id: 'image-edit',
    label: 'Edycja (Preserve/Change)',
    desc: 'Zachowuje 100% awersu lub rewersu QR, zmienia tło/scenerię',
    icon: Wand2,
  },
  {
    id: 'video-reel',
    label: 'Rolka 9:16 / Spot 15s',
    desc: '4 ujęcia z czasem, ruchem kamery i safe-zone Remotion',
    icon: Film,
  },
];

const MODEL_OPTIONS: Array<{ id: TargetGenModel; label: string }> = [
  { id: 'chatgpt-image-2.5', label: 'ChatGPT Image 2.5' },
  { id: 'nano-banana-2', label: 'Nano Banana 2 (Google)' },
  { id: 'kling-3.0', label: 'Kling 3.0 (Multi-shot Wideo)' },
  { id: 'seedance-2.5-remotion', label: 'Seedance 2.5 + Remotion' },
];

export default function DesignSystemPanel({
  brandContext,
  onSaveRun,
  onSendToFacebook,
}: DesignSystemPanelProps) {
  const [subTab, setSubTab] = useState<SubTabId>('tokens');
  const [designSystem, setDesignSystem] = useState<DesignSystemSnapshot>(() =>
    buildVerifiedBaselineDesignSystem()
  );
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  // Prompt Director state
  const defaultPreset = PROMPT_DIRECTOR_PRESETS[0];
  const [workflow, setWorkflow] = useState<PromptDirectorWorkflow>(defaultPreset.workflow);
  const [targetModel, setTargetModel] = useState<TargetGenModel>(defaultPreset.model);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16' | '16:9'>(
    defaultPreset.aspectRatio
  );
  const [selectedCardId, setSelectedCardId] = useState<string>(defaultPreset.cardId);
  const [brief, setBrief] = useState<string>(defaultPreset.brief);
  const [cardHeadline, setCardHeadline] = useState<string>(defaultPreset.cardHeadline);
  const [cardSubline, setCardSubline] = useState<string>(defaultPreset.cardSubline);
  const [cardCta, setCardCta] = useState<string>(defaultPreset.cardCta);
  const [includeQuestions, setIncludeQuestions] = useState<boolean>(true);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [directorOutput, setDirectorOutput] = useState<string | null>(null);
  const [directorFindings, setDirectorFindings] = useState<CopyLintFinding[] | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedToDeck, setSavedToDeck] = useState(false);

  const selectedRefImage = useMemo(() => {
    if (selectedCardId === 'reverse-qr') {
      return {
        url: '/images/rewers-podrozowka.png',
        label: 'Rewers z mapą, wpisem, zachętą i kodem QR (Podróżnik ↔ Obdarowany)',
      };
    }
    const card = PODROZOWKA_CATALOG.find((c) => c.id === selectedCardId) ?? PODROZOWKA_CATALOG[0];
    return {
      url: card.thumbUrl,
      label: `${card.category}: ${card.sampleTitle}`,
    };
  }, [selectedCardId]);

  const cardOverlayFindings = useMemo(
    () => lintPodrozowkaCopy(`${cardHeadline}\n${cardSubline}\n${cardCta}`),
    [cardHeadline, cardSubline, cardCta]
  );

  const previewHtml = useMemo(
    () =>
      buildSocialCardPreviewHtml({
        headline: cardHeadline || 'Pocztówka, która jedzie w drugą stronę.',
        subline:
          cardSubline ||
          '8 kartek = 39,92 zł · Ponad 105 krajów · 89+ języków · Bez rabatów progowych',
        ctaLabel: cardCta || 'Zobacz wzory →',
        badgeText:
          selectedCardId === 'reverse-qr'
            ? 'Rewers · Kod QR'
            : `Awers · ${PODROZOWKA_CATALOG.length} gotowych zdjęć`,
        imageUrl: selectedRefImage.url,
        aspectRatio,
        designSystem,
      }),
    [cardHeadline, cardSubline, cardCta, selectedCardId, selectedRefImage.url, aspectRatio, designSystem]
  );

  const handleLiveScan = async () => {
    setScanning(true);
    setScanError(null);
    setScanSuccess(null);
    try {
      const res = await fetch('/api/design-system/scan', { cache: 'no-store' });
      const data = (await res.json()) as {
        ok?: boolean;
        snapshot?: DesignSystemSnapshot;
        cssVariablesCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.snapshot) {
        throw new Error(data.error || 'Nie udało się zeskanować stylów podrozowka.pl.');
      }
      setDesignSystem(data.snapshot);
      setScanSuccess(
        `Zaktualizowano z produkcyjnego arkusza CSS (${data.cssVariablesCount ?? 0} zmiennych :root + WCAG AA).`
      );
    } catch (err: unknown) {
      setScanError(
        err instanceof Error ? err.message : 'Błąd połączenia ze stroną podrozowka.pl.'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(designSystem, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'podrozowka-design-tokens.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const lines = [
      `# Design System · ${designSystem.brandName} (${designSystem.sourceUrl})`,
      `Ostatni audyt: ${designSystem.scannedAt}`,
      `Arkusz produkcyjny [P]: ${designSystem.stylesheetUrl}`,
      '',
      '## 1. Kolory i kontrast WCAG AA (na tle kremowym)',
      ...designSystem.colorTokens.map(
        (t) =>
          `- **${t.token}** (\`${t.hex}\` / \`${t.rawValue}\`): ${t.role} | Kontrast: ${
            t.contrastOnCream ?? 'n/d'
          }:1 (${t.wcagAA}) | Źródło: [${t.status}] ${t.sourceNote}`
      ),
      '',
      '## 2. Typografia',
      ...designSystem.typography.map(
        (t) => `- **${t.role}**: \`${t.family}\` (${t.weights}) [${t.status}]`
      ),
      '',
      '## 3. Reguły produktowe i twarde zakazy wizualne',
      ...designSystem.productVisualRules.map((r) => `- ${r}`),
      '',
      '## 4. Rejestr luk i sprzeczności (BRAK: bez zgadywania)',
      ...designSystem.gapsAndContradictions.map(
        (g) => `- **${g.id} · ${g.area}** [${g.severity}]: ${g.detail} → *${g.actionRequired}*`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DESIGN_SYSTEM_podrozowka.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PROMPT_DIRECTOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setWorkflow(preset.workflow);
    setTargetModel(preset.model);
    setAspectRatio(preset.aspectRatio);
    setSelectedCardId(preset.cardId);
    setBrief(preset.brief);
    setCardHeadline(preset.cardHeadline);
    setCardSubline(preset.cardSubline);
    setCardCta(preset.cardCta);
    setGenError(null);
    setSavedToDeck(false);
  };

  const handleRunPromptDirector = async () => {
    if (!brief.trim()) return;
    setGenerating(true);
    setGenError(null);
    setSavedToDeck(false);

    try {
      const res = await fetch('/api/design-system/prompt-director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow,
          targetModel,
          aspectRatio,
          brief: brief.trim(),
          selectedCardId,
          includeDeepeningQuestions: includeQuestions,
          headlineOverlay: cardHeadline.trim(),
          sublineOverlay: cardSubline.trim(),
          brandContext,
          designSystem,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        output?: string;
        lintFindings?: CopyLintFinding[];
        generatedAt?: string;
        error?: string;
      };
      if (!res.ok || !data.output) {
        throw new Error(data.error || 'Nie udało się wygenerować promptu kreacji.');
      }
      setDirectorOutput(data.output);
      setDirectorFindings(data.lintFindings ?? lintPodrozowkaCopy(data.output));
      setGeneratedAt(data.generatedAt || new Date().toLocaleString('pl-PL'));
    } catch (err: unknown) {
      setGenError(
        err instanceof Error ? err.message : 'Błąd komunikacji z Prompt Directorem.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToStudioAndDeck = () => {
    if (!directorOutput) return;
    const wfLabel = WORKFLOW_OPTIONS.find((w) => w.id === workflow)?.label ?? workflow;
    onSaveRun({
      id: `run-ds-${crypto.randomUUID()}`,
      agentId: 'prompt-director',
      agentName: 'Prompt Director AI Gen (Obraz & Wideo)',
      prompt: `[Design System · ${wfLabel} · ${targetModel} · ${aspectRatio}] ${brief.trim()}`,
      output: directorOutput,
      createdAt: generatedAt || new Date().toLocaleString('pl-PL'),
    });
    setSavedToDeck(true);
  };

  const handleCopyOutput = async () => {
    if (!directorOutput) return;
    try {
      await navigator.clipboard.writeText(directorOutput);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadCardHtml = () => {
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karta-podrozowka-${aspectRatio.replace(':', 'x')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B2182] font-semibold">
            <span>Wiedza ze szkolenia · Design System &amp; Kreacje</span>
            <span aria-hidden="true">·</span>
            <span>Hierarchia źródeł [P] &gt; [Z] &gt; [M] &gt; [BRAK]</span>
          </div>
          <h2 className="text-xl font-bold text-[#121926]">
            Design System podrozowka.pl &amp; Prompt Director AI Gen
          </h2>
          <p className="text-sm text-[#414751]">
            Audyt rzeczywistych tokenów CSS strony sklepu (zero zgadywania HEX/fontów) oraz warsztat
            promptów 4-up 2×2, edycji referencji i rolek 9:16.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#FAF6EA] border border-[#E8E1D3] rounded-full shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('tokens')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'tokens'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'text-[#414751] hover:text-[#121926]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Design System [P]</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('director')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'director'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'text-[#414751] hover:text-[#121926]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Prompt Director &amp; Karty</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DESIGN SYSTEM */}
      {subTab === 'tokens' && (
        <div className="space-y-6">
          {/* Action bar */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[#414751] space-y-1">
              <p className="font-semibold text-[#121926]">
                Źródło produkcyjne [P]:{' '}
                <span className="font-mono font-normal text-[#5B2182]">
                  {designSystem.stylesheetUrl}
                </span>
              </p>
              <p>
                Status: {designSystem.isLiveScan ? 'Audyt na żywo CSS' : 'Zweryfikowany zapis bazowy'}{' '}
                · Data: <span className="font-mono tabular-nums">{designSystem.scannedAt}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLiveScan}
                disabled={scanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Skanowanie CSS…' : 'Skanuj CSS podrozowka.pl na żywo'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tokens .json</span>
              </button>
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>System .md</span>
              </button>
            </div>
          </div>

          {scanError && (
            <div className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs p-3.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {scanSuccess && (
            <div className="flex items-start gap-2.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532D] text-xs p-3.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D] mt-0.5" />
              <span>{scanSuccess}</span>
            </div>
          )}

          {/* Colors Grid + Contrast Table */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#121926]">
                  1. Paleta kolorów &amp; kontrast WCAG AA (zmienne CSS `:root`)
                </h3>
                <p className="text-xs text-[#646A75]">
                  Rzeczywiste barwy podrozowka.pl (ciepły papier, polska czerwień, zieleń szlaku i
                  złoto), bez mieszania z motywem panelu roboczego.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#5B2182]">
                {designSystem.colorTokens.length} tokenów
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {designSystem.colorTokens.map((tok) => (
                <div
                  key={tok.token}
                  className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg border border-[#D5CCB8] shrink-0"
                      style={{ backgroundColor: tok.hex }}
                      aria-label={`Próbka koloru ${tok.hex}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-[#121926] tabular-nums">
                        {tok.hex}
                      </p>
                      <p className="text-[11px] text-[#646A75] font-mono truncate">
                        {tok.rawValue}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#121926]">{tok.token}</p>
                    <p className="text-[11px] text-[#414751] leading-snug">{tok.role}</p>
                    <p className="text-[11px] font-mono tabular-nums text-[#5B2182]">
                      Kontrast na tle: {tok.contrastOnCream ?? 'n/d'}:1 · {tok.wcagAA} · [{tok.status}]
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography + Geometry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-[#121926] border-b border-[#F1ECE1] pb-3">
                2. Typografia produkcyjna (`podrozowka.pl`)
              </h3>
              <div className="divide-y divide-[#F1ECE1]">
                {designSystem.typography.map((tp) => (
                  <div key={tp.role} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#121926]">{tp.role}</span>
                      <span className="font-mono text-[#5B2182]">[{tp.status}]</span>
                    </div>
                    <p className="text-sm font-mono text-[#3B0754]">{tp.family}</p>
                    <p className="text-xs text-[#646A75]">
                      {tp.cssVar} · Wagi: {tp.weights} · {tp.sourceNote}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-[#121926] border-b border-[#F1ECE1] pb-3">
                3. Geometria, cienie i format druku
              </h3>
              <div className="space-y-3">
                {designSystem.geometryAndElevation.map((g) => (
                  <div
                    key={g.token}
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-3.5 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#121926]">{g.token}</span>
                      <span className="font-mono text-[#5B2182]">[{g.status}]</span>
                    </div>
                    <p className="font-mono text-[#3B0754] tabular-nums">{g.value}</p>
                    <p className="text-[#414751]">{g.usage}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Product Visual Rules & Gaps Register */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-6 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3">
              <h3 className="text-base font-bold text-[#121926] border-b border-[#F1ECE1] pb-3">
                4. Twarde reguły wizualne produktu (awers/rewers)
              </h3>
              <ul className="space-y-2 text-xs text-[#414751] leading-relaxed">
                {designSystem.productVisualRules.map((rule) => (
                  <li key={rule} className="rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] p-3">
                    {rule}
                  </li>
                ))}
              </ul>
            </section>

            <section className="lg:col-span-6 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3">
              <h3 className="text-base font-bold text-[#121926] border-b border-[#F1ECE1] pb-3">
                5. Rejestr luk i sprzeczności (zasada zero halucynacji)
              </h3>
              <div className="space-y-2.5">
                {designSystem.gapsAndContradictions.map((gap) => (
                  <div
                    key={gap.id}
                    className={`rounded-xl border p-3.5 text-xs space-y-1 ${
                      gap.severity === 'BRAK'
                        ? 'bg-[#FFF9E2] border-[#FDE68A]'
                        : 'bg-[#FAF6EA] border-[#E8E1D3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold text-[#121926]">
                      <span>
                        {gap.id}. {gap.area}
                      </span>
                      <span className="font-mono text-[#5B2182]">{gap.severity}</span>
                    </div>
                    <p className="text-[#414751] leading-relaxed">{gap.detail}</p>
                    <p className="font-medium text-[#121926]">{gap.actionRequired}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: PROMPT DIRECTOR & HTML PREVIEW */}
      {subTab === 'director' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-[#121926]">
              Gotowe scenariusze kreacji (eksploracja 4-up, edycja Preserve/Change, rolka 9:16):
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_DIRECTOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Prompt Director Controls */}
            <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
              {/* Workflow Type */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#121926]">
                  1. Wybierz tryb Prompt Directora (v1.0)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WORKFLOW_OPTIONS.map((wf) => {
                    const Icon = wf.icon;
                    const active = workflow === wf.id;
                    return (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() => setWorkflow(wf.id)}
                        className={`text-left rounded-xl border p-3 transition-colors ${
                          active
                            ? 'bg-[#FFF2CC] border-[#F5D26B] text-[#121926]'
                            : 'bg-[#FAF6EA] border-[#E8E1D3] text-[#414751] hover:border-[#D5CCB8]'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#121926]">
                          <Icon className="w-3.5 h-3.5 text-[#3B0754] shrink-0" />
                          <span>{wf.label}</span>
                        </div>
                        <p className="text-[11px] text-[#646A75] mt-1 leading-snug">{wf.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model + Aspect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#121926] mb-1.5">
                    2. Docelowy model generacji
                  </label>
                  <select
                    value={targetModel}
                    onChange={(e) => setTargetModel(e.target.value as TargetGenModel)}
                    className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  >
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#121926] mb-1.5">
                    3. Proporcje kadru
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(['1:1', '4:5', '9:16', '16:9'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-2 text-xs font-mono font-semibold rounded-xl border transition-colors ${
                          aspectRatio === ratio
                            ? 'bg-[#FFBF00] border-[#FFBF00] text-[#121926]'
                            : 'bg-[#FAF6EA] border-[#E8E1D3] text-[#414751] hover:bg-[#FFF2CC]'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reference Visual Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#121926]">
                  4. Kadr referencyjny sklepu ({PODROZOWKA_CATALOG.length} gotowych zdjęć lub Rewers QR, zero uploadu klienta)
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCardId('reverse-qr')}
                    className={`shrink-0 w-24 rounded-xl border p-1.5 text-left transition-colors ${
                      selectedCardId === 'reverse-qr'
                        ? 'border-[#3B0754] bg-[#FFF2CC]'
                        : 'border-[#E8E1D3] bg-[#FAF6EA] hover:border-[#D5CCB8]'
                    }`}
                  >
                    <div className="relative h-14 w-full rounded-lg overflow-hidden bg-white">
                      <Image
                        src="/images/rewers-podrozowka.png"
                        alt="Rewers Podróżówki z kodem QR"
                        fill
                        sizes="96px"
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-[#121926] mt-1 truncate">
                      Rewers + QR
                    </p>
                  </button>

                  {PODROZOWKA_CATALOG.map((card) => {
                    const selected = selectedCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className={`shrink-0 w-24 rounded-xl border p-1.5 text-left transition-colors ${
                          selected
                            ? 'border-[#3B0754] bg-[#FFF2CC]'
                            : 'border-[#E8E1D3] bg-[#FAF6EA] hover:border-[#D5CCB8]'
                        }`}
                      >
                        <div className="relative h-14 w-full rounded-lg overflow-hidden bg-white">
                          <Image
                            src={card.thumbUrl}
                            alt={card.sampleTitle}
                            fill
                            sizes="96px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <p className="text-[10px] font-semibold text-[#121926] mt-1 truncate">
                          {card.category}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brief */}
              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1.5">
                  5. Brief sceny lub ujęcia wideo
                </label>
                <textarea
                  rows={4}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Opisz scenkę przedwyjazdową, kontekst wręczenia kartki gospodarzowi lub problem bagażu podręcznego..."
                  className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-2.5 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-[#414751] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeQuestions}
                    onChange={(e) => setIncludeQuestions(e.target.checked)}
                    className="rounded accent-[#3B0754]"
                  />
                  <span>Dołącz 3 pytania pogłębiające art-directora przed finałem</span>
                </label>

                <button
                  type="button"
                  onClick={handleRunPromptDirector}
                  disabled={generating || !brief.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{generating ? 'Reżyserowanie…' : 'Generuj Prompt & Scenopis'}</span>
                </button>
              </div>

              {genError && (
                <div className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs p-3.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}
            </section>

            {/* Right: Live HTML Card Preview */}
            <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5B2182]" />
                  <h3 className="text-sm font-bold text-[#121926]">
                    Podgląd Karty HTML (Design System [P])
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCardHtml}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz HTML</span>
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#F2ECE1]">
                <iframe
                  title="Podgląd karty kreacji Podróżówka w Design Systemie [P]"
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-[460px] border-0"
                />
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#121926] mb-1">
                    Nagłówek karty (Playfair Display)
                  </label>
                  <input
                    type="text"
                    value={cardHeadline}
                    onChange={(e) => setCardHeadline(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#121926] mb-1">
                    Podtytuł i oferta (Inter)
                  </label>
                  <input
                    type="text"
                    value={cardSubline}
                    onChange={(e) => setCardSubline(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#121926] mb-1">
                    Przycisk CTA (--polish-red #C52020)
                  </label>
                  <input
                    type="text"
                    value={cardCta}
                    onChange={(e) => setCardCta(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                </div>
              </div>

              {cardOverlayFindings.length > 0 ? (
                <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs p-3 rounded-xl space-y-1">
                  <p className="font-semibold">Linter Antywzorców na karcie HTML:</p>
                  {cardOverlayFindings.map((f) => (
                    <p key={f.id}>
                      • <strong>{f.term}:</strong> {f.reason}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#14532D] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span>Nakładka karty zgodna z Design Systemem i Kartą Głosu (0 naruszeń).</span>
                </div>
              )}
            </section>
          </div>

          {/* Director Result */}
          {directorOutput && (
            <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-3">
                <div className="text-xs text-[#646A75] space-y-0.5">
                  <p className="text-sm font-bold text-[#121926]">
                    Gotowy brief i prompty Prompt Directora
                  </p>
                  <p className="font-mono tabular-nums">
                    Wygenerowano: {generatedAt} · Model docelowy: {targetModel} · Format: {aspectRatio}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedPrompt ? 'Skopiowano' : 'Kopiuj całość'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToStudioAndDeck}
                    disabled={savedToDeck}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{savedToDeck ? 'Zapisano do Prezentacji' : 'Zapisz w Prezentacji'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToFacebook(directorOutput)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#3B0754] hover:bg-[#2D0540] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FFBF00]" />
                    <span>Wyślij na Facebooka</span>
                  </button>
                </div>
              </div>

              {directorFindings && (
                <div
                  className={`rounded-xl border p-3.5 text-xs ${
                    directorFindings.length === 0
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
                      : 'bg-[#FFF8E1] border-[#FDE68A] text-[#78350F]'
                  }`}
                >
                  {directorFindings.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                      Linter Antywzorców: 0 naruszeń w promptach i tekstach kreacji.
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold">Uwagi Lintera Antywzorców:</p>
                      {directorFindings.map((f) => (
                        <p key={f.id}>
                          • <strong>{f.term}:</strong> {f.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="agent-prose max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{directorOutput}</Markdown>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
