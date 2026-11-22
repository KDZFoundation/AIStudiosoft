'use client';

import { useState } from 'react';
import Image from 'next/image';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  MessageSquareMore,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  BrandContextData,
  DEFAULT_BRAND_CONTEXT,
  PODROZOWKA_CATALOG,
} from '@/data/podrozowka-kb';

interface BrandBrainPanelProps {
  brandContext: BrandContextData;
  onSave: (updated: BrandContextData) => Promise<void>;
  onReset: () => Promise<void>;
}

interface BrandScanResult {
  ok: boolean;
  checkedAt: string;
  status: number;
  shopStatus: number | null;
  title: string;
  description: string;
  h1: string;
  factualChecks?: Array<{ label: string; found: boolean }>;
  error?: string;
}

const CATEGORIES = ['Wszystkie', 'Natura', 'Architektura', 'Sztuka', 'Wydarzenia', 'Postacie'] as const;

export default function BrandBrainPanel({
  brandContext,
  onSave,
  onReset,
}: BrandBrainPanelProps) {
  const [draft, setDraft] = useState<BrandContextData>({
    ...DEFAULT_BRAND_CONTEXT,
    ...brandContext,
  });
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('Wszystkie');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Lesson 7 live scan & gap interview states
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BrandScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewText, setInterviewText] = useState<string | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [copied10Points, setCopied10Points] = useState(false);

  const filteredCatalog =
    selectedCategory === 'Wszystkie'
      ? PODROZOWKA_CATALOG
      : PODROZOWKA_CATALOG.filter((item) => item.category === selectedCategory);

  const handleFieldChange = (field: keyof BrandContextData, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayLinesChange = (
    field: 'goodExamples' | 'badExamples' | 'tenPointSummary',
    value: string
  ) => {
    const lines = value.split('\n');
    setDraft((prev) => ({ ...prev, [field]: lines }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const cleaned: BrandContextData = {
        ...draft,
        goodExamples: draft.goodExamples.map((l) => l.trim()).filter(Boolean),
        badExamples: draft.badExamples.map((l) => l.trim()).filter(Boolean),
        tenPointSummary: draft.tenPointSummary.map((l) => l.trim()).filter(Boolean),
      };
      await onSave(cleaned);
      setDraft(cleaned);
      setStatusMessage(
        'Zapisano zmiany w Mózgu Marki i Preferencjach Operatora. Wszyscy agenci korzystają już z nowej wersji.'
      );
    } catch {
      setStatusMessage('Nie udało się zapisać zmian. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await onReset();
      setStatusMessage('Przywrócono bazowy Dokument Kontekstowy Marki Podróżówka.');
    } finally {
      setSaving(false);
    }
  };

  const handleLiveScan = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch('/api/brand/scan');
      const data = (await res.json()) as BrandScanResult;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Nie udało się przeskanować podrozowka.pl.');
      }
      setScanResult(data);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : 'Błąd skanowania podrozowka.pl.');
    } finally {
      setScanning(false);
    }
  };

  const handleGapInterview = async () => {
    setInterviewLoading(true);
    setInterviewError(null);
    try {
      const res = await fetch('/api/brand/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandContext: draft }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        interview?: string;
        error?: string;
      };
      if (!res.ok || !data.interview) {
        throw new Error(data.error || 'Nie udało się wygenerować wywiadu luk.');
      }
      setInterviewText(data.interview);
    } catch (err: unknown) {
      setInterviewError(
        err instanceof Error ? err.message : 'Błąd podczas generowania pytań wywiadu.'
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleCopy10Points = async () => {
    try {
      const text = (draft.tenPointSummary ?? []).filter(Boolean).join('\n');
      await navigator.clipboard.writeText(text);
      setCopied10Points(true);
      setTimeout(() => setCopied10Points(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportMarkdown = () => {
    const md = [
      `# Dokument Kontekstowy Marki · ${draft.companyName}`,
      ``,
      `Strona: ${draft.websiteUrl} | Sklep: ${draft.shopUrl}`,
      ``,
      `## 0. Instrukcja niestandardowa operatora`,
      draft.operatorPreferences,
      ``,
      `## 1.1 Kim jesteśmy (Elevator Pitch)`,
      draft.elevatorPitch,
      ``,
      `## Positioning Statement`,
      draft.positioningStatement,
      ``,
      `## 1.2 Oferta, ceny i logistyka`,
      draft.offerSummary,
      ``,
      `## Reguła zdjęć w sklepie (Stan obecny vs Przyszłość)`,
      `TERAZ: ${draft.photoLibraryRuleNow}`,
      `PRZYSZŁOŚĆ: ${draft.photoLibraryRuleFuture}`,
      ``,
      `## 1.3 Priorytety na 6–12 miesięcy`,
      draft.businessPriorities,
      ``,
      `## 1.4 Analiza Churn i LTV`,
      draft.churnLtvModel || DEFAULT_BRAND_CONTEXT.churnLtvModel,
      ``,
      `## 2.1 Grupa docelowa i Anty-persona`,
      draft.personasSummary,
      ``,
      `Anty-persona: ${draft.antiPersona}`,
      ``,
      `Category Entry Points (CEP):`,
      draft.categoryEntryPoints,
      ``,
      `## 2.2 Opinie i zasady prawdy`,
      draft.customerQuotesOrGaps,
      ``,
      `## 2.3 Status wypełnienia`,
      draft.completionStatusNotes,
      ``,
      `## 3. Przewagi, Obietnice których NIE składamy i Alternatywy`,
      draft.competitiveAdvantages,
      ``,
      `Obietnice zakazane:`,
      draft.promisesNeverMade,
      ``,
      `Alternatywy rynkowe:`,
      draft.competitorsAndAlternatives,
      ``,
      `## 4. Karta Głosu, Przykłady i Antywzorce`,
      `Ton: ${draft.toneOfVoice}`,
      ``,
      `Frazy charakterystyczne:`,
      draft.characteristicPhrases,
      ``,
      `Dobre przykłady:`,
      ...draft.goodExamples.map((e) => `- ${e}`),
      ``,
      `Złe przykłady:`,
      ...draft.badExamples.map((e) => `- ${e}`),
      ``,
      `Czego NIGDY nie piszemy:`,
      draft.hardBans,
      ``,
      `## Podsumowanie w 10 punktach`,
      ...draft.tenPointSummary,
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dokument-kontekstowy-podrozowka.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const operatorCharCount = (draft.operatorPreferences ?? '').length;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8E1D3] rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-[#121926]">
            Mózg Marki · Dokument Kontekstowy podrozowka.pl
          </h2>
          <p className="text-sm text-[#414751] mt-1">
            Źródło prawdy zasilające wszystkich 8 agentów marketingowych oraz Linter Antywzorców (w tym dobre/złe przykłady i instrukcję operatora).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Przywróć wzorzec</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Zapisywanie...' : 'Zapisz kontekst'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#14532D] text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Lesson 7: Live Website Audit & Gap Interview */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1ECE1] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#121926]">
              Weryfikacja na żywo i Wywiad Uzupełniający Luki
            </h3>
            <p className="text-xs text-[#646A75] mt-0.5">
              Sprawdź aktualną zawartość podrozowka.pl oraz wygeneruj pytania wywiadu do właściciela dla sekcji oznaczonych jako [BRAK DANYCH] lub [HIPOTEZA].
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleLiveScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5 text-[#5B2182]" />
              <span>{scanning ? 'Skanowanie…' : 'Skanuj podrozowka.pl na żywo'}</span>
            </button>
            <button
              type="button"
              onClick={handleGapInterview}
              disabled={interviewLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#3B0754] hover:bg-[#2D0540] rounded-full transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <MessageSquareMore className="w-3.5 h-3.5 text-[#FFBF00]" />
              <span>
                {interviewLoading ? 'Analiza luk…' : 'Wygeneruj wywiad luk'}
              </span>
            </button>
          </div>
        </div>

        {scanError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs px-4 py-3 rounded-xl">
            {scanError}
          </div>
        )}

        {scanResult && (
          <div className="rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#121926]">
                Ostatni skan na żywo ({scanResult.checkedAt}) · HTTP {scanResult.status}
                {scanResult.shopStatus ? ` · /sklep HTTP ${scanResult.shopStatus}` : ''}
              </span>
              <span className="font-medium text-[#15803D]">Połączenie z podrozowka.pl OK</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-[#646A75]">Tytuł strony (&lt;title&gt;):</p>
                <p className="font-medium text-[#121926]">{scanResult.title}</p>
                {scanResult.h1 && (
                  <>
                    <p className="text-[#646A75] mt-2">Nagłówek H1:</p>
                    <p className="font-medium text-[#121926]">{scanResult.h1}</p>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-[#646A75]">Weryfikacja parametrów oferty na stronie:</p>
                <ul className="space-y-1">
                  {(scanResult.factualChecks ?? []).map((chk) => (
                    <li key={chk.label} className="flex items-center gap-2 text-[#121926]">
                      <span
                        className={`font-mono font-semibold ${
                          chk.found ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {chk.found ? '[FAKT]' : '[DO SPRAWDZENIA]'}
                      </span>
                      <span>{chk.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {interviewError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D] text-xs px-4 py-3 rounded-xl">
            {interviewError}
          </div>
        )}

        {interviewText && (
          <div className="rounded-xl border border-[#E8E1D3] bg-[#FFF9E2]/60 p-5 agent-prose max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{interviewText}</Markdown>
          </div>
        )}
      </section>

      {/* Lessons 2 & 5 Operator Preferences + Lesson 6 10-Point Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#121926]">
                0. Instrukcja niestandardowa operatora
              </h3>
              <p className="text-xs text-[#646A75] mt-0.5">
                Preferencje komunikacji AI, antywzorce stylu (brak pochlebstw) i standard Gł. Stratega. Limit narzędzi czatu: 1500 znaków.
              </p>
            </div>
            <span
              className={`text-xs font-mono tabular-nums font-semibold ${
                operatorCharCount > 1500 ? 'text-[#B45309]' : 'text-[#5B2182]'
              }`}
            >
              {operatorCharCount} / 1500 znaków
            </span>
          </div>
          <textarea
            rows={7}
            value={draft.operatorPreferences ?? ''}
            onChange={(e) => handleFieldChange('operatorPreferences', e.target.value)}
            className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-3 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#121926]">
                Podsumowanie w 10 punktach
              </h3>
              <p className="text-xs text-[#646A75] mt-0.5">
                Szybka pigułka do wklejenia do projektów lub narzędzi zewnętrznych.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy10Points}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied10Points ? 'Skopiowano' : 'Kopiuj'}</span>
            </button>
          </div>
          <textarea
            rows={8}
            value={(draft.tenPointSummary ?? []).join('\n')}
            onChange={(e) => handleArrayLinesChange('tenPointSummary', e.target.value)}
            className="w-full flex-1 rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
          />
        </div>
      </section>

      {/* Photo Truth Rule & Visual Product Anatomy */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-[#E8E1D3] rounded-2xl p-6">
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            Anatomia awersu (podziękowanie) i rewersu z kodem QR
          </h3>
          <div className="relative aspect-[3/2] rounded-xl overflow-hidden border border-[#E8E1D3] bg-[#FFF9E2]">
            <Image
              src="/images/rewers-podrozowka.png"
              alt="Rewers odwróconej pocztówki Podróżówka"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-[#414751] leading-relaxed">
            Przód (awers) pokazuje jedno z {PODROZOWKA_CATALOG.length} gotowych zdjęć Polski oraz podziękowanie w języku kraju docelowego. Rewers zawiera mapę, miejsce na odręczne słowa, zachętę do skanowania oraz kod QR, przez który Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[#121926]">
              Reguły fotografii i wyboru wzorów w sklepie
            </h3>
            <p className="text-xs text-[#646A75] mt-0.5">
              Agenci pilnują, aby nie obiecywać funkcji, których sklep obecnie nie ma ani wgrywania zdjęć klienta.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#121926] mb-1">
                Stan obecny (teraz w podrozowka.pl/sklep)
              </label>
              <textarea
                rows={3}
                value={draft.photoLibraryRuleNow}
                onChange={(e) => handleFieldChange('photoLibraryRuleNow', e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#121926] mb-1">
                Plan rozwoju (przyszłość, nigdy prywatny upload)
              </label>
              <textarea
                rows={3}
                value={draft.photoLibraryRuleFuture}
                onChange={(e) => handleFieldChange('photoLibraryRuleFuture', e.target.value)}
                className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Real 10 Card Designs from Firestore */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1ECE1] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#121926]">
              {PODROZOWKA_CATALOG.length} rzeczywistych zdjęć katalogu sklepu (podrozowka-production)
            </h3>
            <p className="text-xs text-[#646A75] mt-0.5">
              Pobrane bezpośrednio z bazy produkcyjnej · 5 kategorii ·{' '}
              {PODROZOWKA_CATALOG.reduce((a, b) => a + b.variantCount, 0)} wariantów kraj/język
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAF6EA] border border-[#E8E1D3] rounded-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#FFBF00] text-[#121926] font-semibold'
                    : 'text-[#414751] hover:text-[#121926]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {filteredCatalog.map((card) => (
            <div
              key={card.id}
              className="border border-[#E8E1D3] rounded-xl overflow-hidden bg-[#FAF6EA] flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-[#F1ECE1]">
                {!brokenImages[card.id] ? (
                  <Image
                    src={card.thumbUrl}
                    alt={card.sampleTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [card.id]: true }))
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-[#646A75]">
                    {card.sampleTitle}
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between bg-white">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#646A75]">
                    <span className="font-semibold text-[#5B2182]">{card.category}</span>
                    <span className="font-mono tabular-nums">{card.variantCount} krajów</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#121926] leading-snug">
                    {card.sampleTitle}
                  </h4>
                </div>
                <p className="text-[11px] text-[#414751] leading-relaxed pt-1">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editable Brand Context Document Sections */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            1. Autoportret, Oferta i Priorytety
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Elevator Pitch
            </label>
            <textarea
              rows={3}
              value={draft.elevatorPitch}
              onChange={(e) => handleFieldChange('elevatorPitch', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Oferta, format i logistyka
            </label>
            <textarea
              rows={6}
              value={draft.offerSummary}
              onChange={(e) => handleFieldChange('offerSummary', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Priorytety biznesowe (6–12 mies.)
            </label>
            <textarea
              rows={3}
              value={draft.businessPriorities}
              onChange={(e) => handleFieldChange('businessPriorities', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Analiza Churn i LTV (powroty i kolejne wyjazdy)
            </label>
            <textarea
              rows={5}
              value={draft.churnLtvModel ?? DEFAULT_BRAND_CONTEXT.churnLtvModel}
              onChange={(e) => handleFieldChange('churnLtvModel', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            2. Segmenty, Anty-persona, CEP & Status Danych
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Segmenty podróżników (testowane równorzędnie)
            </label>
            <textarea
              rows={4}
              value={draft.personasSummary}
              onChange={(e) => handleFieldChange('personasSummary', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Anty-persona (kogo świadomie NIE obsługujemy)
            </label>
            <textarea
              rows={2}
              value={draft.antiPersona}
              onChange={(e) => handleFieldChange('antiPersona', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Category Entry Points (czego szukają przed wyjazdem)
            </label>
            <textarea
              rows={4}
              value={draft.categoryEntryPoints}
              onChange={(e) => handleFieldChange('categoryEntryPoints', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Zasada prawdy i cytaty / luki w danych (Sekcja 2.2)
            </label>
            <textarea
              rows={3}
              value={draft.customerQuotesOrGaps}
              onChange={(e) => handleFieldChange('customerQuotesOrGaps', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Status wypełnienia: [FAKT] / [HIPOTEZA] / [BRAK DANYCH]
            </label>
            <textarea
              rows={4}
              value={draft.completionStatusNotes ?? ''}
              onChange={(e) => handleFieldChange('completionStatusNotes', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#121926]">
            3. Przewagi, Obietnice Zakazane i Alternatywy
          </h3>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Przewagi konkurencyjne
            </label>
            <textarea
              rows={5}
              value={draft.competitiveAdvantages}
              onChange={(e) => handleFieldChange('competitiveAdvantages', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Obietnice, których NIE składamy
            </label>
            <textarea
              rows={4}
              value={draft.promisesNeverMade}
              onChange={(e) => handleFieldChange('promisesNeverMade', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Alternatywy rynkowe (z czym konkurujemy w plecaku klienta)
            </label>
            <textarea
              rows={4}
              value={draft.competitorsAndAlternatives}
              onChange={(e) => handleFieldChange('competitorsAndAlternatives', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#121926]">
              4. Karta Głosu, Przykłady i Twarde Zakazy
            </h3>
            <a
              href={draft.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B2182] hover:text-[#3B0754]"
            >
              <span>podrozowka.pl</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Ogólny ton komunikacji
            </label>
            <textarea
              rows={2}
              value={draft.toneOfVoice}
              onChange={(e) => handleFieldChange('toneOfVoice', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-sm text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#121926] mb-1">
              Frazy charakterystyczne marki
            </label>
            <textarea
              rows={3}
              value={draft.characteristicPhrases}
              onChange={(e) => handleFieldChange('characteristicPhrases', e.target.value)}
              className="w-full rounded-xl border border-[#E8E1D3] bg-[#FAF6EA] px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#15803D] mb-1">
              Dobre przykłady (wzorce dla AI, po 1 w linii)
            </label>
            <textarea
              rows={3}
              value={(draft.goodExamples ?? []).join('\n')}
              onChange={(e) => handleArrayLinesChange('goodExamples', e.target.value)}
              className="w-full rounded-xl border border-[#BBF7D0] bg-[#F0FDF4]/60 px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#991B1B] mb-1">
              Złe przykłady (tego AI ma bezwzględnie unikać, po 1 w linii)
            </label>
            <textarea
              rows={3}
              value={(draft.badExamples ?? []).join('\n')}
              onChange={(e) => handleArrayLinesChange('badExamples', e.target.value)}
              className="w-full rounded-xl border border-[#FECACA] bg-[#FEF2F2]/60 px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>
          <div>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#991B1B] mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Czego NIGDY nie piszemy (twarde zakazy)</span>
            </label>
            <textarea
              rows={4}
              value={draft.hardBans}
              onChange={(e) => handleFieldChange('hardBans', e.target.value)}
              className="w-full rounded-xl border border-[#FECACA] bg-[#FEF2F2]/60 px-3 py-2 text-xs text-[#121926] focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
