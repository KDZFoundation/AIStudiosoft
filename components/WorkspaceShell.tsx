'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  CheckSquare,
  Database,
  Feather,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Palette,
  Share2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  AgentRunRecord,
  BrandContextData,
  DEFAULT_BRAND_CONTEXT,
  INITIAL_ITERATIONS,
  INITIAL_SAMPLE_RUNS,
  IterationEntry,
} from '@/data/podrozowka-kb';
import {
  createDefaultMarketingPlanState,
  MARKETING_PLAN_STORAGE_KEY,
  MarketingPlanState,
  mergeMarketingPlanState,
} from '@/data/marketing-plan';
import OverviewPanel, { WorkspaceTabId } from '@/components/OverviewPanel';

const PanelLoader = () => (
  <div className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-sm text-[#646A75]">
    Ładowanie panelu...
  </div>
);

const MarketingPlanPanel = dynamic(() => import('@/components/MarketingPlanPanel'), {
  loading: PanelLoader,
});
const BrandBrainPanel = dynamic(() => import('@/components/BrandBrainPanel'), {
  loading: PanelLoader,
});
const DesignSystemPanel = dynamic(() => import('@/components/DesignSystemPanel'), {
  loading: PanelLoader,
});
const SeoGeoPanel = dynamic(() => import('@/components/SeoGeoPanel'), {
  loading: PanelLoader,
});
const SocialModule4Panel = dynamic(() => import('@/components/SocialModule4Panel'), {
  loading: PanelLoader,
});
const AgentStudioPanel = dynamic(() => import('@/components/AgentStudioPanel'), {
  loading: PanelLoader,
});
const HumanizerPanel = dynamic(() => import('@/components/HumanizerPanel'), {
  loading: PanelLoader,
});
const FacebookPanel = dynamic(() => import('@/components/FacebookPanel'), {
  loading: PanelLoader,
});
const AnalyticsPanel = dynamic(() => import('@/components/AnalyticsPanel'), {
  loading: PanelLoader,
});
const GoogleAdsPanel = dynamic(() => import('@/components/GoogleAdsPanel'), {
  loading: PanelLoader,
});
const TrainingBasePanel = dynamic(() => import('@/components/TrainingBasePanel'), {
  loading: PanelLoader,
});
const ProjectDeckPanel = dynamic(() => import('@/components/ProjectDeckPanel'), {
  loading: PanelLoader,
});

interface WorkspaceShellProps {
  initialBrandContext: BrandContextData;
  initialMarketingPlan?: MarketingPlanState;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Pulpit AI Studiosoft', icon: LayoutDashboard },
  { id: 'plan', label: 'Plan Marketingowy', icon: CheckSquare },
  { id: 'brand', label: 'Mózg Marki', icon: Database },
  { id: 'design', label: 'Design System & Kreacje', icon: Palette },
  { id: 'seo-geo', label: 'SEO, GEO & Prawo', icon: Globe },
  { id: 'social-m4', label: 'Social Media', icon: CalendarDays },
  { id: 'agents', label: 'Agenty Marketingowe', icon: Bot },
  { id: 'humanizer', label: 'Humanizer (Anty-AI)', icon: Feather },
  { id: 'facebook', label: 'Facebook (Organic)', icon: Share2 },
  { id: 'analytics', label: 'Google Analytics', icon: BarChart3 },
  { id: 'ads', label: 'Google Ads', icon: TrendingUp },
  { id: 'training', label: 'Baza Wiedzy ze Szkolenia', icon: BookOpen },
  { id: 'deck', label: 'Projekt Zaliczeniowy', icon: FileText },
];

const BRAND_STORAGE_KEY = 'podrozowka_brand_context_v3';

function subscribeBrandStore(onChange: () => void) {
  window.addEventListener('podrozowka-brand-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-brand-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function subscribeMarketingPlanStore(onChange: () => void) {
  window.addEventListener('podrozowka-marketing-plan-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-marketing-plan-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function WorkspaceShell({
  initialBrandContext,
  initialMarketingPlan,
}: WorkspaceShellProps) {
  const [fallbackPlan] = useState<MarketingPlanState>(
    () => initialMarketingPlan ?? createDefaultMarketingPlanState()
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const brandCacheRef = useRef<{ raw: string | null; value: BrandContextData }>({
    raw: null,
    value: initialBrandContext,
  });
  const planCacheRef = useRef<{ raw: string | null; value: MarketingPlanState }>({
    raw: null,
    value: fallbackPlan,
  });

  const getBrandSnapshot = useCallback((): BrandContextData => {
    try {
      const raw = localStorage.getItem(BRAND_STORAGE_KEY);
      if (!raw) return initialBrandContext;
      if (brandCacheRef.current.raw === raw) return brandCacheRef.current.value;
      const parsed = { ...initialBrandContext, ...(JSON.parse(raw) as Partial<BrandContextData>) };
      brandCacheRef.current = { raw, value: parsed };
      return parsed;
    } catch {
      return initialBrandContext;
    }
  }, [initialBrandContext]);

  const getBrandServerSnapshot = useCallback(() => initialBrandContext, [initialBrandContext]);
  const brandContext = useSyncExternalStore(
    subscribeBrandStore,
    getBrandSnapshot,
    getBrandServerSnapshot
  );

  const getPlanSnapshot = useCallback((): MarketingPlanState => {
    try {
      const raw = localStorage.getItem(MARKETING_PLAN_STORAGE_KEY);
      if (!raw) return fallbackPlan;
      if (planCacheRef.current.raw === raw) return planCacheRef.current.value;
      const merged = mergeMarketingPlanState(JSON.parse(raw) as Partial<MarketingPlanState>);
      planCacheRef.current = { raw, value: merged };
      return merged;
    } catch {
      return fallbackPlan;
    }
  }, [fallbackPlan]);

  const getPlanServerSnapshot = useCallback(() => fallbackPlan, [fallbackPlan]);
  const marketingPlan = useSyncExternalStore(
    subscribeMarketingPlanStore,
    getPlanSnapshot,
    getPlanServerSnapshot
  );

  const [brandRevision, setBrandRevision] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('deep-research');
  const [runs, setRuns] = useState<AgentRunRecord[]>(INITIAL_SAMPLE_RUNS);
  const [iterations, setIterations] = useState<IterationEntry[]>(INITIAL_ITERATIONS);
  const [latestGa4Summary, setLatestGa4Summary] = useState<string | null>(null);
  const [latestGoogleAdsSummary, setLatestGoogleAdsSummary] = useState<string | null>(null);
  const [facebookDraft, setFacebookDraft] = useState<string>('');
  const [facebookUtmCampaign, setFacebookUtmCampaign] = useState<string>('odwrocona_pocztowka');
  const [facebookUtmContent, setFacebookUtmContent] = useState<string>('post_organiczny');
  const [facebookDraftNonce, setFacebookDraftNonce] = useState<number>(0);
  const [humanizerDraft, setHumanizerDraft] = useState<string>('');
  const [humanizerDraftNonce, setHumanizerDraftNonce] = useState<number>(0);

  const handleSaveBrand = async (updated: BrandContextData) => {
    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem(BRAND_STORAGE_KEY, serialized);
      brandCacheRef.current = { raw: serialized, value: updated };
    } catch {
      // Ignore storage quota errors
    }
    window.dispatchEvent(new Event('podrozowka-brand-change'));
    setBrandRevision((r) => r + 1);
  };

  const handleResetBrand = async () => {
    try {
      localStorage.removeItem(BRAND_STORAGE_KEY);
      brandCacheRef.current = { raw: null, value: DEFAULT_BRAND_CONTEXT };
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new Event('podrozowka-brand-change'));
    setBrandRevision((r) => r + 1);
  };

  const planSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdateMarketingPlan = (updated: MarketingPlanState) => {
    const normalized = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    try {
      const serialized = JSON.stringify(normalized);
      localStorage.setItem(MARKETING_PLAN_STORAGE_KEY, serialized);
      planCacheRef.current = { raw: serialized, value: normalized };
    } catch {
      // Ignore storage quota errors
    }
    window.dispatchEvent(new Event('podrozowka-marketing-plan-change'));
    if (planSyncTimerRef.current) {
      clearTimeout(planSyncTimerRef.current);
    }
    planSyncTimerRef.current = setTimeout(() => {
      void fetch('/api/marketing-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      }).catch(() => {
        // LocalStorage copy stays authoritative on transient network error
      });
    }, 350);
  };

  const handleResetMarketingPlan = () => {
    if (planSyncTimerRef.current) {
      clearTimeout(planSyncTimerRef.current);
    }
    const fresh = createDefaultMarketingPlanState();
    try {
      localStorage.removeItem(MARKETING_PLAN_STORAGE_KEY);
      planCacheRef.current = { raw: null, value: fresh };
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new Event('podrozowka-marketing-plan-change'));
    void fetch('/api/marketing-plan', { method: 'DELETE' }).catch(() => {
      // LocalStorage reset already applied
    });
  };

  const planDoneCount = marketingPlan.tasks.filter((t) => t.completed).length;
  const planTotalCount = marketingPlan.tasks.length;

  const handleNavigate = (tab: WorkspaceTabId, agentId?: string) => {
    if (agentId) setSelectedAgentId(agentId);
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleSendToFacebook = (
    draftText: string,
    utmCampaign?: string,
    utmContent?: string
  ) => {
    setFacebookDraft(draftText);
    if (utmCampaign) setFacebookUtmCampaign(utmCampaign);
    if (utmContent) setFacebookUtmContent(utmContent);
    setFacebookDraftNonce((n) => n + 1);
    setActiveTab('facebook');
  };

  const handleSendToHumanizer = (draftText: string) => {
    setHumanizerDraft(draftText);
    setHumanizerDraftNonce((n) => n + 1);
    setActiveTab('humanizer');
  };

  const handleSendGa4ToAgent = (summaryForAgent: string) => {
    setLatestGa4Summary(summaryForAgent);
    setSelectedAgentId('analityk-konwersji');
    setActiveTab('agents');
  };

  const handleSendGoogleAdsToAgent = (summaryForAgent: string) => {
    setLatestGoogleAdsSummary(summaryForAgent);
    setSelectedAgentId('strateg-reklam');
    setActiveTab('agents');
  };

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-[#FFFBEF] text-[#121926]">
      {/* Desktop Sidebar (256px) */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col border-r border-[#E8E1D3] bg-white shrink-0">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-[#F1ECE1]">
          <span
            aria-hidden="true"
            className="w-3 h-3 rounded-full bg-[#FFBF00] ring-4 ring-[#FFF2CC] shrink-0"
          />
          <span className="text-base font-bold tracking-tight text-[#121926] whitespace-nowrap">
            Podróżówka AI
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FFF2CC] text-[#121926] font-semibold'
                    : 'text-[#414751] font-medium hover:bg-[#FAF6EA] hover:text-[#121926]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#3B0754]' : 'text-[#646A75]'
                  }`}
                />
                <span className="truncate flex-1 text-left">{item.label}</span>
                {item.id === 'plan' && (
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-[#5B2182] shrink-0">
                    {planDoneCount}/{planTotalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-[#F1ECE1] text-xs text-[#646A75] space-y-1">
          <p className="font-semibold text-[#121926]">podrozowka.pl</p>
          <p>Projekt produkcyjny GA4 · Meta Organic</p>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#121926]/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-full bg-white border-r border-[#E8E1D3] flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#F1ECE1]">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-full bg-[#FFBF00] ring-4 ring-[#FFF2CC]"
                />
                <span className="text-base font-bold text-[#121926]">Podróżówka AI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-[#646A75] hover:text-[#121926] rounded-lg hover:bg-[#FAF6EA]"
                aria-label="Zamknij menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeTab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                      active
                        ? 'bg-[#FFF2CC] text-[#121926] font-semibold'
                        : 'text-[#414751] font-medium hover:bg-[#FAF6EA] hover:text-[#121926]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#3B0754]' : 'text-[#646A75]'
                      }`}
                    />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.id === 'plan' && (
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-[#5B2182] shrink-0">
                        {planDoneCount}/{planTotalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left + 1 Primary CTA on right */}
        <header className="no-print h-16 bg-white/90 backdrop-blur-sm border-b border-[#E8E1D3] px-4 lg:px-8 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#414751] hover:text-[#121926] rounded-lg hover:bg-[#FAF6EA]"
              aria-label="Otwórz nawigację"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#646A75] truncate">
              Podróżówka <span className="mx-1.5 text-[#D5CCB8]">/</span>{' '}
              <span className="font-semibold text-[#121926]">{currentNav.label}</span>
            </span>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('agents')}
              className="px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              Studio Agentów
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1280px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === 'overview' && (
                <OverviewPanel
                  brandContext={brandContext}
                  runs={runs}
                  planProgress={{ completed: planDoneCount, total: planTotalCount }}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'plan' && (
                <MarketingPlanPanel
                  plan={marketingPlan}
                  onUpdatePlan={handleUpdateMarketingPlan}
                  onResetPlan={handleResetMarketingPlan}
                  onNavigate={handleNavigate}
                />
              )}
              {activeTab === 'brand' && (
                <BrandBrainPanel
                  key={brandRevision}
                  brandContext={brandContext}
                  onSave={handleSaveBrand}
                  onReset={handleResetBrand}
                />
              )}
              {activeTab === 'design' && (
                <DesignSystemPanel
                  brandContext={brandContext}
                  onSaveRun={(run) => setRuns((prev) => [run, ...prev])}
                  onSendToFacebook={handleSendToFacebook}
                />
              )}
              {activeTab === 'seo-geo' && (
                <SeoGeoPanel
                  brandContext={brandContext}
                  validationGates={marketingPlan.validationGates}
                  onSaveRun={(run) => setRuns((prev) => [run, ...prev])}
                  onSendToFacebook={handleSendToFacebook}
                  onSendToHumanizer={handleSendToHumanizer}
                />
              )}
              {activeTab === 'social-m4' && (
                <SocialModule4Panel
                  brandContext={brandContext}
                  validationGates={marketingPlan.validationGates}
                  onSaveRun={(run) => setRuns((prev) => [run, ...prev])}
                  onSendToFacebook={handleSendToFacebook}
                  onSendToHumanizer={handleSendToHumanizer}
                />
              )}
              {activeTab === 'agents' && (
                <AgentStudioPanel
                  brandContext={brandContext}
                  validationGates={marketingPlan.validationGates}
                  selectedAgentId={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                  runs={runs}
                  onAddRun={(run) => setRuns((prev) => [run, ...prev])}
                  latestGa4Summary={latestGa4Summary}
                  latestGoogleAdsSummary={latestGoogleAdsSummary}
                  onSendToFacebook={handleSendToFacebook}
                  onSendToHumanizer={handleSendToHumanizer}
                  onOpenAnalytics={() => handleNavigate('analytics')}
                  onOpenGoogleAds={() => handleNavigate('ads')}
                />
              )}
              {activeTab === 'humanizer' && (
                <HumanizerPanel
                  key={humanizerDraftNonce}
                  brandContext={brandContext}
                  initialText={humanizerDraft}
                  onSaveRun={(run) => setRuns((prev) => [run, ...prev])}
                  onSendToFacebook={handleSendToFacebook}
                />
              )}
              {activeTab === 'facebook' && (
                <FacebookPanel
                  key={facebookDraftNonce}
                  initialDraft={facebookDraft}
                  initialUtmCampaign={facebookUtmCampaign}
                  initialUtmContent={facebookUtmContent}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsPanel
                  brandContext={brandContext}
                  onSendReportToAgent={handleSendGa4ToAgent}
                  onSaveRun={(run) => setRuns((prev) => [run, ...prev])}
                />
              )}
              {activeTab === 'ads' && (
                <GoogleAdsPanel onSendReportToAgent={handleSendGoogleAdsToAgent} />
              )}
              {activeTab === 'training' && <TrainingBasePanel />}
              {activeTab === 'deck' && (
                <ProjectDeckPanel
                  brandContext={brandContext}
                  marketingPlan={marketingPlan}
                  runs={runs}
                  iterations={iterations}
                  onAddIteration={(entry) =>
                    setIterations((prev) => [...prev, entry])
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
