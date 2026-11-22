'use client';

import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Feather,
  Globe,
  Play,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  AGENTS,
  AgentRunRecord,
  BrandContextData,
  GroundingSource,
} from '@/data/podrozowka-kb';
import {
  DEFAULT_VALIDATION_GATES,
  type ValidationGate,
} from '@/data/marketing-plan';
import { getPendingValidationGates } from '@/lib/brand-context';
import { CopyLintFinding, lintPodrozowkaCopy } from '@/lib/lint-copy';

interface AgentStudioPanelProps {
  brandContext: BrandContextData;
  validationGates?: ValidationGate[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  runs: AgentRunRecord[];
  onAddRun: (run: AgentRunRecord) => void;
  latestGa4Summary: string | null;
  latestGoogleAdsSummary: string | null;
  onSendToFacebook: (draftText: string) => void;
  onSendToHumanizer?: (draftText: string) => void;
  onOpenAnalytics: () => void;
  onOpenGoogleAds: () => void;
}

export default function AgentStudioPanel({
  brandContext,
  validationGates,
  selectedAgentId,
  onSelectAgent,
  runs,
  onAddRun,
  latestGa4Summary,
  latestGoogleAdsSummary,
  onSendToFacebook,
  onSendToHumanizer,
  onOpenAnalytics,
  onOpenGoogleAds,
}: AgentStudioPanelProps) {
  const activeAgent = AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0];
  const latestDeepResearchRun = runs.find((r) => r.agentId === 'deep-research') ?? null;
  const resolvedGates =
    validationGates && validationGates.length > 0 ? validationGates : DEFAULT_VALIDATION_GATES;
  const pendingGates = getPendingValidationGates(resolvedGates);
  const reviewsGatePassed =
    resolvedGates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';

  const [prompt, setPrompt] = useState(activeAgent.presets[0]?.prompt ?? '');
  const [includeGa4, setIncludeGa4] = useState(Boolean(activeAgent.supportsGa4 && latestGa4Summary));
  const [includeGoogleAds, setIncludeGoogleAds] = useState(
    Boolean((activeAgent.id === 'strateg-reklam' || activeAgent.supportsGa4) && latestGoogleAdsSummary)
  );
  const [includeDeepResearch, setIncludeDeepResearch] = useState(
    Boolean(activeAgent.supportsGa4 && latestDeepResearchRun)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastLint, setLastLint] = useState<CopyLintFinding[] | null>(null);

  const handleAgentSwitch = (id: string) => {
    onSelectAgent(id);
    const next = AGENTS.find((a) => a.id === id);
    if (next?.presets[0]) {
      setPrompt(next.presets[0].prompt);
    }
    setIncludeGa4(Boolean(next?.supportsGa4 && latestGa4Summary));
    setIncludeGoogleAds(Boolean((id === 'strateg-reklam' || next?.supportsGa4) && latestGoogleAdsSummary));
    setIncludeDeepResearch(Boolean(next?.supportsGa4 && latestDeepResearchRun));
    setErrorMsg(null);
    setLastLint(null);
  };

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setLastLint(null);

    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: activeAgent.id,
          prompt: prompt.trim(),
          brandContext,
          validationGates: resolvedGates,
          ga4Summary: includeGa4 && latestGa4Summary ? latestGa4Summary : undefined,
          googleAdsSummary:
            (activeAgent.id === 'strateg-reklam' || activeAgent.supportsGa4) &&
            includeGoogleAds &&
            latestGoogleAdsSummary
              ? latestGoogleAdsSummary
              : undefined,
          deepResearchSummary:
            activeAgent.supportsGa4 && includeDeepResearch && latestDeepResearchRun
              ? latestDeepResearchRun.output
              : undefined,
        }),
      });
      const data = (await res.json()) as {
        agentId?: string;
        agentName?: string;
        output?: string;
        sources?: GroundingSource[];
        lintFindings?: CopyLintFinding[];
        usedLiveGa4?: boolean;
        createdAt?: string;
        error?: string;
      };

      if (!res.ok || !data.output) {
        throw new Error(data.error || 'Nie udało się uruchomić agenta.');
      }

      const newRun: AgentRunRecord = {
        id: `run-${runs.length + 1}-${crypto.randomUUID()}`,
        agentId: data.agentId || activeAgent.id,
        agentName: data.agentName || activeAgent.name,
        prompt: prompt.trim(),
        output: data.output,
        sources: data.sources,
        usedLiveGa4: data.usedLiveGa4,
        createdAt: data.createdAt || new Date().toLocaleString('pl-PL'),
      };

      onAddRun(newRun);
      setLastLint(data.lintFindings ?? lintPodrozowkaCopy(data.output, { reviewsGatePassed }));
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Wystąpił błąd podczas komunikacji z agentem.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const agentRuns = runs.filter((r) => r.agentId === activeAgent.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: 7 Agent Selector */}
      <aside className="lg:col-span-4 bg-white border border-[#E8E1D3] rounded-2xl p-4 space-y-2">
        <div className="px-2 pb-2.5 border-b border-[#F1ECE1]">
          <h2 className="text-sm font-semibold text-[#121926]">
            Wybierz agenta ({AGENTS.length})
          </h2>
          <p className="text-xs text-[#646A75] mt-0.5">
            Wszyscy agenci czytają aktualny Mózg Marki Podróżówka.
          </p>
        </div>

        <div className="space-y-1">
          {AGENTS.map((agent) => {
            const active = agent.id === activeAgent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleAgentSwitch(agent.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#FFF2CC] text-[#121926] border border-[#F5D26B]'
                    : 'hover:bg-[#FAF6EA] text-[#414751] border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#121926] truncate">
                    {agent.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#5B2182] shrink-0">
                    {agent.moduleRef}
                  </span>
                </div>
                <p className="text-[11px] text-[#646A75] line-clamp-1 mt-0.5">{agent.role}</p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Prompt Execution & Output */}
      <section className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5 border-b border-[#F1ECE1] pb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
              <span className="font-semibold text-[#5B2182]">{activeAgent.moduleRef}</span>
              {activeAgent.useGoogleSearch && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#5B2182] font-medium">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Search Grounding na żywo</span>
                  </span>
                </>
              )}
              {activeAgent.supportsGa4 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#5B2182] font-medium">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analiza wg zasady-analizy.md</span>
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#121926]">{activeAgent.name}</h2>
            <p className="text-sm text-[#414751]">{activeAgent.summary}</p>
            {pendingGates.length > 0 && (
              <p className="text-xs text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-1.5 mt-2">
                Niezaliczone bramki walidacji ({pendingGates.map((g) => g.label).join(', ')}):
                odpowiedzi są oznaczane jako „HIPOTEZA – czeka na walidację”.
              </p>
            )}
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#121926]">Gotowe scenariusze uruchomienia</p>
            <div className="flex flex-wrap gap-2">
              {activeAgent.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPrompt(preset.prompt)}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* GA4 Live + Google Ads + Deep Research Triangulation Toggles */}
          {(activeAgent.supportsGa4 || activeAgent.id === 'strateg-reklam') && (
            <div className="space-y-3 bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl p-3.5">
              {activeAgent.supportsGa4 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {latestGa4Summary ? (
                    <>
                      <label className="flex items-center gap-2.5 text-xs font-medium text-[#121926] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeGa4}
                          onChange={(e) => setIncludeGa4(e.target.checked)}
                          className="rounded border-[#D5CCB8] accent-[#3B0754] focus:ring-[#FFBF00]"
                        />
                        <span>Dołącz pobrany raport na żywo z Google Analytics 4 (Źródło 3)</span>
                      </label>
                      <button
                        type="button"
                        onClick={onOpenAnalytics}
                        className="text-xs font-semibold text-[#5B2182] hover:text-[#3B0754] whitespace-nowrap shrink-0"
                      >
                        Odśwież dane GA4 →
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-[#414751]">
                        Brak załadowanych danych GA4 w bieżącej sesji. Możesz pobrać raport na żywo z podrozowka-production.
                      </span>
                      <button
                        type="button"
                        onClick={onOpenAnalytics}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFF2CC] border border-[#F5D26B] hover:bg-[#FFBF00] rounded-full transition-colors whitespace-nowrap shrink-0"
                      >
                        Połącz Google Analytics →
                      </button>
                    </>
                  )}
                </div>
              )}

              <div
                className={`${
                  activeAgent.supportsGa4 ? 'pt-2.5 border-t border-[#E8E1D3] ' : ''
                }flex flex-wrap items-center justify-between gap-3`}
              >
                {latestGoogleAdsSummary ? (
                  <>
                    <label className="flex items-center gap-2.5 text-xs font-medium text-[#121926] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeGoogleAds}
                        onChange={(e) => setIncludeGoogleAds(e.target.checked)}
                        className="rounded border-[#D5CCB8] accent-[#3B0754] focus:ring-[#FFBF00]"
                      />
                      <span>Dołącz raport kampanii Google Ads na żywo (Źródło 4)</span>
                    </label>
                    <button
                      type="button"
                      onClick={onOpenGoogleAds}
                      className="text-xs font-semibold text-[#5B2182] hover:text-[#3B0754] whitespace-nowrap shrink-0"
                    >
                      Odśwież Google Ads →
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-[#414751]">
                      Możesz zasilić agenta realnymi danymi kampanii i kosztów z Google Ads.
                    </span>
                    <button
                      type="button"
                      onClick={onOpenGoogleAds}
                      className="px-3.5 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFF2CC] border border-[#F5D26B] hover:bg-[#FFBF00] rounded-full transition-colors whitespace-nowrap shrink-0"
                    >
                      Połącz Google Ads →
                    </button>
                  </>
                )}
              </div>

              {activeAgent.supportsGa4 && latestDeepResearchRun && (
                <div className="pt-2.5 border-t border-[#E8E1D3] flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-[#121926] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDeepResearch}
                      onChange={(e) => setIncludeDeepResearch(e.target.checked)}
                      className="rounded border-[#D5CCB8] accent-[#3B0754] focus:ring-[#FFBF00]"
                    />
                    <span>
                      Dołącz raport Badacza Rynku (Źródło 2 · Triangulacja, z{' '}
                      {latestDeepResearchRun.createdAt})
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Prompt Textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1.5">
              Polecenie dla agenta
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Opisz dokładnie zadanie dla agenta (np. kąt tematyczny, segment podróżników, format tekstu)..."
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-2.5 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs p-3.5 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#646A75]">
              <ShieldCheck className="w-4 h-4 text-[#3B0754]" />
              <span>Automatyczna kontrola Antywzorców po wygenerowaniu</span>
            </span>
            <button
              type="button"
              onClick={handleRun}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Generowanie...' : 'Uruchom agenta'}</span>
            </button>
          </div>
        </div>

        {/* Antywzorce Result Banner */}
        {lastLint !== null && (
          <div
            className={`border rounded-2xl p-4 text-xs space-y-1.5 ${
              lastLint.some((f) => f.severity === 'error')
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                : lastLint.length > 0
                ? 'bg-[#FFF8E1] border-[#FDE68A] text-[#78350F]'
                : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
            }`}
          >
            {lastLint.length === 0 ? (
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                <span>
                  Linter Antywzorców: 0 naruszeń (brak porównań do wizytówek/magnesów, brak korporacyjnego bełkotu).
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-semibold">Wykryte uwagi Antywzorców:</p>
                {lastLint.map((f) => (
                  <p key={f.id}>
                    • <strong>{f.term}:</strong> {f.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Runs History */}
        <div className="space-y-4">
          {agentRuns.length === 0 ? (
            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[#121926]">
                Ten agent nie był jeszcze uruchamiany w tej sesji.
              </p>
              <p className="text-xs text-[#646A75]">
                Wybierz gotowy scenariusz powyżej i kliknij „Uruchom agenta”, aby zapisać wynik w bibliotece i prezentacji zaliczeniowej.
              </p>
            </div>
          ) : (
            agentRuns.map((run) => {
              const runFindings = lintPodrozowkaCopy(run.output, { reviewsGatePassed });
              return (
                <article
                  key={run.id}
                  className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                      <span className="font-semibold text-[#121926]">{run.agentName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{run.createdAt}</span>
                      {run.usedLiveGa4 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#5B2182] font-semibold">Z danymi GA4</span>
                        </>
                      )}
                      {runFindings.length === 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#15803D] font-medium">Czysty wg Antywzorców</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(run.id, run.output)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === run.id ? 'Skopiowano' : 'Kopiuj'}</span>
                      </button>
                      {onSendToHumanizer && (
                        <button
                          type="button"
                          onClick={() => onSendToHumanizer(run.output)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FFF2CC] hover:bg-[#FFEA9F] border border-[#E8D590] rounded-full transition-colors whitespace-nowrap shrink-0"
                        >
                          <Feather className="w-3.5 h-3.5" />
                          <span>Uczłowiecz</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSendToFacebook(run.output)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#3B0754] hover:bg-[#2D0540] rounded-full transition-colors whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-[#FFBF00]" />
                        <span>Wyślij na Facebooka</span>
                      </button>
                    </div>
                  </div>

                  <div className="agent-prose max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{run.output}</Markdown>
                  </div>

                  {run.sources && run.sources.length > 0 && (
                    <div className="border-t border-[#F1ECE1] pt-3 space-y-1.5">
                      <p className="text-xs font-semibold text-[#121926]">
                        Źródła z Google Search (Deep Research):
                      </p>
                      <ul className="space-y-1">
                        {run.sources.map((src) => (
                          <li key={src.uri}>
                            <a
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5B2182] hover:text-[#3B0754] hover:underline"
                            >
                              <span>{src.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
