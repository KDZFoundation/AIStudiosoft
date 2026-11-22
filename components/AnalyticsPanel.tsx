'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { User } from 'firebase/auth';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookmarkPlus,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getGoogleAccessToken,
  googleSignIn,
  googleSignOut,
  initGoogleAuth,
} from '@/lib/google-auth';
import type { Ga4PropertyItem } from '@/app/api/analytics/properties/route';
import type { Ga4ReportPayload } from '@/app/api/analytics/report/route';
import { AgentRunRecord, BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import {
  calcIce,
  createDefaultModule5State,
  formatModule5Markdown,
  GrowsDataSource,
  GrowsExperimentItem,
  GrowsExperimentStatus,
  mergeModule5State,
  MODULE5_MODES,
  MODULE5_STORAGE_KEY,
  Module5AnalysisMode,
  Module5PersistedState,
} from '@/lib/module5-analytics';

interface AnalyticsPanelProps {
  brandContext?: BrandContextData;
  onSendReportToAgent: (summaryForAgent: string) => void;
  onSaveRun?: (run: AgentRunRecord) => void;
}

type SubTabId = 'ga4-live' | 'decision-loop' | 'grows-bank';

const PAYMENT_GATEWAY_PATTERN =
  /(przelewy24|payu|stripe|autopay|tpay|imoje|blik|dotpay|paypal|santander|mbank|ing\.pl|pekao)/i;

const STATUS_META: Record<
  GrowsExperimentStatus,
  { label: string; next: GrowsExperimentStatus; badgeClass: string }
> = {
  planned: {
    label: 'Planowany',
    next: 'running',
    badgeClass: 'bg-[#FAF6EA] text-[#414751] border-[#E8E1D3]',
  },
  running: {
    label: 'W teście',
    next: 'won',
    badgeClass: 'bg-[#FFF2CC] text-[#3B0754] border-[#FDE68A]',
  },
  won: {
    label: 'Wygrany',
    next: 'dropped',
    badgeClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  },
  dropped: {
    label: 'Odrzucony',
    next: 'planned',
    badgeClass: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
  },
};

function subscribeM5Store(onChange: () => void) {
  window.addEventListener('podrozowka-m5-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-m5-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function AnalyticsPanel({
  brandContext,
  onSendReportToAgent,
  onSaveRun,
}: AnalyticsPanelProps) {
  const activeBrand = brandContext ?? DEFAULT_BRAND_CONTEXT;

  // Sub-navigation
  const [subTab, setSubTab] = useState<SubTabId>('ga4-live');

  // GA4 OAuth & live data state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getGoogleAccessToken()
  );
  const [properties, setProperties] = useState<Ga4PropertyItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [manualPropertyId, setManualPropertyId] = useState<string>('');
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [report, setReport] = useState<Ga4ReportPayload | null>(null);
  const [loadingProps, setLoadingProps] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enableApiUrl, setEnableApiUrl] = useState<string | null>(null);

  // Module 5 persisted GROWS & Hygiene store
  const [fallbackState] = useState<Module5PersistedState>(() =>
    createDefaultModule5State()
  );
  const stateCacheRef = useRef<{ raw: string | null; value: Module5PersistedState }>({
    raw: null,
    value: fallbackState,
  });

  const getM5Snapshot = useCallback((): Module5PersistedState => {
    try {
      const raw = localStorage.getItem(MODULE5_STORAGE_KEY);
      if (!raw) return fallbackState;
      if (stateCacheRef.current.raw === raw) return stateCacheRef.current.value;
      const merged = mergeModule5State(
        JSON.parse(raw) as Partial<Module5PersistedState>
      );
      stateCacheRef.current = { raw, value: merged };
      return merged;
    } catch {
      return fallbackState;
    }
  }, [fallbackState]);

  const m5State = useSyncExternalStore(
    subscribeM5Store,
    getM5Snapshot,
    () => fallbackState
  );

  const persistM5State = useCallback((next: Module5PersistedState) => {
    const stamped: Module5PersistedState = {
      ...next,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    try {
      const serialized = JSON.stringify(stamped);
      localStorage.setItem(MODULE5_STORAGE_KEY, serialized);
      stateCacheRef.current = { raw: serialized, value: stamped };
      window.dispatchEvent(new Event('podrozowka-m5-change'));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  // Decision loop state
  const [analysisMode, setAnalysisMode] = useState<Module5AnalysisMode>(
    () => m5State.lastDecisionMode || 'three-sentence-diagnosis'
  );
  const [customQuestion, setCustomQuestion] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [copiedDecision, setCopiedDecision] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false);

  // New custom GROWS experiment state
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState<GrowsDataSource>('GA4');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newImpact, setNewImpact] = useState(8);
  const [newConfidence, setNewConfidence] = useState(7);
  const [newEase, setNewEase] = useState(8);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addedToBankNotice, setAddedToBankNotice] = useState(false);

  const loadProperties = useCallback(async (token: string) => {
    setLoadingProps(true);
    setErrorMsg(null);
    setEnableApiUrl(null);
    try {
      const res = await fetch('/api/analytics/properties', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = (await res.json()) as {
        properties?: Ga4PropertyItem[];
        error?: string;
        enableUrl?: string;
      };

      if (res.ok && data.properties) {
        setProperties(data.properties);
        if (data.properties.length > 0) {
          setSelectedPropertyId((prev) => prev || data.properties![0].propertyId);
        }
        return;
      }

      if (res.status === 403 && data.enableUrl) {
        setErrorMsg(data.error || 'Google Analytics Admin API wymaga włączenia.');
        setEnableApiUrl(data.enableUrl);
        return;
      }

      const directRes = await fetch(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=100',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (directRes.ok) {
        const directData = (await directRes.json()) as {
          accountSummaries?: Array<{
            displayName?: string;
            propertySummaries?: Array<{ property?: string; displayName?: string }>;
          }>;
        };
        const items: Ga4PropertyItem[] = [];
        for (const acc of directData.accountSummaries ?? []) {
          for (const p of acc.propertySummaries ?? []) {
            const id = (p.property || '').replace(/^properties\//, '');
            if (id) {
              items.push({
                propertyId: id,
                displayName: p.displayName || `Property ${id}`,
                accountName: acc.displayName || 'Google Analytics',
              });
            }
          }
        }
        setProperties(items);
        if (items.length > 0) {
          setSelectedPropertyId((prev) => prev || items[0].propertyId);
        }
        return;
      }

      setErrorMsg(
        data.error ||
          'Nie udało się pobrać listy usług z Google Analytics Admin API. Możesz wpisać Property ID ręcznie.'
      );
    } catch {
      setErrorMsg(
        'Nie udało się pobrać listy usług GA4. Wpisz numeryczne Property ID ręcznie poniżej.'
      );
    } finally {
      setLoadingProps(false);
    }
  }, []);

  const loadReport = useCallback(
    async (token: string, propertyId: string, rangeDays: number) => {
      if (!propertyId || !/^\d+$/.test(propertyId)) return;
      setLoadingReport(true);
      setErrorMsg(null);
      setEnableApiUrl(null);
      try {
        const res = await fetch('/api/analytics/report', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ propertyId, days: rangeDays }),
        });
        const data = (await res.json()) as Ga4ReportPayload & {
          error?: string;
          enableUrl?: string;
        };
        if (!res.ok) {
          if (data.enableUrl) setEnableApiUrl(data.enableUrl);
          throw new Error(data.error || 'Błąd pobierania raportu GA4.');
        }
        setReport(data);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Nie udało się pobrać danych raportu GA4.'
        );
      } finally {
        setLoadingReport(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsub = initGoogleAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      (maybeUser) => {
        setUser(maybeUser);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    (async () => {
      await loadProperties(accessToken);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [accessToken, loadProperties]);

  useEffect(() => {
    if (!accessToken || !selectedPropertyId) return;
    let active = true;
    (async () => {
      await loadReport(accessToken, selectedPropertyId, days);
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [accessToken, selectedPropertyId, days, loadReport]);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setEnableApiUrl(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Logowanie Google zostało przerwane.'
      );
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setProperties([]);
    setSelectedPropertyId('');
    setReport(null);
  };

  const handleApplyManualProperty = () => {
    const cleaned = manualPropertyId.trim().replace(/^properties\//, '');
    if (!/^\d+$/.test(cleaned)) {
      setErrorMsg('Podaj prawidłowe numeryczne Property ID (tylko cyfry, np. 456789123).');
      return;
    }
    setSelectedPropertyId(cleaned);
  };

  const funnelStages = useMemo(() => {
    if (!report) return [];
    const lookup = (name: string) =>
      report.funnelEvents.find((e) => e.eventName === name)?.count ?? 0;

    return [
      { key: 'page_view', label: 'Odsłony (page_view)', value: lookup('page_view') },
      { key: 'view_item', label: 'Karta produktu (view_item)', value: lookup('view_item') },
      { key: 'add_to_cart', label: 'Dodanie do koszyka (add_to_cart)', value: lookup('add_to_cart') },
      { key: 'begin_checkout', label: 'Start zamówienia (begin_checkout)', value: lookup('begin_checkout') },
      { key: 'purchase', label: 'Zakupy (purchase)', value: lookup('purchase') },
    ];
  }, [report]);

  const paymentReferrals = useMemo(() => {
    if (!report) return [];
    return report.sources.filter((s) => PAYMENT_GATEWAY_PATTERN.test(s.source));
  }, [report]);

  const sortedExperiments = useMemo(() => {
    return [...m5State.experiments].sort(
      (a, b) =>
        calcIce(b.impact, b.confidence, b.ease) -
        calcIce(a.impact, a.confidence, a.ease)
    );
  }, [m5State.experiments]);

  const hygieneDoneCount = useMemo(
    () => m5State.hygiene.filter((h) => h.done).length,
    [m5State.hygiene]
  );

  const handleRunDecisionLoop = async (overrideMode?: Module5AnalysisMode) => {
    const modeToRun = overrideMode ?? analysisMode;
    setDeciding(true);
    setDecisionError(null);
    setCopiedDecision(false);
    setSavedToHistory(false);
    try {
      const res = await fetch('/api/analytics/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: modeToRun,
          brandContext: activeBrand,
          ga4Summary: report?.summaryForAgent ?? null,
          totalSessions: report?.overview.sessions ?? null,
          paymentReferrals: paymentReferrals.map((r) => r.source),
          clarityAndGscNotes: m5State.clarityAndGscNotes,
          customQuestion,
        }),
      });
      const data = (await res.json()) as { output?: string; error?: string };
      if (!res.ok || !data.output) {
        throw new Error(data.error || 'Nie udało się wygenerować analizy GA4.');
      }

      persistM5State({
        ...m5State,
        lastDecisionOutput: data.output,
        lastDecisionMode: modeToRun,
        lastDecisionAt: new Date().toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (err: unknown) {
      setDecisionError(
        err instanceof Error ? err.message : 'Błąd połączenia z Pętlą Decyzyjną AI.'
      );
    } finally {
      setDeciding(false);
    }
  };

  const handleSaveDecisionToHistory = () => {
    if (!m5State.lastDecisionOutput || !onSaveRun) return;
    const modeMeta = MODULE5_MODES.find((m) => m.id === m5State.lastDecisionMode);
    onSaveRun({
      id: `m5-${Date.now()}`,
      agentId: 'analityk-konwersji',
      agentName: `GA4 · ${modeMeta?.label ?? 'Pętla Decyzyjna'}`,
      prompt: [
        report ? `GA4 (${report.days} dni, ${report.overview.sessions} sesji)` : 'Brak GA4 (tryb notatek)',
        m5State.clarityAndGscNotes ? 'Notatki Clarity/GSC załączone' : '',
        customQuestion ? `Pytanie: ${customQuestion}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      output: m5State.lastDecisionOutput,
      createdAt: new Date().toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setSavedToHistory(true);
  };

  const handleCopyDecision = async () => {
    if (!m5State.lastDecisionOutput) return;
    try {
      await navigator.clipboard.writeText(m5State.lastDecisionOutput);
      setCopiedDecision(true);
      setTimeout(() => setCopiedDecision(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleToggleHygiene = (id: string) => {
    persistM5State({
      ...m5State,
      hygiene: m5State.hygiene.map((h) =>
        h.id === id ? { ...h, done: !h.done } : h
      ),
    });
  };

  const handleCycleStatus = (id: string) => {
    persistM5State({
      ...m5State,
      experiments: m5State.experiments.map((exp) =>
        exp.id === id
          ? { ...exp, status: STATUS_META[exp.status].next }
          : exp
      ),
    });
  };

  const handleUpdateStudyNotes = (id: string, studyNotes: string) => {
    persistM5State({
      ...m5State,
      experiments: m5State.experiments.map((exp) =>
        exp.id === id ? { ...exp, studyNotes } : exp
      ),
    });
  };

  const handleAddExperiment = () => {
    if (!newTitle.trim() || !newHypothesis.trim()) return;
    const item: GrowsExperimentItem = {
      id: `exp-custom-${Date.now()}`,
      title: newTitle.trim(),
      source: newSource,
      hypothesis: newHypothesis.trim(),
      metric: newMetric.trim() || 'add_to_cart / view_item (%)',
      impact: newImpact,
      confidence: newConfidence,
      ease: newEase,
      status: 'planned',
      studyNotes: '',
      isCustom: true,
    };
    persistM5State({
      ...m5State,
      experiments: [item, ...m5State.experiments],
    });
    setNewTitle('');
    setNewHypothesis('');
    setNewMetric('');
    setShowAddForm(false);
    setAddedToBankNotice(true);
    setTimeout(() => setAddedToBankNotice(false), 2500);
  };

  const handlePrefillExperimentFromDecision = () => {
    const modeLabel =
      MODULE5_MODES.find((m) => m.id === m5State.lastDecisionMode)?.label ?? 'GA4';
    setNewTitle(`Hipoteza z AI (${modeLabel})`);
    setNewSource(report ? 'GA4' : 'Clarity');
    setNewHypothesis(m5State.lastDecisionOutput.slice(0, 320));
    setNewMetric('add_to_cart (min. 8 szt.) → purchase');
    setShowAddForm(true);
    setSubTab('grows-bank');
  };

  const handleDeleteCustomExperiment = (id: string) => {
    persistM5State({
      ...m5State,
      experiments: m5State.experiments.filter((exp) => exp.id !== id),
    });
  };

  const handleExportMarkdown = () => {
    const content = formatModule5Markdown(m5State);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podrozowka-ga4-grows-${m5State.updatedAt}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetM5 = () => {
    const fresh = createDefaultModule5State();
    persistM5State(fresh);
  };

  return (
    <div className="space-y-6">
      {/* Header + Auth Controls + Subtab Switcher */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#5B2182] tracking-wide">
              Analityka GA4 · zasady-analizy.md &amp; Pętla GROWS
            </p>
            <h2 className="text-xl font-bold text-[#121926] mt-0.5">
              Analityka GA4 (podrozowka-production) &amp; Decyzje ICE
            </h2>
            <p className="text-sm text-[#414751] mt-1">
              Odczyt na żywo bez halucynacji, próg 30 sesji, detekcja bramek płatności oraz bank hipotez GROWS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {accessToken ? (
              <>
                {user?.email && (
                  <span className="text-xs font-medium text-[#646A75] px-2">
                    {user.email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    selectedPropertyId
                      ? loadReport(accessToken, selectedPropertyId, days)
                      : loadProperties(accessToken)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Odśwież GA4</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Wyloguj</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Zaloguj przez Google (GA4)</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F1ECE1]">
          <button
            type="button"
            onClick={() => setSubTab('ga4-live')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'ga4-live'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'bg-[#FAF6EA] text-[#414751] hover:bg-[#FFF2CC] border border-[#E8E1D3]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Raport GA4 na żywo</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('decision-loop')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'decision-loop'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'bg-[#FAF6EA] text-[#414751] hover:bg-[#FFF2CC] border border-[#E8E1D3]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pętla Decyzyjna AI (Reguła 3 zdań)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('grows-bank')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'grows-bank'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'bg-[#FAF6EA] text-[#414751] hover:bg-[#FFF2CC] border border-[#E8E1D3]'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>
              Bank Eksperymentów GROWS &amp; Higiena ({hygieneDoneCount}/{m5State.hygiene.length})
            </span>
          </button>
        </div>

        {/* Property Selector & Period (when authed & on GA4 tab) */}
        {accessToken && subTab === 'ga4-live' && (
          <div className="flex flex-wrap items-end justify-between gap-4 pt-3 border-t border-[#F1ECE1]">
            <div className="flex flex-wrap items-end gap-3">
              {properties.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                    Usługa GA4 ({properties.length})
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    disabled={loadingProps}
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-medium text-[#121926] min-w-[260px] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  >
                    {properties.map((p) => (
                      <option key={p.propertyId} value={p.propertyId}>
                        {p.displayName} ({p.propertyId}) · {p.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                  Lub wpisz Property ID ręcznie
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualPropertyId}
                    onChange={(e) => setManualPropertyId(e.target.value)}
                    placeholder="np. 456789123"
                    className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs font-mono text-[#121926] w-36 focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyManualProperty}
                    className="px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    Wczytaj ID
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#FAF6EA] border border-[#E8E1D3] rounded-full">
              {([7, 28, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                    days === d
                      ? 'bg-[#FFBF00] text-[#121926] font-semibold'
                      : 'text-[#414751] hover:text-[#121926]'
                  }`}
                >
                  Ostatnie {d} dni
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {errorMsg && (
        <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-2xl p-4 text-xs text-[#78350F] space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          {enableApiUrl && (
            <a
              href={enableApiUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#5B2182] hover:text-[#3B0754] hover:underline"
            >
              <span>Włącz API w Google Cloud Console (podrozowka-production)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* SUBTAB 1: GA4 LIVE */}
      {subTab === 'ga4-live' && (
        <>
          {!accessToken ? (
            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-center space-y-4">
              <p className="text-sm font-semibold text-[#121926]">
                Zaloguj się kontem Google powiązanym z GA4 podrozowka.pl
              </p>
              <p className="text-xs text-[#414751] max-w-xl mx-auto leading-relaxed">
                Po autoryzacji wyłącznie w trybie odczytu (scope{' '}
                <code className="font-mono text-[#3B0754]">analytics.readonly</code>) pobierzemy sesje, lejek zakupowy, źródła UTM, top podstrony, urządzenia i kraje. Jeśli nie masz teraz dostępu do GA4, przejdź do zakładki{' '}
                <strong>Pętla Decyzyjna AI</strong> i wklej obserwacje z Clarity lub Search Console.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Połącz GA4 na żywo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('decision-loop')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B0754]" />
                  <span>Użyj notatek Clarity / GSC bez GA4</span>
                </button>
              </div>
            </div>
          ) : loadingReport ? (
            <div className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-center text-xs text-[#646A75]">
              Pobieranie raportu GA4 dla usługi {selectedPropertyId}...
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Summary Action Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8E1D3] rounded-2xl p-5">
                <div className="text-xs text-[#414751]">
                  Usługa <strong className="font-mono text-[#121926]">{report.propertyId}</strong> · Okres:{' '}
                  <strong>{report.days} dni</strong> · Aktywni teraz (30 min):{' '}
                  <strong className="font-mono tabular-nums text-[#121926]">
                    {report.realtimeActiveUsers ?? '—'}
                  </strong>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSubTab('decision-loop');
                      void handleRunDecisionLoop('three-sentence-diagnosis');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Uruchom Pętlę 3 zdań AI (GA4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendReportToAgent(report.summaryForAgent)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Wyślij do Agenta Analityka</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Threshold < 30 sessions guard (zasady-analizy A2) */}
              {report.overview.sessions < 30 && (
                <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-2xl p-4 text-xs text-[#78350F] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
                  <div>
                    <strong>[ZA MAŁO DANYCH: PONIŻEJ 30 SESJI] (zasady-analizy.md A2):</strong>{' '}
                    Raport zawiera obecnie <span className="font-mono font-semibold">{report.overview.sessions}</span> sesji. Nie wyciągaj twardych wniosków o współczynniku konwersji ani nie wyłączaj kanałów. Traktuj liczby jako wczesny sygnał kierunkowy i zbierz min. 30 sesji na wariant.
                  </div>
                </div>
              )}

              {/* 4 KPI Strip */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
                  <p className="text-xs font-medium text-[#646A75]">Sesje / Użytkownicy</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                    {report.overview.sessions}{' '}
                    <span className="text-sm font-normal text-[#646A75]">
                      / {report.overview.totalUsers}
                    </span>
                  </p>
                </div>
                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
                  <p className="text-xs font-medium text-[#646A75]">Zaangażowanie</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                    {report.overview.engagementRate}%
                  </p>
                  <p className="text-xs text-[#646A75] font-mono tabular-nums">
                    {report.overview.engagedSessions} zaangażowanych sesji
                  </p>
                </div>
                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
                  <p className="text-xs font-medium text-[#646A75]">Zakupy (purchase)</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                    {report.overview.purchases}
                  </p>
                </div>
                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1">
                  <p className="text-xs font-medium text-[#646A75]">Przychód e-commerce</p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
                    {report.overview.revenue.toFixed(2)} zł
                  </p>
                </div>
              </section>

              {/* Payment gateway warning per zasady-analizy.md A3 */}
              {paymentReferrals.length > 0 && (
                <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-2xl p-4 text-xs text-[#78350F]">
                  <strong>Detektor bramek płatności (zasady-analizy.md A3):</strong> W wykrytych źródłach ruchu pojawiają się powroty z bramek ({paymentReferrals.map((r) => r.source).join(', ')}). Dodaj je do listy wykluczonych odesłań w GA4, aby nie nadpisywały kanałów pozyskania ruchu.
                </div>
              )}

              {/* Funnel & Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-[#121926]">
                    Lejek zdarzeń e-commerce
                  </h3>
                  <div className="divide-y divide-[#F1ECE1] text-xs">
                    {funnelStages.map((stage) => (
                      <div
                        key={stage.key}
                        className="py-2.5 flex items-center justify-between gap-4"
                      >
                        <span className="text-[#414751]">{stage.label}</span>
                        <span className="font-mono font-semibold tabular-nums text-[#121926]">
                          {stage.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4 overflow-x-auto">
                  <h3 className="text-base font-semibold text-[#121926]">
                    Źródła ruchu i kampanie UTM
                  </h3>
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[#E8E1D3] text-[#646A75]">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Źródło / Medium</th>
                        <th className="py-2 pr-3 font-medium">Kampania</th>
                        <th className="py-2 px-2 font-medium text-right">Sesje</th>
                        <th className="py-2 px-2 font-medium text-right">Zaangaż.</th>
                        <th className="py-2 pl-2 font-medium text-right">Zakupy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1ECE1]">
                      {report.sources.map((s, idx) => (
                        <tr key={`${s.source}-${s.medium}-${idx}`}>
                          <td className="py-2.5 pr-3 font-medium text-[#121926]">
                            {s.source} / {s.medium}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-[#646A75]">{s.campaign}</td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                            {s.sessions}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                            {s.engagedSessions}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono tabular-nums font-semibold">
                            {s.purchases}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>

              {/* Top Pages, Devices, Countries (already delivered by /api/analytics/report) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-6 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4 overflow-x-auto">
                  <h3 className="text-base font-semibold text-[#121926]">
                    Najczęstsze podstrony (Top Pages)
                  </h3>
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-[#E8E1D3] text-[#646A75]">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Ścieżka</th>
                        <th className="py-2 px-2 font-medium text-right">Odsłony</th>
                        <th className="py-2 px-2 font-medium text-right">Sesje</th>
                        <th className="py-2 pl-2 font-medium text-right">Śr. czas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1ECE1]">
                      {report.topPages.slice(0, 8).map((p, idx) => (
                        <tr key={`${p.path}-${idx}`}>
                          <td className="py-2 pr-3 font-mono text-[#121926]">{p.path}</td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">{p.views}</td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums">{p.sessions}</td>
                          <td className="py-2 pl-2 text-right font-mono tabular-nums text-[#646A75]">
                            {p.avgDurationSec}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="lg:col-span-3 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-[#121926]">
                    Urządzenia
                  </h3>
                  <div className="divide-y divide-[#F1ECE1] text-xs">
                    {report.devices.map((d) => (
                      <div key={d.device} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="capitalize font-medium text-[#121926]">{d.device}</span>
                        <span className="font-mono tabular-nums text-[#414751]">
                          {d.sessions} ses. · {d.purchases} zak.
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="lg:col-span-3 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-semibold text-[#121926]">
                    Kraje (wysyłka tylko PL)
                  </h3>
                  <div className="divide-y divide-[#F1ECE1] text-xs">
                    {report.countries.map((c) => (
                      <div key={c.country} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="font-medium text-[#121926]">{c.country}</span>
                        <span className="font-mono tabular-nums text-[#414751]">
                          {c.sessions} ses.
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* SUBTAB 2: AI DECISION LOOP (zasady-analizy.md) */}
      {subTab === 'decision-loop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel */}
          <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-[#121926]">
                1. Źródło danych &amp; tryb analizy
              </h3>
              <p className="text-xs text-[#646A75] mt-1">
                Model łączy dane GA4 (jeśli podłączone) z Twoimi notatkami z Microsoft Clarity, GSC i skanów QR.
              </p>
            </div>

            {/* Live GA4 badge */}
            <div className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-3.5 text-xs space-y-1">
              {report ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#121926]">
                      GA4 podłączone (ID: <span className="font-mono">{report.propertyId}</span>)
                    </span>
                    <span className="font-mono font-semibold text-[#3B0754]">
                      {report.overview.sessions} sesji ({report.days}d)
                    </span>
                  </div>
                  {report.overview.sessions < 30 && (
                    <p className="text-[#B45309]">
                      Poniżej 30 sesji: analiza automatycznie uruchomi rygor [ZA MAŁO DANYCH].
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#414751]">
                    Brak aktywnego raportu GA4. Analiza oprze się na notatkach Clarity/GSC.
                  </span>
                  {!accessToken && (
                    <button
                      type="button"
                      onClick={() => setSubTab('ga4-live')}
                      className="font-semibold text-[#5B2182] hover:underline whitespace-nowrap shrink-0"
                    >
                      Połącz GA4
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mode Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#121926]">
                Wybierz tryb decyzji (zasady-analizy.md)
              </label>
              <div className="space-y-2">
                {MODULE5_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAnalysisMode(m.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      analysisMode === m.id
                        ? 'border-[#3B0754] bg-[#FFF9E2]'
                        : 'border-[#E8E1D3] bg-[#FAF6EA] hover:bg-[#FFF2CC]'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#121926]">{m.label}</p>
                    <p className="text-[11px] text-[#414751] mt-0.5">{m.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Clarity / GSC Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#121926]">
                Obserwacje z Microsoft Clarity / Google Search Console / QR
              </label>
              <textarea
                rows={5}
                value={m5State.clarityAndGscNotes}
                onChange={(e) =>
                  persistM5State({
                    ...m5State,
                    clarityAndGscNotes: e.target.value,
                  })
                }
                placeholder="Np. W Clarity 65% użytkowników mobile zatrzymuje scroll nad przyciskiem wyboru 8 kartek; w GSC pojawiły się wyświetlenia na 'drobny prezent z Polski do walizki'; na 2 paczkach testowych były 2 skany QR."
                className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-2.5 text-xs text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              />
            </div>

            {/* Custom Question */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#121926]">
                Dodatkowe pytanie do Analityka (opcjonalnie)
              </label>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Np. Który pierwszy element na /sklep zmienić w tym tygodniu?"
                className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-2 text-xs text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              />
            </div>

            {decisionError && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
                {decisionError}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleRunDecisionLoop()}
              disabled={deciding}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {deciding ? 'Analizuję dane wg zasady-analizy.md...' : 'Generuj Decyzję & Hipotezę ICE'}
              </span>
            </button>
          </section>

          {/* Output Panel */}
          <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#121926]">
                  2. Wynik Pętli Decyzyjnej AI (GA4)
                </h3>
                <p className="text-xs text-[#646A75]">
                  {m5State.lastDecisionAt
                    ? `Ostatnia analiza: ${m5State.lastDecisionAt}`
                    : 'Bez halucynacji: wyłącznie liczby z Twoich danych lub [BRAK DANYCH]'}
                </p>
              </div>

              {m5State.lastDecisionOutput && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrefillExperimentFromDecision}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FFF2CC] hover:bg-[#FFEA9F] border border-[#E8D590] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Dodaj do Banku GROWS</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyDecision}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedDecision ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDecision ? 'Skopiowano' : 'Kopiuj'}</span>
                  </button>
                  {onSaveRun && (
                    <button
                      type="button"
                      onClick={handleSaveDecisionToHistory}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedToHistory ? 'Zapisano w Historii' : 'Zapisz w Historii'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {m5State.lastDecisionOutput ? (
              <div className="prose prose-sm max-w-none text-[#121926] prose-headings:text-[#121926] prose-strong:text-[#121926] prose-code:text-[#3B0754]">
                <Markdown remarkPlugins={[remarkGfm]}>{m5State.lastDecisionOutput}</Markdown>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium text-[#414751]">
                  Brak wygenerowanej decyzji dla bieżącej sesji
                </p>
                <p className="text-xs text-[#646A75] max-w-md mx-auto">
                  Podłącz GA4 lub wpisz obserwacje z Microsoft Clarity / Google Search Console po lewej i kliknij „Generuj Decyzję &amp; Hipotezę ICE”.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBTAB 3: GROWS EXPERIMENT BANK & GA4 HYGIENE */}
      {subTab === 'grows-bank' && (
        <div className="space-y-6">
          {/* Hygiene Checklist */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[#3B0754]" />
                  <h3 className="text-base font-semibold text-[#121926]">
                    Higiena pomiaru GA4 &amp; Clarity (zasady-analizy.md)
                  </h3>
                </div>
                <p className="text-xs text-[#646A75] mt-0.5">
                  Odznaczaj kolejne reguły przed rozpoczęciem selekcji zwycięzców.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold tabular-nums text-[#3B0754]">
                  {hygieneDoneCount} / {m5State.hygiene.length}
                </span>
                <div className="w-28 h-2 rounded-full bg-[#FAF6EA] border border-[#E8E1D3] overflow-hidden">
                  <div
                    className="h-full bg-[#FFBF00] transition-all"
                    style={{
                      width: `${Math.round(
                        (hygieneDoneCount / Math.max(1, m5State.hygiene.length)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#F1ECE1]">
              {m5State.hygiene.map((rule) => (
                <label
                  key={rule.id}
                  className="py-3 flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={rule.done}
                    onChange={() => handleToggleHygiene(rule.id)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E8E1D3] accent-[#3B0754]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          rule.done ? 'line-through text-[#646A75]' : 'text-[#121926]'
                        }`}
                      >
                        {rule.title}
                      </span>
                      <span className="font-mono text-[11px] text-[#5B2182] bg-[#FAF6EA] border border-[#E8E1D3] rounded px-1.5 py-0.5">
                        {rule.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#414751] mt-1">{rule.detail}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* GROWS Experiments Bank */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#121926]">
                  Bank Eksperymentów GROWS (posortowany wg ICE = I × C × E)
                </h3>
                <p className="text-xs text-[#646A75] mt-0.5">
                  Gather → Rank → Outline → Work → Study. Kliknij status eksperymentu, aby zmienić etap testu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj eksperyment ICE</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Eksportuj .md</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetM5}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#646A75] hover:text-[#121926] bg-[#FAF6EA] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {addedToBankNotice && (
              <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs text-[#15803D]">
                Dodano nowy eksperyment i posortowano bank według wyniku ICE.
              </div>
            )}

            {/* Add Custom Experiment Form */}
            {showAddForm && (
              <div className="rounded-2xl border border-[#E8E1D3] bg-[#FAF6EA] p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Nazwa eksperymentu
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Np. Przestawienie sekcji QR i podziękowania nad przycisk koszyka"
                      className="w-full rounded-xl border border-[#E8E1D3] bg-white px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Źródło sygnału
                    </label>
                    <select
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value as GrowsDataSource)}
                      className="w-full rounded-xl border border-[#E8E1D3] bg-white px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                    >
                      <option value="GA4">GA4</option>
                      <option value="Clarity">Clarity</option>
                      <option value="GSC">GSC</option>
                      <option value="UTM/Social">UTM/Social</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                    Hipoteza (Jeśli X → wzrośnie Y → ponieważ Z)
                  </label>
                  <textarea
                    rows={2}
                    value={newHypothesis}
                    onChange={(e) => setNewHypothesis(e.target.value)}
                    placeholder="Jeśli zrobimy..., to wzrośnie..., ponieważ..."
                    className="w-full rounded-xl border border-[#E8E1D3] bg-white px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Metryka sukcesu (KPI)
                    </label>
                    <input
                      type="text"
                      value={newMetric}
                      onChange={(e) => setNewMetric(e.target.value)}
                      placeholder="add_to_cart / view_item (%)"
                      className="w-full rounded-xl border border-[#E8E1D3] bg-white px-3 py-2 text-xs text-[#121926]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Impact (1–10): <span className="font-mono text-[#121926]">{newImpact}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={newImpact}
                      onChange={(e) => setNewImpact(Number(e.target.value))}
                      className="w-full accent-[#3B0754]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Confidence (1–10): <span className="font-mono text-[#121926]">{newConfidence}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(Number(e.target.value))}
                      className="w-full accent-[#3B0754]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                      Ease (1–10): <span className="font-mono text-[#121926]">{newEase}</span> · ICE{' '}
                      <strong className="font-mono text-[#3B0754]">
                        {calcIce(newImpact, newConfidence, newEase)}
                      </strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={newEase}
                      onChange={(e) => setNewEase(Number(e.target.value))}
                      className="w-full accent-[#3B0754]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs font-medium text-[#414751] bg-white border border-[#E8E1D3] rounded-full"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExperiment}
                    className="px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full"
                  >
                    Zapisz w Banku GROWS
                  </button>
                </div>
              </div>
            )}

            {/* Experiment Cards */}
            <div className="space-y-4">
              {sortedExperiments.map((exp, idx) => {
                const ice = calcIce(exp.impact, exp.confidence, exp.ease);
                const statusInfo = STATUS_META[exp.status];
                return (
                  <article
                    key={exp.id}
                    className="rounded-2xl border border-[#E8E1D3] bg-[#FFFDF7] p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-[240px]">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-mono font-bold text-[#3B0754]">
                            #{idx + 1} · ICE {ice} ({exp.impact}×{exp.confidence}×{exp.ease})
                          </span>
                          <span className="font-mono text-[#646A75] border border-[#E8E1D3] bg-[#FAF6EA] rounded px-1.5 py-0.5">
                            {exp.source}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#121926]">{exp.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(exp.id)}
                          className={`px-3 py-1 text-xs font-semibold border rounded-full transition-colors whitespace-nowrap shrink-0 ${statusInfo.badgeClass}`}
                          title="Kliknij, aby przełączyć status (Planowany → W teście → Wygrany → Odrzucony)"
                        >
                          {statusInfo.label}
                        </button>
                        {exp.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomExperiment(exp.id)}
                            aria-label="Usuń własny eksperyment"
                            className="p-1.5 text-[#646A75] hover:text-[#B91C1C] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#414751] leading-relaxed">
                      <strong className="text-[#121926]">Hipoteza:</strong> {exp.hypothesis}
                    </p>
                    <p className="text-xs text-[#414751]">
                      <strong className="text-[#121926]">KPI:</strong>{' '}
                      <span className="font-mono text-[#3B0754]">{exp.metric}</span>
                    </p>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                        Study: wynik testu po zebraniu danych (min. 30 sesji):
                      </label>
                      <input
                        type="text"
                        value={exp.studyNotes ?? ''}
                        onChange={(e) => handleUpdateStudyNotes(exp.id, e.target.value)}
                        placeholder="Wpisz wynik liczbowy i decyzję: wdrażamy na stałe / odrzucamy..."
                        className="w-full rounded-xl border border-[#E8E1D3] bg-white px-3 py-1.5 text-xs text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
