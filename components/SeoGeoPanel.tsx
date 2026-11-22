'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Feather,
  FileSearch,
  Globe,
  Play,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AgentRunRecord, BrandContextData } from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, ValidationGate } from '@/data/marketing-plan';
import { CopyLintFinding, lintPodrozowkaCopy } from '@/lib/lint-copy';
import {
  buildPodrozowkaJsonLd,
  GEO_TEST_QUESTIONS,
  LEGAL_CHECKLIST_RULES,
  MODULE3_BRIEF_PRESETS,
  Module3BriefGoal,
  PODROZOWKA_FAQ_ITEMS,
  SeoGeoAuditSnapshot,
} from '@/lib/seo-geo';
import type { GroundingSourceItem } from '@/lib/gemini';

interface SeoGeoPanelProps {
  brandContext: BrandContextData;
  validationGates?: ValidationGate[];
  onSaveRun: (run: AgentRunRecord) => void;
  onSendToFacebook: (draftText: string) => void;
  onSendToHumanizer?: (draftText: string) => void;
}

type SubTabId = 'audit' | 'generator' | 'legal-geo';
type GeoStatus = 'untested' | 'missing' | 'cited';

const GEO_STATUS_STORAGE_KEY = 'podrozowka_geo_test_status_v1';
const EMPTY_GEO_STATUS: Record<string, GeoStatus> = {};

function subscribeGeoStore(onChange: () => void) {
  window.addEventListener('podrozowka-geo-status-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-geo-status-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function SeoGeoPanel({
  brandContext,
  validationGates,
  onSaveRun,
  onSendToFacebook,
  onSendToHumanizer,
}: SeoGeoPanelProps) {
  const [subTab, setSubTab] = useState<SubTabId>('audit');
  const resolvedGates =
    validationGates && validationGates.length > 0 ? validationGates : DEFAULT_VALIDATION_GATES;
  const reviewsGatePassed =
    resolvedGates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';

  // Live audit state
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [auditSnapshot, setAuditSnapshot] = useState<SeoGeoAuditSnapshot | null>(null);

  // Brief generator state
  const [selectedGoal, setSelectedGoal] = useState<Module3BriefGoal>('sklep-bluf-faq');
  const [cepFocus, setCepFocus] = useState<string>(MODULE3_BRIEF_PRESETS[0].defaultCep);
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [briefOutput, setBriefOutput] = useState<string | null>(null);
  const [briefSources, setBriefSources] = useState<GroundingSourceItem[]>([]);
  const [briefFindings, setBriefFindings] = useState<CopyLintFinding[] | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [copiedFaq, setCopiedFaq] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [savedToDeck, setSavedToDeck] = useState(false);

  // GEO 10-question tracker (persisted locally via useSyncExternalStore)
  const geoCacheRef = useRef<{ raw: string | null; value: Record<string, GeoStatus> }>({
    raw: null,
    value: EMPTY_GEO_STATUS,
  });

  const getGeoSnapshot = useCallback((): Record<string, GeoStatus> => {
    try {
      const raw = localStorage.getItem(GEO_STATUS_STORAGE_KEY);
      if (!raw) return EMPTY_GEO_STATUS;
      if (geoCacheRef.current.raw === raw) return geoCacheRef.current.value;
      const parsed = JSON.parse(raw) as Record<string, GeoStatus>;
      geoCacheRef.current = { raw, value: parsed };
      return parsed;
    } catch {
      return EMPTY_GEO_STATUS;
    }
  }, []);

  const getGeoServerSnapshot = useCallback(() => EMPTY_GEO_STATUS, []);
  const geoStatuses = useSyncExternalStore(
    subscribeGeoStore,
    getGeoSnapshot,
    getGeoServerSnapshot
  );

  const [copiedGeoId, setCopiedGeoId] = useState<string | null>(null);

  const jsonLdSnippet = useMemo(
    () => buildPodrozowkaJsonLd(brandContext),
    [brandContext]
  );

  const faqPlainText = useMemo(
    () =>
      PODROZOWKA_FAQ_ITEMS.map((item) => `P: ${item.question}\nO: ${item.answer}`).join(
        '\n\n'
      ),
    []
  );

  const activePreset = useMemo(
    () =>
      MODULE3_BRIEF_PRESETS.find((p) => p.id === selectedGoal) ??
      MODULE3_BRIEF_PRESETS[0],
    [selectedGoal]
  );

  const handleSelectGoal = (goal: Module3BriefGoal) => {
    setSelectedGoal(goal);
    const preset = MODULE3_BRIEF_PRESETS.find((p) => p.id === goal);
    if (preset) {
      setCepFocus(preset.defaultCep);
    }
  };

  const handleRunLiveScan = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch('/api/seo-geo/scan', { cache: 'no-store' });
      const data = (await res.json()) as {
        ok?: boolean;
        snapshot?: SeoGeoAuditSnapshot;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.snapshot) {
        throw new Error(data.error || 'Nie udało się zeskanować podrozowka.pl.');
      }
      setAuditSnapshot(data.snapshot);
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : 'Błąd połączenia ze stroną podrozowka.pl.'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateBrief = async () => {
    setGenerating(true);
    setGenError(null);
    setSavedToDeck(false);
    try {
      const res = await fetch('/api/seo-geo/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: selectedGoal,
          cepFocus,
          extraNotes,
          brandContext,
          validationGates: resolvedGates,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        sources?: GroundingSourceItem[];
        findings?: CopyLintFinding[];
        generatedAt?: string;
        error?: string;
      };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Nie udało się wygenerować pakietu SEO & GEO.');
      }
      setBriefOutput(data.text);
      setBriefSources(data.sources ?? []);
      setBriefFindings(
        data.findings ?? lintPodrozowkaCopy(data.text, { reviewsGatePassed })
      );
      setGeneratedAt(data.generatedAt ?? null);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : 'Błąd połączenia z generatorem SEO & GEO.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = async (
    value: string,
    setter: (v: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setter(true);
      setTimeout(() => setter(false), 1800);
    } catch {
      // Ignore clipboard permissions error
    }
  };

  const handleCycleGeoStatus = (id: string) => {
    const current = geoStatuses[id] ?? 'untested';
    const next: GeoStatus =
      current === 'untested' ? 'missing' : current === 'missing' ? 'cited' : 'untested';
    const updated = { ...geoStatuses, [id]: next };
    try {
      const serialized = JSON.stringify(updated);
      localStorage.setItem(GEO_STATUS_STORAGE_KEY, serialized);
      geoCacheRef.current = { raw: serialized, value: updated };
    } catch {
      // Ignore quota errors
    }
    window.dispatchEvent(new Event('podrozowka-geo-status-change'));
  };

  const handleSaveBriefToRuns = () => {
    if (!briefOutput) return;
    onSaveRun({
      id: `seo-geo-${Date.now()}`,
      agentId: 'audytor-seo-geo',
      agentName: `SEO & GEO · ${activePreset.label}`,
      createdAt: generatedAt || 'teraz',
      prompt: cepFocus,
      output: briefOutput,
      sources: briefSources,
    });
    setSavedToDeck(true);
  };

  const citedCount = GEO_TEST_QUESTIONS.filter((q) => geoStatuses[q.id] === 'cited').length;
  const testedCount = GEO_TEST_QUESTIONS.filter(
    (q) => (geoStatuses[q.id] ?? 'untested') !== 'untested'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
              <span className="font-semibold text-[#5B2182]">Widoczność · SEO, GEO &amp; Prawo</span>
              <span aria-hidden="true">·</span>
              <span>Bez bloga na domenie · 6 h/tydz. · Wysyłka tylko w Polsce</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#121926]">
              Widoczność w Google i LLM-ach (bez CMS bloga) + Bramka Prawna
            </h1>
            <p className="text-sm text-[#414751] max-w-3xl leading-relaxed">
              Zoptymalizuj stronę główną i <span className="font-mono text-xs">/sklep</span> pod
              boty Google oraz wyszukiwarki AI (ChatGPT, Perplexity), pobierz gotowy kod JSON-LD i
              FAQ zgodny z Dyrektywą Omnibus przy 0 zamówień.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap"
            >
              <span>Otwórz Search Console</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#5B2182]" />
            </a>
            <button
              type="button"
              onClick={handleRunLiveScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Skanowanie podrozowka.pl...' : 'Skanuj stronę na żywo'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1ECE1]">
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              subTab === 'audit'
                ? 'bg-[#FFF2CC] text-[#121926]'
                : 'text-[#414751] hover:bg-[#FAF6EA]'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Audyt Live (GSC &amp; Boty AI)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('generator')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              subTab === 'generator'
                ? 'bg-[#FFF2CC] text-[#121926]'
                : 'text-[#414751] hover:bg-[#FAF6EA]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Generator FAQ + JSON-LD (bez bloga)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('legal-geo')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              subTab === 'legal-geo'
                ? 'bg-[#FFF2CC] text-[#121926]'
                : 'text-[#414751] hover:bg-[#FAF6EA]'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Bramka Prawna &amp; 10 Pytań GEO</span>
            <span className="font-mono tabular-nums text-[11px] text-[#5B2182]">
              ({testedCount}/{GEO_TEST_QUESTIONS.length})
            </span>
          </button>
        </div>
      </section>

      {/* SUBTAB 1: LIVE AUDIT */}
      {subTab === 'audit' && (
        <div className="space-y-6">
          {scanError && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 flex items-start gap-3 text-sm text-[#991B1B]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Nie udało się pobrać danych ze strony podrozowka.pl</p>
                <p className="text-xs mt-0.5">{scanError}</p>
              </div>
            </div>
          )}

          {!auditSnapshot ? (
            <section className="bg-white border border-[#E8E1D3] rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2CC] text-[#3B0754] flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 max-w-xl mx-auto">
                <h2 className="text-lg font-semibold text-[#121926]">
                  Sprawdź, co Googlebot i boty AI widzą na podrozowka.pl bez JavaScriptu
                </h2>
                <p className="text-xs text-[#414751] leading-relaxed">
                  Skoro na domenie nie ma bloga, strona główna i <span className="font-mono">/sklep</span>{' '}
                  muszą oddawać w surowym HTML tytuł, opis, cenę 4,99 zł, pakiet 8 szt. oraz
                  dane Schema.org. Kliknij skanowanie, aby pobrać stan produkcyjny w czasie rzeczywistym.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunLiveScan}
                disabled={scanning}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Trwa skanowanie na żywo...' : 'Uruchom skan podrozowka.pl'}</span>
              </button>
            </section>
          ) : (
            <div className="space-y-6">
              {/* Top Diagnostic Strip */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {auditSnapshot.pages.map((page) => (
                  <div
                    key={page.url}
                    className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#646A75]">
                      <span className="font-semibold text-[#121926]">{page.label}</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          page.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        HTTP {page.httpStatus || 'ERR'}
                      </span>
                    </div>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
                      {page.rawTextChars} znaków HTML
                    </p>
                    <p className="text-xs text-[#414751]">
                      {page.looksLikeEmptySpaShell
                        ? 'Uwaga: bardzo mało tekstu bez JS (ryzyko pustego SPA dla części botów AI).'
                        : 'Tekst widoczny bez wykonywania JavaScriptu.'}
                    </p>
                  </div>
                ))}

                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#646A75]">
                    <span className="font-semibold text-[#121926]">robots.txt</span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        auditSnapshot.robots.found ? 'text-[#16A34A]' : 'text-[#D97706]'
                      }`}
                    >
                      HTTP {auditSnapshot.robots.httpStatus || 'BRAK'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#121926]">
                    {auditSnapshot.robots.blocksAiCrawlers.length === 0 &&
                    !auditSnapshot.robots.blocksGooglebot
                      ? 'Boty odblokowane'
                      : 'Wykryto blokady'}
                  </p>
                  <p className="text-xs text-[#414751]">
                    {auditSnapshot.robots.blocksAiCrawlers.length > 0
                      ? `Zablokowane: ${auditSnapshot.robots.blocksAiCrawlers.join(', ')}`
                      : 'Brak blokady dla Googlebot, GPTBot i PerplexityBot.'}
                  </p>
                </div>

                <div className="bg-white border border-[#E8E1D3] rounded-2xl p-5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#646A75]">
                    <span className="font-semibold text-[#121926]">sitemap.xml</span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        auditSnapshot.sitemap.found ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      HTTP {auditSnapshot.sitemap.httpStatus || 'BRAK'}
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
                    {auditSnapshot.sitemap.urlCount} adresów URL
                  </p>
                  <p className="text-xs text-[#414751]">
                    {auditSnapshot.sitemap.found
                      ? 'Mapa gotowa do zgłoszenia/weryfikacji w Google Search Console.'
                      : 'Brak mapy sitemap.xml. Utwórz ją przed zgłoszeniem w GSC.'}
                  </p>
                </div>
              </section>

              {/* Detailed HTML & Schema Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {auditSnapshot.pages.map((page) => (
                  <section
                    key={page.url}
                    className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#F1ECE1] pb-3">
                      <div>
                        <h2 className="text-base font-semibold text-[#121926]">{page.label}</h2>
                        <p className="text-xs font-mono text-[#646A75]">{page.url}</p>
                      </div>
                      <span className="text-xs font-mono text-[#646A75]">
                        Skan: {auditSnapshot.scannedAt}
                      </span>
                    </div>

                    <dl className="space-y-2.5 text-xs">
                      <div>
                        <dt className="font-semibold text-[#646A75]">Title (&lt;title&gt;)</dt>
                        <dd className="text-[#121926] mt-0.5">
                          {page.title || 'BRAK: dodaj unikalny tytuł pod intencję prezentu z Polski'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#646A75]">Meta Description</dt>
                        <dd className="text-[#414751] mt-0.5">
                          {page.metaDescription || 'BRAK: uzupełnij w <head> (140–155 znaków)'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <dt className="font-semibold text-[#646A75]">Nagłówek H1 (w HTML)</dt>
                          <dd className="text-[#121926] mt-0.5">
                            {page.h1 || 'BRAK w surowym HTML (renderowany po JS)'}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#646A75]">Schema.org JSON-LD</dt>
                          <dd className="text-[#121926] mt-0.5 font-mono">
                            {page.schemaTypes.length > 0
                              ? page.schemaTypes.join(', ')
                              : 'BRAK (wklej z zakładki obok)'}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <div className="pt-3 border-t border-[#F1ECE1] space-y-2">
                      <p className="text-xs font-semibold text-[#121926]">
                        Widoczność faktów oferty w surowym HTML (dla botów bez JS):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {page.factMatches.map((m) => (
                          <div
                            key={m.needle}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#FAF6EA] text-xs"
                          >
                            <span className="text-[#414751] truncate">{m.label}</span>
                            <span
                              className={`font-semibold shrink-0 ${
                                m.foundInRawHtml ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              {m.foundInRawHtml ? 'Widoczne' : 'Brak w HTML'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F1ECE1] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#121926]">
                          Uwagi słownictwa / zakazy marki (decyzja operatora, bez auto-naprawy):
                        </p>
                        <span
                          className={`text-[11px] font-mono tabular-nums font-semibold ${
                            (page.brandBanWarnings?.length ?? 0) === 0
                              ? 'text-[#16A34A]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {page.brandBanWarnings?.length ?? 0} uwag
                        </span>
                      </div>
                      {!page.brandBanWarnings || page.brandBanWarnings.length === 0 ? (
                        <div className="px-3 py-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#14532D]">
                          Brak wykrytych zakazanych sformułowań w widocznej treści HTML strony.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {page.brandBanWarnings.map((warn) => (
                            <div
                              key={`${warn.id}-${warn.term}`}
                              className={`px-3 py-2 rounded-lg border text-xs space-y-0.5 ${
                                warn.severity === 'error'
                                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]'
                              }`}
                            >
                              <p className="font-semibold">
                                {warn.severity === 'error' ? '[ZAKAZ]' : '[UWAGA]'} {warn.term}
                              </p>
                              <p className="text-[11px] opacity-90">{warn.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>

              {/* GSC Action Guide */}
              <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-semibold text-[#121926]">
                  Co zrobić teraz w Google Search Console (masz już dostęp)
                </h2>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#414751] leading-relaxed">
                  <li>
                    Wejdź w <strong className="text-[#121926]">Sprawdzenie adresu URL</strong> dla{' '}
                    <span className="font-mono">https://podrozowka.pl/sklep</span> i kliknij{' '}
                    <strong className="text-[#121926]">Testuj opublikowany URL → Wyświetl przetestowaną stronę → Zrzut ekranu</strong>.
                    Sprawdź, czy Googlebot widzi treść po wykonaniu JavaScriptu.
                  </li>
                  <li>
                    Jeśli skaner powyżej pokazuje <strong className="text-[#121926]">Brak w HTML</strong> przy cenie{' '}
                    <span className="font-mono">4,99 zł</span> i <span className="font-mono">FAQ</span>, wklej gotowy{' '}
                    <strong className="text-[#121926]">JSON-LD (Product + FAQPage)</strong> z następnej podzakładki do{' '}
                    <span className="font-mono">index.html</span>, dzięki czemu nawet boty AI nieuruchamiające JS odczytają ofertę od razu.
                  </li>
                  <li>
                    W zakładce <strong className="text-[#121926]">Mapy witryn</strong> zgłoś{' '}
                    <span className="font-mono">sitemap.xml</span> i monitoruj zapytania prezentowe (bez marki „podróżówka”).
                  </li>
                </ol>
              </section>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: GENERATOR FAQ + JSON-LD + AI BRIEF */}
      {subTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Deterministic JSON-LD & Ready FAQ */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#5B2182]">
                    Gotowe do wklejenia w &lt;head&gt; strony głównej /sklep
                  </p>
                  <h2 className="text-base font-semibold text-[#121926]">
                    Schema.org JSON-LD (Product + FAQPage)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(jsonLdSnippet, setCopiedJsonLd)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedJsonLd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj kod</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-[#414751] leading-relaxed">
                Zawiera realną cenę <span className="font-mono">39,92 PLN</span> (min. 8 szt. po{' '}
                <span className="font-mono">4,99 PLN</span>), dostawę wyłącznie w Polsce (ORLEN
                Paczka i InPost) i 4 pytania FAQ.{' '}
                <strong className="text-[#121926]">Celowo pomija oceny/gwiazdki</strong>, więc przy 0
                zamówień jest w 100% zgodny z Dyrektywą Omnibus.
              </p>

              <pre className="p-3.5 rounded-xl bg-[#121926] text-[#FFFBEF] text-[11px] font-mono overflow-x-auto max-h-[280px] leading-relaxed">
                {jsonLdSnippet}
              </pre>
            </section>

            <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-[#121926]">
                    Gotowe 4 pytania FAQ na /sklep
                  </h2>
                  <p className="text-xs text-[#646A75]">
                    Zastępują rozbudowanego bloga i zbijają obiekcje przed zakupem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(faqPlainText, setCopiedFaq)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedFaq ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj FAQ</span>
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y divide-[#F1ECE1]">
                {PODROZOWKA_FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <h3 className="text-xs font-semibold text-[#121926]">{item.question}</h3>
                    <p className="text-xs text-[#414751] leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Gemini Brief & Copy Generator */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5B2182]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D99B00]" />
                  <span>Generator SEO &amp; GEO (dopasowany do braku bloga i 6 h/tydz.)</span>
                </div>
                <h2 className="text-lg font-semibold text-[#121926]">
                  Wygeneruj teksty on-page /sklep, tagi GSC lub wzmianki zewnętrzne
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MODULE3_BRIEF_PRESETS.map((preset) => {
                  const active = preset.id === selectedGoal;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectGoal(preset.id)}
                      className={`text-left p-3.5 rounded-xl border transition-colors space-y-1 ${
                        active
                          ? 'bg-[#FFF2CC] border-[#FFBF00] text-[#121926]'
                          : 'bg-[#FAF6EA]/60 border-[#E8E1D3] hover:bg-[#FAF6EA] text-[#414751]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#121926]">{preset.label}</p>
                      <p className="text-[11px] leading-relaxed">{preset.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121926] mb-1">
                    Intencja zakupowa / sytuacja podróżnicza (CEP)
                  </label>
                  <input
                    type="text"
                    value={cepFocus}
                    onChange={(e) => setCepFocus(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#121926] mb-1">
                    Dodatkowe uwagi (opcjonalnie, np. konkretna grupa FB lub podstrona)
                  </label>
                  <textarea
                    rows={2}
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    placeholder="Np. wątek na grupie Erasmus Polska 2026 albo aktualny nagłówek ze strony głównej..."
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-[#646A75]">
                  {activePreset.usesSearch
                    ? 'Tryb z Google Search na żywo (szuka realnych rankingów/blogów)'
                    : 'Automatyczna kontrola Antywzorców (bez wizytówek, magnesów, uploadu)'}
                </span>
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{generating ? 'Generowanie...' : 'Generuj pakiet SEO & GEO'}</span>
                </button>
              </div>
            </section>

            {genError && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 text-xs text-[#991B1B]">
                {genError}
              </div>
            )}

            {briefOutput && (
              <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#121926]">{activePreset.label}</h3>
                    {generatedAt && (
                      <p className="text-xs font-mono text-[#646A75]">Wygenerowano o {generatedAt}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(briefOutput, setCopiedBrief)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors"
                    >
                      {copiedBrief ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedBrief ? 'Skopiowano' : 'Kopiuj tekst'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBriefToRuns}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedToDeck ? 'Zapisano w historii' : 'Zapisz wynik'}</span>
                    </button>
                    {onSendToHumanizer && (
                      <button
                        type="button"
                        onClick={() => onSendToHumanizer(briefOutput)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FFF2CC] hover:bg-[#FFEA9F] border border-[#E8D590] rounded-lg transition-colors"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>Uczłowiecz</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSendToFacebook(briefOutput)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Do Facebook + UTM</span>
                    </button>
                  </div>
                </div>

                {briefFindings && briefFindings.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-1.5">
                    <p className="text-xs font-semibold text-[#991B1B]">
                      Ostrzeżenia Lintera Antywzorców:
                    </p>
                    {briefFindings.map((f) => (
                      <p key={f.id} className="text-xs text-[#7F1D1D]">
                        • {f.term}: {f.reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-[#121926]">
                  <Markdown remarkPlugins={[remarkGfm]}>{briefOutput}</Markdown>
                </div>

                {briefSources.length > 0 && (
                  <div className="pt-3 border-t border-[#F1ECE1] space-y-1.5">
                    <p className="text-xs font-semibold text-[#646A75]">
                      Źródła odnalezione w Google Search:
                    </p>
                    <ul className="space-y-1">
                      {briefSources.map((src) => (
                        <li key={src.uri} className="text-xs">
                          <a
                            href={src.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#5B2182] hover:underline"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: LEGAL GATE & 10 GEO QUESTIONS */}
      {subTab === 'legal-geo' && (
        <div className="space-y-6">
          {/* Legal Compliance Gate */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#F1ECE1] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5B2182]">
                  <ShieldCheck className="w-4 h-4 text-[#3B0754]" />
                  <span>Bramka Prawna E-commerce</span>
                </div>
                <h2 className="text-lg font-semibold text-[#121926]">
                  4 zasady bezpieczeństwa przed pierwszą publikacją (Omnibus, AI Act, RODO)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEGAL_CHECKLIST_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA]/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#5B2182]">{rule.area}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#121926]">{rule.title}</h3>
                  <p className="text-xs text-[#414751] leading-relaxed">{rule.rule}</p>
                  <p className="text-xs font-medium text-[#121926] bg-white border border-[#E8E1D3] rounded-lg p-2.5 leading-relaxed">
                    W praktyce podrozowka.pl: {rule.actionForPodrozowka}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 10 GEO Benchmark Questions */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE1] pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#121926]">
                  Comiesięczny test 10 pytań GEO (ChatGPT / Perplexity / Google AI Overviews)
                </h2>
                <p className="text-xs text-[#646A75]">
                  Kopiuj poniższe pytania do czystej sesji AI, kliknij status i zapisuj, kiedy
                  modele zaczną wymieniać <span className="font-mono">podrozowka.pl</span>.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono tabular-nums font-semibold text-[#121926]">
                  Cytowania: {citedCount} / {GEO_TEST_QUESTIONS.length} · Przetestowano:{' '}
                  {testedCount}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#F1ECE1]">
              {GEO_TEST_QUESTIONS.map((item, idx) => {
                const status = geoStatuses[item.id] ?? 'untested';
                const statusLabel =
                  status === 'cited'
                    ? 'Cytuje podrozowka.pl'
                    : status === 'missing'
                      ? 'Nie cytuje (luka)'
                      : 'Nie testowano';
                const statusColor =
                  status === 'cited'
                    ? 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]'
                    : status === 'missing'
                      ? 'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]'
                      : 'text-[#646A75] bg-[#FAF6EA] border-[#E8E1D3]';

                return (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                        <span className="font-mono tabular-nums font-semibold text-[#5B2182]">
                          #{idx + 1}
                        </span>
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Intencja: {item.intent}</span>
                      </div>
                      <p className="text-sm font-medium text-[#121926]">{item.prompt}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(item.prompt);
                          setCopiedGeoId(item.id);
                          setTimeout(() => setCopiedGeoId(null), 1600);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap"
                      >
                        {copiedGeoId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedGeoId === item.id ? 'Skopiowano' : 'Kopiuj'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCycleGeoStatus(item.id)}
                        className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors whitespace-nowrap ${statusColor}`}
                      >
                        {statusLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
