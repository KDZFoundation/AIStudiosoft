'use client';

import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ExternalLink,
  Feather,
  Globe,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  AGENTS,
  AgentRunRecord,
  BrandContextData,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';

export type WorkspaceTabId =
  | 'overview'
  | 'plan'
  | 'brand'
  | 'design'
  | 'seo-geo'
  | 'social-m4'
  | 'agents'
  | 'humanizer'
  | 'facebook'
  | 'analytics'
  | 'ads'
  | 'training'
  | 'deck';

interface OverviewPanelProps {
  brandContext: BrandContextData;
  runs: AgentRunRecord[];
  planProgress?: { completed: number; total: number };
  onNavigate: (tab: WorkspaceTabId, agentId?: string) => void;
}

export default function OverviewPanel({
  brandContext,
  runs,
  planProgress,
  onNavigate,
}: OverviewPanelProps) {
  return (
    <div className="space-y-8">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white border border-[#E8E1D3] rounded-2xl p-6 lg:p-8">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#5B2182] tracking-wide">
              Wiedza ze szkolenia · System operacyjny marki podrozowka.pl
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#121926]">
              Centrum {AGENTS.length} agentów marketingowych dla odwróconej pocztówki
            </h1>
            <p className="text-base text-[#414751] leading-relaxed max-w-2xl">
              {brandContext.elevatorPitch}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('agents', 'deep-research')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <span>Uruchom agenta AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('plan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#121926] bg-[#FFF2CC] hover:bg-[#FFEA9F] border border-[#E8D590] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <CheckSquare className="w-4 h-4 text-[#3B0754]" />
              <span>
                Plan Marketingowy
                {planProgress ? (
                  <span className="ml-1.5 font-mono tabular-nums text-xs text-[#3B0754]">
                    ({planProgress.completed}/{planProgress.total})
                  </span>
                ) : null}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('design')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Palette className="w-4 h-4 text-[#3B0754]" />
              <span>Design System &amp; Kreacje</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('seo-geo')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4 text-[#3B0754]" />
              <span>SEO, GEO &amp; Prawo</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('social-m4')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarDays className="w-4 h-4 text-[#3B0754]" />
              <span>Social Media</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-[#3B0754]" />
              <span>Analityka &amp; GROWS</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ads')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <TrendingUp className="w-4 h-4 text-[#3B0754]" />
              <span>Google Ads</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('humanizer')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Feather className="w-4 h-4 text-[#3B0754]" />
              <span>Humanizer (Anty-AI)</span>
            </button>
            <a
              href={brandContext.shopUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-[#5B2182] hover:text-[#3B0754] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Otwórz sklep</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[240px] rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#FFF9E2]">
          <Image
            src="/images/rewers-podrozowka.png"
            alt="Rewers Podróżówki: odwrócona pocztówka z mapą, miejscem na wpis, zachętą i kodem QR"
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-contain p-3"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#121926]/90 via-[#121926]/55 to-transparent p-4">
            <p className="text-xs font-medium text-[#FFFBEF]">
              Przód: zdjęcie Polski + podziękowanie w języku Obdarowanego · Rewers: mapa, wpis, zachęta i kod QR
            </p>
          </div>
        </div>
      </section>

      {/* 4 Key Truths Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#646A75]">Cena i pakiet bazowy</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
            4,99 zł <span className="text-sm font-normal text-[#646A75]">/ szt.</span>
          </p>
          <p className="text-xs text-[#414751]">
            Min. 8 kartek (39,92 zł = 1 arkusz), dowolny miks krajów, bez rabatów progowych.
          </p>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#646A75]">Katalog sklepu (teraz)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
            {PODROZOWKA_CATALOG.length} zdjęć · 105+ krajów
          </p>
          <p className="text-xs text-[#414751]">
            5 kategorii (Natura, Architektura, Sztuka, Wydarzenia, Postacie), {PODROZOWKA_CATALOG.length} gotowych kadrów.
          </p>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#646A75]">Dostawa i realizacja</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#121926]">
            2–3 dni w Polsce
          </p>
          <p className="text-xs text-[#414751]">
            Wysyłka wyłącznie w Polsce: ORLEN Paczka i InPost (bez cen wysyłki w copy dla klientów).
          </p>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#646A75]">Bariera #1 i kanał</p>
          <p className="text-2xl font-bold text-[#121926]">100% Organic</p>
          <p className="text-xs text-[#414751]">
            Równorzędne testy segmentów (FB, IG, TikTok, SEO) + tłumaczenie „odwróconej pocztówki”.
          </p>
        </div>
      </section>

      {/* 7 Agents Quick Launcher + Recent Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1ECE1] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#121926]">
                {AGENTS.length} wyspecjalizowanych agentów marketingowych
              </h2>
              <p className="text-sm text-[#646A75]">
                Każdy agent pobiera żywy Mózg Marki i podlega kontroli Antywzorców.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('agents')}
              className="text-sm font-semibold text-[#5B2182] hover:text-[#3B0754] whitespace-nowrap shrink-0"
            >
              Otwórz studio →
            </button>
          </div>

          <div className="divide-y divide-[#F1ECE1]">
            {AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                    <span className="font-semibold text-[#5B2182]">{agent.moduleRef}</span>
                    {agent.useGoogleSearch && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Google Search na żywo</span>
                      </>
                    )}
                    {agent.supportsGa4 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Raporty GA4</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[#121926]">{agent.name}</h3>
                  <p className="text-xs text-[#414751] leading-relaxed">{agent.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('agents', agent.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFBF00] border border-[#E8E1D3] hover:border-[#FFBF00] rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  Uruchom
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-[#F1ECE1] pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D99B00]" />
              <h2 className="text-lg font-semibold text-[#121926]">Ostatnie wyniki</h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#646A75]">
              {runs.length} zapisanych
            </span>
          </div>

          <div className="divide-y divide-[#F1ECE1]">
            {runs.slice(0, 3).map((run) => (
              <div key={run.id} className="py-3.5 space-y-1.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 text-xs text-[#646A75]">
                  <span className="font-semibold text-[#121926]">{run.agentName}</span>
                  <span className="font-mono tabular-nums">{run.createdAt}</span>
                </div>
                <p className="text-xs text-[#414751] line-clamp-3 leading-relaxed">
                  {run.output.replaceAll('#', '').replaceAll('*', '')}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#F1ECE1] flex items-center justify-between text-xs text-[#414751]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3B0754]" />
              <span>Antywzorce: brak wizytówek i magnesów</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('deck')}
              className="font-semibold text-[#5B2182] hover:text-[#3B0754] whitespace-nowrap shrink-0"
            >
              Projekt Zaliczeniowy →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
