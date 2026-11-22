'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookmarkPlus,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Copy,
  Feather,
  Film,
  Layers,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  AgentRunRecord,
  BrandContextData,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, type ValidationGate } from '@/data/marketing-plan';
import { CopyLintFinding, lintPodrozowkaCopy } from '@/lib/lint-copy';
import {
  buildModule4UtmUrl,
  FOUR_WEEK_ORGANIC_PLAN,
  PHYSICAL_SHOT_LIST,
  SOCIAL_SEGMENTS,
  SOCIAL_SEVEN_TYPES,
  SocialFormatMode,
  SocialPostTypeId,
  SocialSegmentId,
  WEEKLY_6H_ALLOCATION,
} from '@/lib/social-module4';

interface SocialModule4PanelProps {
  brandContext: BrandContextData;
  validationGates?: ValidationGate[];
  onSaveRun: (run: AgentRunRecord) => void;
  onSendToFacebook: (
    draftText: string,
    utmCampaign?: string,
    utmContent?: string
  ) => void;
  onSendToHumanizer?: (draftText: string) => void;
}

type SubTabId = 'physical-pack' | 'generator' | 'matrix';

const M4_PROGRESS_KEY = 'podrozowka_m4_checklist_v1';
const EMPTY_MAP: Record<string, boolean> = {};

function subscribeM4Store(onChange: () => void) {
  window.addEventListener('podrozowka-m4-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('podrozowka-m4-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export default function SocialModule4Panel({
  brandContext,
  validationGates,
  onSaveRun,
  onSendToFacebook,
  onSendToHumanizer,
}: SocialModule4PanelProps) {
  const resolvedGates =
    validationGates && validationGates.length > 0 ? validationGates : DEFAULT_VALIDATION_GATES;
  const reviewsGatePassed =
    resolvedGates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';
  const [subTab, setSubTab] = useState<SubTabId>('physical-pack');

  // Persisted shot + week checklist via useSyncExternalStore
  const progressCacheRef = useRef<{ raw: string | null; value: Record<string, boolean> }>({
    raw: null,
    value: EMPTY_MAP,
  });

  const getProgressSnapshot = useCallback((): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(M4_PROGRESS_KEY);
      if (!raw) return EMPTY_MAP;
      if (progressCacheRef.current.raw === raw) return progressCacheRef.current.value;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      progressCacheRef.current = { raw, value: parsed };
      return parsed;
    } catch {
      return EMPTY_MAP;
    }
  }, []);

  const getServerSnapshot = useCallback(() => EMPTY_MAP, []);
  const doneMap = useSyncExternalStore(
    subscribeM4Store,
    getProgressSnapshot,
    getServerSnapshot
  );

  const toggleDoneItem = (id: string) => {
    const next = { ...doneMap, [id]: !doneMap[id] };
    try {
      const serialized = JSON.stringify(next);
      localStorage.setItem(M4_PROGRESS_KEY, serialized);
      progressCacheRef.current = { raw: serialized, value: next };
    } catch {
      // Ignore storage quota errors
    }
    window.dispatchEvent(new Event('podrozowka-m4-change'));
  };

  // Generator state
  const [postTypeId, setPostTypeId] = useState<SocialPostTypeId>('counter-intuitive');
  const [segmentId, setSegmentId] = useState<SocialSegmentId>('erasmus');
  const [cardId, setCardId] = useState<string>(PODROZOWKA_CATALOG[0].id);
  const [shotId, setShotId] = useState<string>(PHYSICAL_SHOT_LIST[0].id);
  const [formatMode, setFormatMode] = useState<SocialFormatMode>('reel-and-fb');
  const [extraNotes, setExtraNotes] = useState('');

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string | null>(null);
  const [outputFindings, setOutputFindings] = useState<CopyLintFinding[] | null>(null);
  const [outputUtmCampaign, setOutputUtmCampaign] = useState<string>('');
  const [outputUtmContent, setOutputUtmContent] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedRun, setSavedRun] = useState(false);

  const selectedPostType = useMemo(
    () => SOCIAL_SEVEN_TYPES.find((t) => t.id === postTypeId) ?? SOCIAL_SEVEN_TYPES[0],
    [postTypeId]
  );

  const previewUtmCampaign = useMemo(
    () => `${selectedPostType.recommendedUtmCampaign}_${segmentId.replace('-', '_')}`,
    [selectedPostType, segmentId]
  );

  const previewUtmContent = useMemo(
    () => `${selectedPostType.recommendedUtmContent}_${shotId}`,
    [selectedPostType, shotId]
  );

  const previewUtmUrl = useMemo(
    () => buildModule4UtmUrl(previewUtmCampaign, previewUtmContent),
    [previewUtmCampaign, previewUtmContent]
  );

  const shotsDone = PHYSICAL_SHOT_LIST.filter((s) => doneMap[s.id]).length;
  const weeksDone = FOUR_WEEK_ORGANIC_PLAN.filter((w) => doneMap[w.id]).length;

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleOpenWeekInGenerator = (weekId: string) => {
    const slot = FOUR_WEEK_ORGANIC_PLAN.find((w) => w.id === weekId);
    if (!slot) return;
    setPostTypeId(slot.postTypeId);
    setSegmentId(slot.segmentId);
    setShotId(slot.shotId);
    setFormatMode('reel-and-fb');
    setSubTab('generator');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setSavedRun(false);
    try {
      const res = await fetch('/api/social-m4/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postTypeId,
          segmentId,
          cardId,
          shotId,
          formatMode,
          extraNotes,
          brandContext,
          validationGates: resolvedGates,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        findings?: CopyLintFinding[];
        utmCampaign?: string;
        utmContent?: string;
        generatedAt?: string;
        error?: string;
      };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Nie udało się wygenerować materiału social.');
      }
      setOutputText(data.text);
      setOutputFindings(
        data.findings ?? lintPodrozowkaCopy(data.text, { reviewsGatePassed })
      );
      setOutputUtmCampaign(data.utmCampaign || previewUtmCampaign);
      setOutputUtmContent(data.utmContent || previewUtmContent);
      setGeneratedAt(data.generatedAt ?? null);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : 'Błąd połączenia z generatorem social.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveResult = () => {
    if (!outputText) return;
    onSaveRun({
      id: `m4-${Date.now()}`,
      agentId: 'architekt-social',
      agentName: `Social · ${selectedPostType.name}`,
      createdAt: generatedAt || 'teraz',
      prompt: `${selectedPostType.name} | ${segmentId} | ${shotId}`,
      output: outputText,
    });
    setSavedRun(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
              <span className="font-semibold text-[#5B2182]">
                Organiczne Social Media
              </span>
              <span aria-hidden="true">·</span>
              <span>Fizyczne kartki · 6 h/tydz. · Wysyłka PL: ORLEN Paczka i InPost</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#121926]">
              Pakiet z fizycznych kartek, 7 Typów Postów i Rolki 9:16
            </h1>
            <p className="text-sm text-[#414751] max-w-3xl leading-relaxed">
              Zamiast grafik AI udających podróżników nagrywasz 4 proste ujęcia telefonem z
              prawdziwych kartek i zamieniasz je w 4 tygodnie postów FB, wpisów na grupy w Polsce
              oraz rolek 9:16 z tagowaniem UTM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSubTab('generator')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generator Postów &amp; Rolek</span>
            </button>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1ECE1]">
          <button
            type="button"
            onClick={() => setSubTab('physical-pack')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              subTab === 'physical-pack'
                ? 'bg-[#FFF2CC] text-[#121926]'
                : 'text-[#414751] hover:bg-[#FAF6EA]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Pakiet z Fizycznych Kartek (4 Tygodnie)</span>
            <span className="font-mono tabular-nums text-[11px] text-[#5B2182]">
              ({shotsDone + weeksDone}/{PHYSICAL_SHOT_LIST.length + FOUR_WEEK_ORGANIC_PLAN.length})
            </span>
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
            <Film className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Generator 7 Typów Postów &amp; Rolek</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('matrix')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              subTab === 'matrix'
                ? 'bg-[#FFF2CC] text-[#121926]'
                : 'text-[#414751] hover:bg-[#FAF6EA]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#3B0754]" />
            <span>Matryca 7 Typów &amp; Budżet 6 h/tydz.</span>
          </button>
        </div>
      </section>

      {/* SUBTAB 1: PHYSICAL CARDS PACK (SHOT LIST + 4-WEEK CALENDAR) */}
      {subTab === 'physical-pack' && (
        <div className="space-y-6">
          {/* Shot List (45 min session) */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE1] pb-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#5B2182]">
                  Krok A · Jedna 45-minutowa sesja smartfonem przy oknie
                </p>
                <h2 className="text-lg font-semibold text-[#121926]">
                  4 ujęcia fizycznych kartek w dłoni (baza na cały miesiąc)
                </h2>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-[#121926]">
                {shotsDone} / {PHYSICAL_SHOT_LIST.length} nagranych
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PHYSICAL_SHOT_LIST.map((shot) => {
                const isDone = Boolean(doneMap[shot.id]);
                return (
                  <div
                    key={shot.id}
                    className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                      isDone
                        ? 'bg-[#F0FDF4]/60 border-[#BBF7D0]'
                        : 'bg-[#FAF6EA]/50 border-[#E8E1D3]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-[#646A75]">
                          <span className="font-mono tabular-nums font-semibold text-[#5B2182]">
                            Ujęcie #{shot.number}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{shot.duration}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#121926]">{shot.title}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDoneItem(shot.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shrink-0 ${
                          isDone
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'bg-white border-[#C8BFB0] text-[#121926] hover:border-[#121926]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Nagrane' : 'Oznacz'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#646A75]">Kadr: {shot.framing}</p>
                    <p className="text-xs text-[#414751] leading-relaxed">{shot.whatToShow}</p>
                    <p className="text-xs font-medium text-[#121926] bg-white border border-[#E8E1D3] rounded-lg px-3 py-2">
                      {shot.audioOrCaptionNote}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4-Week Calendar */}
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE1] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5B2182]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Krok B · Harmonogram publikacji (6 h/tydz., tylko Polska)</span>
                </div>
                <h2 className="text-lg font-semibold text-[#121926]">
                  4-tygodniowy plan publikacji z gotowymi linkami UTM
                </h2>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-[#121926]">
                {weeksDone} / {FOUR_WEEK_ORGANIC_PLAN.length} tygodni wdrożonych
              </span>
            </div>

            <div className="divide-y divide-[#F1ECE1]">
              {FOUR_WEEK_ORGANIC_PLAN.map((slot) => {
                const isDone = Boolean(doneMap[slot.id]);
                const fullUrl = buildModule4UtmUrl(slot.utmCampaign, slot.utmContent);
                return (
                  <div
                    key={slot.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                        <span className="font-semibold text-[#5B2182]">{slot.weekLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{slot.timeBudget}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            isDone ? 'text-[#16A34A]' : 'text-[#D97706]'
                          }`}
                        >
                          {isDone ? 'Opublikowano' : 'Do publikacji'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#121926]">{slot.title}</h3>
                      <p className="text-xs text-[#414751]">
                        <strong>Kanały:</strong> {slot.channels} · <strong>Cel:</strong>{' '}
                        {slot.deliverable}
                      </p>
                      <p className="text-[11px] font-mono text-[#646A75] break-all">{fullUrl}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(slot.id, fullUrl)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap"
                      >
                        {copiedId === slot.id ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === slot.id ? 'Skopiowano UTM' : 'Kopiuj UTM'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenWeekInGenerator(slot.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generuj teksty</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleDoneItem(slot.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                          isDone
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'bg-white border-[#C8BFB0] text-[#121926] hover:border-[#121926]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Zrobione' : 'Odhacz'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SUBTAB 2: GENERATOR */}
      {subTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#121926]">
              Parametry posta i rolki z fizycznej kartki
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  1. Typ posta (Matryca 7 Typów)
                </label>
                <select
                  value={postTypeId}
                  onChange={(e) => setPostTypeId(e.target.value as SocialPostTypeId)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                >
                  {SOCIAL_SEVEN_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.number} {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#646A75] mt-1">{selectedPostType.angle}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  2. Segment docelowy (Polacy przed wyjazdem)
                </label>
                <select
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value as SocialSegmentId)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                >
                  {SOCIAL_SEGMENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  3. Fizyczna kartka z katalogu {PODROZOWKA_CATALOG.length} gotowych kadrów
                </label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                >
                  {PODROZOWKA_CATALOG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category}: {c.sampleTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  4. Ujęcie z Shot Listy smartfona
                </label>
                <select
                  value={shotId}
                  onChange={(e) => setShotId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                >
                  {PHYSICAL_SHOT_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      Ujęcie #{s.number}: {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  5. Format wyniku
                </label>
                <select
                  value={formatMode}
                  onChange={(e) => setFormatMode(e.target.value as SocialFormatMode)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                >
                  <option value="reel-and-fb">
                    Pełny pakiet (Rolka 9:16 + Post FB + Grupa PL)
                  </option>
                  <option value="carousel-7">
                    Karuzela 7 slajdów (ze Slajdem 6: Zapowiedź tripu 01.2027)
                  </option>
                  <option value="fb-group-post">Post FB + wariant na polską grupę</option>
                  <option value="reel-script-only">Tylko scenopis Rolki 9:16 ze smartfona</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#121926] mb-1">
                  Dodatkowe uwagi (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder="Np. kraj docelowy wyjazdu (Hiszpania / Japonia), konkretna grupa Erasmus..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-xl text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6EA] border border-[#E8E1D3] space-y-1">
              <p className="text-[11px] font-semibold text-[#646A75]">
                Docelowy link UTM dla GA4:
              </p>
              <p className="text-[11px] font-mono text-[#121926] break-all">{previewUtmUrl}</p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{generating ? 'Tworzenie pakietu...' : 'Generuj scenariusz i post'}</span>
            </button>
          </section>

          <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            {genError && (
              <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
                {genError}
              </div>
            )}

            {!outputText ? (
              <div className="py-14 text-center space-y-2">
                <Film className="w-8 h-8 text-[#5B2182] mx-auto" />
                <h3 className="text-base font-semibold text-[#121926]">
                  Gotowy scenariusz nagrania i post z linkiem UTM
                </h3>
                <p className="text-xs text-[#646A75] max-w-md mx-auto leading-relaxed">
                  Wybierz po lewej jeden z 7 typów postów i segment wyjazdowy. Wygenerowany tekst
                  od razu przejdzie kontrolę Antywzorców i jednym kliknięciem wyślesz go do
                  zakładki Facebook (Organic).
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#121926]">
                      #{selectedPostType.number} {selectedPostType.name}
                    </h3>
                    {generatedAt && (
                      <p className="text-xs font-mono text-[#646A75]">Wygenerowano o {generatedAt}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy('gen-out', outputText)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors"
                    >
                      {copiedId === 'gen-out' ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === 'gen-out' ? 'Skopiowano' : 'Kopiuj'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveResult}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{savedRun ? 'Zapisano' : 'Zapisz wynik'}</span>
                    </button>
                    {onSendToHumanizer && (
                      <button
                        type="button"
                        onClick={() => onSendToHumanizer(outputText)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FFF2CC] hover:bg-[#FFEA9F] border border-[#E8D590] rounded-lg transition-colors"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>Uczłowiecz</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onSendToFacebook(
                          outputText,
                          outputUtmCampaign || previewUtmCampaign,
                          outputUtmContent || previewUtmContent
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Wyślij do Facebook + UTM</span>
                    </button>
                  </div>
                </div>

                {outputFindings && outputFindings.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-1">
                    <p className="text-xs font-semibold text-[#991B1B]">
                      Ostrzeżenia Antywzorców:
                    </p>
                    {outputFindings.map((f) => (
                      <p key={f.id} className="text-xs text-[#7F1D1D]">
                        • {f.term}: {f.reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-[#121926]">
                  <Markdown remarkPlugins={[remarkGfm]}>{outputText}</Markdown>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* SUBTAB 3: 7 TYPES MATRIX + 6H BUDGET */}
      {subTab === 'matrix' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#F1ECE1] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#121926]">
                  Matryca 7 Typów Postów dla podrozowka.pl
                </h2>
                <p className="text-xs text-[#646A75]">
                  Każdy typ odpowiada jednemu kątowi komunikacyjnemu i własnemu ujęciu fizycznej
                  kartki, bez powtarzania pustych sloganów.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#F1ECE1]">
              {SOCIAL_SEVEN_TYPES.map((t) => (
                <div
                  key={t.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                      <span className="font-mono tabular-nums font-semibold text-[#5B2182]">
                        Typ #{t.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{t.recommendedUtmCampaign}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#121926]">{t.name}</h3>
                    <p className="text-xs text-[#414751]">
                      <strong>Hook:</strong> „{t.hookExample}”
                    </p>
                    <p className="text-xs text-[#646A75]">
                      <strong>Ujęcie z fizycznej kartki:</strong> {t.physicalShotHint}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPostTypeId(t.id);
                      setSubTab('generator');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFBF00] border border-[#E8E1D3] hover:border-[#FFBF00] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    Użyj w generatorze
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F1ECE1] pb-3">
              <Clock className="w-4 h-4 text-[#5B2182]" />
              <h2 className="text-base font-semibold text-[#121926]">
                Twój budżet operacyjny: 6 godzin tygodniowo (bez wypalenia)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WEEKLY_6H_ALLOCATION.map((row) => (
                <div
                  key={row.block}
                  className="p-4 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA]/60 space-y-1.5"
                >
                  <p className="text-xs font-mono tabular-nums font-bold text-[#5B2182]">
                    {row.hours}
                  </p>
                  <h3 className="text-sm font-semibold text-[#121926]">{row.block}</h3>
                  <p className="text-xs text-[#414751] leading-relaxed">{row.scope}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
