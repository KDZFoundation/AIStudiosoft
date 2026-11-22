'use client';

import { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  BookOpen,
  BookmarkPlus,
  Check,
  CheckCircle2,
  Copy,
  Feather,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AgentRunRecord, BrandContextData } from '@/data/podrozowka-kb';
import {
  HUMANIZER_GROUPS,
  HUMANIZER_PATTERNS,
  HUMANIZER_SAMPLE_DRAFTS,
  HUMANIZER_TONES,
  HumanizerGroupId,
  HumanizerMode,
  HumanizerTellMatch,
  HumanizerToneId,
  scanHumanizerTells,
} from '@/lib/humanizer';
import { CopyLintFinding, lintPodrozowkaCopy } from '@/lib/lint-copy';

interface HumanizerPanelProps {
  brandContext: BrandContextData;
  initialText?: string;
  onSaveRun: (run: AgentRunRecord) => void;
  onSendToFacebook: (draftText: string) => void;
}

interface HumanizerApiResult {
  mode: HumanizerMode;
  tone: HumanizerToneId;
  beforeTells: HumanizerTellMatch[];
  beforeBrandLint: CopyLintFinding[];
  firstRewrite: string;
  survivingTells: string[];
  finalText: string;
  afterTells: HumanizerTellMatch[];
  afterBrandLint: CopyLintFinding[];
  processedAt: string;
}

type SubTabId = 'editor' | 'patterns';

export default function HumanizerPanel({
  brandContext,
  initialText = '',
  onSaveRun,
  onSendToFacebook,
}: HumanizerPanelProps) {
  const [subTab, setSubTab] = useState<SubTabId>('editor');
  const [inputText, setInputText] = useState<string>(
    () => initialText || HUMANIZER_SAMPLE_DRAFTS[0].text
  );
  const [tone, setTone] = useState<HumanizerToneId>('social-pl');
  const [mode, setMode] = useState<HumanizerMode>('pasted');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<HumanizerApiResult | null>(null);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [savedHistory, setSavedHistory] = useState(false);

  // Patterns catalog filter
  const [groupFilter, setGroupFilter] = useState<HumanizerGroupId | 'ALL'>('ALL');

  // Live instant diagnostics on pasted text
  const liveAiTells = useMemo(() => scanHumanizerTells(inputText), [inputText]);
  const liveBrandLint = useMemo(() => lintPodrozowkaCopy(inputText), [inputText]);

  const filteredPatterns = useMemo(() => {
    if (groupFilter === 'ALL') return HUMANIZER_PATTERNS;
    return HUMANIZER_PATTERNS.filter((p) => p.group === groupFilter);
  }, [groupFilter]);

  const handleRunHumanizer = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setCopiedFinal(false);
    setSavedHistory(false);
    try {
      const res = await fetch('/api/humanizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          mode,
          tone,
          brandContext,
        }),
      });
      const data = (await res.json()) as HumanizerApiResult & { error?: string };
      if (!res.ok || !data.finalText) {
        throw new Error(data.error || 'Nie udało się uruchomić procesu Humanizer.');
      }
      setResult(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Błąd komunikacji z trasą /api/humanizer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFinal = async () => {
    if (!result?.finalText) return;
    try {
      await navigator.clipboard.writeText(result.finalText);
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSaveToHistory = () => {
    if (!result?.finalText) return;
    const toneLabel = HUMANIZER_TONES.find((t) => t.id === result.tone)?.label ?? result.tone;
    onSaveRun({
      id: `hum-${Date.now()}`,
      agentId: 'copywriter-glosu',
      agentName: `Humanizer (blader/humanizer) · ${toneLabel}`,
      prompt: inputText.slice(0, 180),
      output: result.finalText,
      createdAt: result.processedAt,
    });
    setSavedHistory(true);
  };

  return (
    <div className="space-y-6">
      {/* Header + Subtabs */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#5B2182] tracking-wide">
              Integracja blader/humanizer · 26 wzorców AI (Grupy A–F) + Zakazy Podróżówki
            </p>
            <h2 className="text-xl font-bold text-[#121926] mt-0.5">
              Humanizer (Anty-AI): oczyszczanie tekstów z maniery modeli
            </h2>
            <p className="text-sm text-[#414751] mt-1 max-w-3xl">
              Wykrywa i usuwa konstrukcje „nie X, lecz Y”, dramatyczne puenty, myślniki (—), napompowane słowa i frazesy z czatu, zachowując realne liczby marki (4,99 zł/szt., 8 szt. = 39,92 zł, 105+ krajów, 89+ języków).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F1ECE1]">
          <button
            type="button"
            onClick={() => setSubTab('editor')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'editor'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'bg-[#FAF6EA] text-[#414751] hover:bg-[#FFF2CC] border border-[#E8E1D3]'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Uczłowieczanie tekstu</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('patterns')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'patterns'
                ? 'bg-[#FFBF00] text-[#121926]'
                : 'bg-[#FAF6EA] text-[#414751] hover:bg-[#FFF2CC] border border-[#E8E1D3]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Katalog {HUMANIZER_PATTERNS.length} wzorców AI (A–F)</span>
          </button>
        </div>
      </section>

      {/* SUBTAB 1: EDITOR & 2-PASS HUMANIZER */}
      {subTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input & Live Pre-Scan */}
          <section className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#121926]">
                1. Wklej tekst do poprawy
              </h3>
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setResult(null);
                  setErrorMsg(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-[#646A75] hover:text-[#121926]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wyczyść</span>
              </button>
            </div>

            {/* Sample presets */}
            <div className="flex flex-wrap gap-1.5">
              {HUMANIZER_SAMPLE_DRAFTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setInputText(sample.text);
                    setTone(sample.tone);
                    setResult(null);
                  }}
                  className="px-3 py-1 text-[11px] font-medium text-[#3B0754] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <textarea
              rows={11}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Wklej post na Facebooka, opis na /sklep, odpowiedź na grupę FB albo wiadomość do blogera..."
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3.5 py-3 text-xs text-[#121926] leading-relaxed placeholder:text-[#646A75] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FFBF00]"
            />

            {/* Voice Register & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                  Docelowy rejestr głosu
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as HumanizerToneId)}
                  className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                >
                  {HUMANIZER_TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#646A75] mb-1">
                  Tryb (blader/humanizer)
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as HumanizerMode)}
                  className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
                >
                  <option value="pasted">Pełny 2-przebiegowy (Szkic → Audyt → Finał)</option>
                  <option value="embedded">Szybki Embedded (bezpośrednio finał)</option>
                </select>
              </div>
            </div>

            {/* Instant Zero-Latency Pre-Scan */}
            <div className="rounded-xl border border-[#E8E1D3] bg-[#FFFDF7] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#121926]">
                  Skaner na żywo (0 ms)
                </span>
                <span className="font-mono text-[11px] text-[#414751]">
                  AI tells: <strong>{liveAiTells.length}</strong> · Zakazy marki:{' '}
                  <strong>{liveBrandLint.length}</strong>
                </span>
              </div>

              {liveAiTells.length === 0 && liveBrandLint.length === 0 ? (
                <p className="text-xs text-[#15803D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Brak prostych słów kluczowych AI i zakazów marki. AI sprawdzi jeszcze strukturę i rytm.</span>
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {liveBrandLint.map((f) => (
                    <div
                      key={f.id}
                      className="text-[11px] rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1.5 text-[#991B1B]"
                    >
                      <strong>[ZAKAZ MARKI] {f.term}:</strong> {f.reason}
                    </div>
                  ))}
                  {liveAiTells.map((t, idx) => (
                    <div
                      key={`${t.patternId}-${idx}`}
                      className="text-[11px] rounded-lg bg-[#FFF8E1] border border-[#FDE68A] px-2.5 py-1.5 text-[#78350F]"
                    >
                      <strong>{t.label}</strong> („{t.matchedText}”): {t.advice}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C]">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleRunHumanizer()}
              disabled={loading || !inputText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] disabled:opacity-60 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? 'Przeprowadzam 2-etapowy Humanizer...'
                  : 'Uczłowiecz tekst (blader/humanizer)'}
              </span>
            </button>
          </section>

          {/* Right: 2-Pass Output */}
          <section className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#121926]">
                  2. Wynik procedury Humanizer
                </h3>
                <p className="text-xs text-[#646A75]">
                  {result
                    ? `Przetworzono o ${result.processedAt} · Po czyszczeniu: ${result.afterTells.length} wzorców AI, ${result.afterBrandLint.length} zakazów marki`
                    : 'Pierwszy szkic → Audyt ocalałych nawyków → Wersja finalna'}
                </p>
              </div>

              {result && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyFinal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedFinal ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFinal ? 'Skopiowano' : 'Kopiuj finał'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{savedHistory ? 'Zapisano' : 'Zapisz w Historii'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToFacebook(result.finalText)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Wyślij do Facebooka</span>
                  </button>
                </div>
              )}
            </div>

            {!result ? (
              <div className="py-14 text-center space-y-2">
                <Feather className="w-8 h-8 text-[#5B2182] mx-auto" />
                <p className="text-sm font-semibold text-[#121926]">
                  Gotowy do oczyszczenia dowolnego tekstu marketingowego
                </p>
                <p className="text-xs text-[#646A75] max-w-md mx-auto leading-relaxed">
                  Wybierz gotowy przykład po lewej albo wklej szkic z Agenta / Generatora SEO / Social Media. Narzędzie pokaże dokładnie, które wzorce §1–§26 usunęło i sprawdzi wynik pod kątem zakazów marki Podróżówka.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Post-audit verification strip */}
                <div
                  className={`rounded-xl border p-3.5 text-xs flex flex-wrap items-center justify-between gap-2 ${
                    result.afterTells.length === 0 && result.afterBrandLint.length === 0
                      ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                      : 'bg-[#FFF8E1] border-[#FDE68A] text-[#78350F]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {result.afterTells.length === 0 && result.afterBrandLint.length === 0 ? (
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      Audyt po przepisaniu: {result.afterTells.length} wzorców AI ·{' '}
                      {result.afterBrandLint.length} zakazów marki (przed:{' '}
                      {result.beforeTells.length} AI / {result.beforeBrandLint.length} marka)
                    </span>
                  </div>
                </div>

                {/* Final Version */}
                <div className="rounded-2xl border-2 border-[#FFBF00] bg-[#FFFDF7] p-5 space-y-2.5">
                  <p className="text-xs font-bold text-[#3B0754] uppercase tracking-wider">
                    Wersja finalna (gotowa do publikacji)
                  </p>
                  <div className="prose prose-sm max-w-none text-[#121926]">
                    <Markdown remarkPlugins={[remarkGfm]}>{result.finalText}</Markdown>
                  </div>
                </div>

                {/* Surviving Tells + First Rewrite (when mode === 'pasted') */}
                {result.survivingTells.length > 0 && (
                  <div className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-4 space-y-2">
                    <p className="text-xs font-semibold text-[#121926]">
                      Co wychwycił audyt między 1. a 2. przebiegiem:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-[#414751]">
                      {result.survivingTells.map((tell, idx) => (
                        <li key={idx}>{tell}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.mode === 'pasted' && result.firstRewrite && (
                  <details className="rounded-xl border border-[#E8E1D3] bg-white p-4 text-xs">
                    <summary className="cursor-pointer font-semibold text-[#414751] hover:text-[#121926]">
                      Pokaż pierwszą wersję roboczą (przed 2. kontrolą wzorców)
                    </summary>
                    <div className="mt-3 pt-3 border-t border-[#F1ECE1] whitespace-pre-wrap text-[#414751] leading-relaxed">
                      {result.firstRewrite}
                    </div>
                  </details>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBTAB 2: ALL 26 PATTERNS REFERENCE */}
      {subTab === 'patterns' && (
        <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1ECE1] pb-4">
            <div>
              <h3 className="text-base font-semibold text-[#121926]">
                Wszystkie 26 wzorców AI z repozytorium blader/humanizer (PL + EN)
              </h3>
              <p className="text-xs text-[#646A75] mt-0.5">
                Wzory z grupy A (Teatr) i E (Resztki z czatu) wymagają poprawy już przy pojedynczym wystąpieniu.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  groupFilter === 'ALL'
                    ? 'bg-[#FFBF00] text-[#121926] font-semibold'
                    : 'bg-[#FAF6EA] text-[#414751] border border-[#E8E1D3]'
                }`}
              >
                Wszystkie (26)
              </button>
              {HUMANIZER_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupFilter(g.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    groupFilter === g.id
                      ? 'bg-[#FFBF00] text-[#121926] font-semibold'
                      : 'bg-[#FAF6EA] text-[#414751] border border-[#E8E1D3]'
                  }`}
                >
                  Grupa {g.id}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatterns.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-[#E8E1D3] bg-[#FFFDF7] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono font-bold text-[#3B0754]">
                    §{p.id} · Grupa {p.group} ({p.groupLabel})
                  </span>
                  <span
                    className={`font-mono px-1.5 py-0.5 rounded border ${
                      p.strength === 'strong'
                        ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                        : 'bg-[#FAF6EA] text-[#646A75] border-[#E8E1D3]'
                    }`}
                  >
                    {p.strength === 'strong' ? 'Silny sygnał' : 'Słabszy (w skupiskach)'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#121926]">
                  {p.plName}{' '}
                  <span className="font-normal text-xs text-[#646A75]">({p.name})</span>
                </h4>
                <p className="text-xs text-[#414751] leading-relaxed">{p.summary}</p>
                <p className="text-[11px] font-mono text-[#5B2182] bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg px-2.5 py-1.5">
                  Na co uważać: {p.watchFor}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
