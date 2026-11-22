'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  FileEdit,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_VALIDATION_GATES,
  formatMarketingPlanMarkdown,
  MarketingPlanState,
  MarketingPlanTask,
  ValidationGateId,
} from '@/data/marketing-plan';
import type { WorkspaceTabId } from '@/components/OverviewPanel';

interface MarketingPlanPanelProps {
  plan: MarketingPlanState;
  onUpdatePlan: (next: MarketingPlanState) => void;
  onResetPlan: () => void;
  onNavigate: (tab: WorkspaceTabId, agentId?: string) => void;
}

type StatusFilter = 'all' | 'todo' | 'done';

export default function MarketingPlanPanel({
  plan,
  onUpdatePlan,
  onResetPlan,
  onNavigate,
}: MarketingPlanPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskStageId, setNewTaskStageId] = useState(plan.stages[0]?.id ?? 'stage-0');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTools, setNewTaskTools] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const completedCount = useMemo(
    () => plan.tasks.filter((t) => t.completed).length,
    [plan.tasks]
  );
  const totalCount = plan.tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const answeredQuestionsCount = useMemo(
    () => plan.questions.filter((q) => q.answer.trim().length > 0).length,
    [plan.questions]
  );

  const validationGates = useMemo(
    () =>
      plan.validationGates && plan.validationGates.length > 0
        ? plan.validationGates
        : DEFAULT_VALIDATION_GATES,
    [plan.validationGates]
  );

  const passedGatesCount = useMemo(
    () => validationGates.filter((g) => g.status === 'zaliczona').length,
    [validationGates]
  );

  const nextPriorityStage = useMemo(() => {
    const pendingByStage = new Set(
      plan.tasks.filter((t) => !t.completed).map((t) => t.stageId)
    );
    const pendingStages = plan.stages.filter((s) => pendingByStage.has(s.id));
    if (pendingStages.length === 0) return null;
    return [...pendingStages].sort((a, b) => b.iceTotal - a.iceTotal)[0];
  }, [plan.stages, plan.tasks]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTasksByStage = useMemo(() => {
    const map = new Map<string, MarketingPlanTask[]>();
    for (const stage of plan.stages) {
      if (stageFilter !== 'all' && stage.id !== stageFilter) continue;
      const stageTasks = plan.tasks.filter((task) => {
        if (task.stageId !== stage.id) return false;
        if (statusFilter === 'todo' && task.completed) return false;
        if (statusFilter === 'done' && !task.completed) return false;
        if (normalizedQuery) {
          const hay = `${task.title} ${task.details} ${task.tools} ${task.note ?? ''}`.toLowerCase();
          if (!hay.includes(normalizedQuery)) return false;
        }
        return true;
      });
      if (stageTasks.length > 0 || (stageFilter === stage.id && !normalizedQuery)) {
        map.set(stage.id, stageTasks);
      }
    }
    return map;
  }, [plan.stages, plan.tasks, stageFilter, statusFilter, normalizedQuery]);

  const notifySaved = (label: string) => {
    setSaveNotice(label);
    window.setTimeout(() => {
      setSaveNotice((prev) => (prev === label ? null : prev));
    }, 2400);
  };

  const handleToggleTask = (taskId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextTasks = plan.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const nextDone = !t.completed;
      return {
        ...t,
        completed: nextDone,
        completedAt: nextDone ? today : undefined,
      };
    });
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      tasks: nextTasks,
    });
  };

  const handleUpdateNote = (taskId: string, note: string) => {
    const today = new Date().toISOString().slice(0, 10);
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, note } : t)),
    });
  };

  const handleDeleteCustomTask = (taskId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      tasks: plan.tasks.filter((t) => !(t.id === taskId && t.isCustom)),
    });
    notifySaved('Usunięto zadanie własne');
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    const today = new Date().toISOString().slice(0, 10);
    const customTask: MarketingPlanTask = {
      id: `custom-${Date.now()}`,
      stageId: newTaskStageId,
      title,
      details: newTaskDetails.trim() || 'Zadanie dopisane przez właściciela projektu.',
      tools: newTaskTools.trim() || 'Własne / Operacyjne',
      completed: false,
      isCustom: true,
    };
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      tasks: [...plan.tasks, customTask],
    });
    setNewTaskTitle('');
    setNewTaskTools('');
    setNewTaskDetails('');
    setShowAddForm(false);
    notifySaved('Dodano nowe zadanie do planu');
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    const today = new Date().toISOString().slice(0, 10);
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      questions: plan.questions.map((q) => (q.id === questionId ? { ...q, answer } : q)),
    });
  };

  const handleToggleGate = (gateId: ValidationGateId) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextGates = validationGates.map((g) => {
      if (g.id !== gateId) return g;
      const nextStatus = g.status === 'zaliczona' ? 'niezaliczona' : 'zaliczona';
      return {
        ...g,
        status: nextStatus as 'zaliczona' | 'niezaliczona',
        date: nextStatus === 'zaliczona' ? g.date || today : g.date,
      };
    });
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      validationGates: nextGates,
    });
    notifySaved('Zaktualizowano status bramki walidacji');
  };

  const handleGateFieldChange = (
    gateId: ValidationGateId,
    field: 'date' | 'note',
    value: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextGates = validationGates.map((g) =>
      g.id === gateId ? { ...g, [field]: value } : g
    );
    onUpdatePlan({
      ...plan,
      updatedAt: today,
      validationGates: nextGates,
    });
  };

  const handleExportMarkdown = () => {
    const md = formatMarketingPlanMarkdown(plan);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `podrozowka-plan-marketingowy-${plan.updatedAt}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySaved('Wyeksportowano plan (.md)');
  };

  const visibleStages = plan.stages.filter((s) => filteredTasksByStage.has(s.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <p className="text-xs font-semibold text-[#5B2182]">
              Plan Marketingowy 0 → 1 · podrozowka.pl · 100% Organic (90 dni)
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#121926]">
              Plan wdrożenia krok po kroku z listą odhaczeń
            </h1>
            <p className="text-sm text-[#414751] leading-relaxed">
              Wszystkie kroki, narzędzia oraz priorytety ICE dla nowego projektu na rynku. Każde
              odhaczenie, notatka i odpowiedź na pytania diagnostyczne zapisują się automatycznie.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj zadanie</span>
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#3B0754]" />
              <span>Eksportuj (.md)</span>
            </button>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#646A75] hover:text-[#121926] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetuj</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 border border-[#DC2626]/40 bg-[#FEF2F2] px-2.5 py-1 rounded-lg">
                <span className="text-xs font-medium text-[#DC2626]">Wyzerować?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetPlan();
                    setConfirmReset(false);
                    notifySaved('Przywrócono domyślny plan');
                  }}
                  className="px-2 py-1 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded transition-colors whitespace-nowrap shrink-0"
                >
                  Tak
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1 text-xs font-medium text-[#414751] hover:text-[#121926] whitespace-nowrap shrink-0"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Metrics + Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#F1ECE1]">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#646A75]">Postęp realizacji</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
              {completedCount} / {totalCount}{' '}
              <span className="text-sm font-medium text-[#646A75]">({completionPct}%)</span>
            </p>
            <div className="h-1.5 w-full bg-[#F1ECE1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16A34A] transition-all duration-200"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[#646A75]">Najwyższy priorytet ICE</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
              {nextPriorityStage ? `${nextPriorityStage.stepNumber} · ICE ${nextPriorityStage.iceTotal}` : 'Ukończono'}
            </p>
            <p className="text-xs text-[#414751] truncate">
              {nextPriorityStage ? nextPriorityStage.title : 'Wszystkie kroki odhaczone'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[#646A75]">Bramki walidacji (0 → 1)</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
              {passedGatesCount} / {validationGates.length}
            </p>
            <p className="text-xs text-[#414751]">
              {passedGatesCount === validationGates.length
                ? 'Wszystkie bramki potwierdzone'
                : 'Agenty oznaczają założenia jako HIPOTEZA'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[#646A75]">Status zapisu</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#121926]">
              {plan.updatedAt}
            </p>
            <p className="text-xs text-[#16A34A] font-medium">
              {saveNotice ?? 'Zapis automatyczny aktywny'}
            </p>
          </div>
        </div>
      </section>

      {/* 3 Validation Gates Section */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE1] pb-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#5B2182]">
              Kontrola faktów (Bramki Walidacji 0 → 1)
            </p>
            <h2 className="text-lg font-semibold text-[#121926]">
              3 bramki odblokowujące twierdzenia i dowody społeczne w systemie
            </h2>
            <p className="text-xs text-[#414751]">
              Dopóki bramka ma status „niezaliczona”, agenty AI rozpoczynają wyniki od „HIPOTEZA –
              czeka na walidację”, a Linter blokuje zmyślone recenzje i historie z drogi.
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs font-semibold text-[#5B2182] whitespace-nowrap shrink-0">
            Zaliczono: {passedGatesCount} / {validationGates.length}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {validationGates.map((gate) => {
            const passed = gate.status === 'zaliczona';
            return (
              <div
                key={gate.id}
                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                  passed
                    ? 'bg-[#F0FDF4]/60 border-[#BBF7D0]'
                    : 'bg-[#FAF6EA]/70 border-[#E8E1D3]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-mono font-semibold text-[#5B2182]">
                      {gate.stepsLabel}
                    </span>
                    <h3 className="text-sm font-semibold text-[#121926]">{gate.label}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleGate(gate.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      passed
                        ? 'bg-[#16A34A] border-[#16A34A] text-white'
                        : 'bg-white border-[#C8BFB0] text-[#121926] hover:border-[#3B0754]'
                    }`}
                  >
                    {passed ? 'Zaliczona' : 'Niezaliczona'}
                  </button>
                </div>

                <p className="text-xs text-[#414751] leading-relaxed">{gate.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-[#646A75] mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={gate.date ?? ''}
                      onChange={(e) => handleGateFieldChange(gate.id, 'date', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#646A75] mb-1">
                      Notatka / dowód
                    </label>
                    <input
                      type="text"
                      value={gate.note ?? ''}
                      onChange={(e) => handleGateFieldChange(gate.id, 'note', e.target.value)}
                      placeholder="np. ID zamówienia lub link..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8E1D3] rounded-lg text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:border-[#3B0754]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Inline Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustomTask}
          className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#121926]">
              Dodaj własne zadanie do planu
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-medium text-[#646A75] hover:text-[#121926]"
            >
              Zamknij
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#414751] mb-1">Etap planu</label>
              <select
                value={newTaskStageId}
                onChange={(e) => setNewTaskStageId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
              >
                {plan.stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stepNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#414751] mb-1">
                Nazwa zadania *
              </label>
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="np. Dodać opis ORLEN Paczka w koszyku"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#414751] mb-1">Narzędzie</label>
              <input
                type="text"
                value={newTaskTools}
                onChange={(e) => setNewTaskTools(e.target.value)}
                placeholder="np. Google Search Console / CMS"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#414751] mb-1">
              Szczegóły / kryterium ukończenia
            </label>
            <input
              type="text"
              value={newTaskDetails}
              onChange={(e) => setNewTaskDetails(e.target.value)}
              placeholder="Po czym poznamy, że zadanie jest zrobione?"
              className="w-full px-3 py-2 text-sm bg-white border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-[#414751] border border-[#E8E1D3] rounded-lg hover:bg-[#FAF6EA]"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FFBF00] hover:bg-[#F0B200] rounded-lg"
            >
              Zapisz zadanie
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Toolbar */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg">
            {(
              [
                { id: 'all', label: `Wszystkie (${totalCount})` },
                { id: 'todo', label: `Do zrobienia (${totalCount - completedCount})` },
                { id: 'done', label: `Zrobione (${completedCount})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  statusFilter === opt.id
                    ? 'bg-white text-[#121926] shadow-xs font-semibold'
                    : 'text-[#646A75] hover:text-[#121926]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filtruj według etapu"
            className="px-3 py-2 text-xs font-medium bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:border-[#3B0754]"
          >
            <option value="all">Wszystkie etapy (Krok 0–4)</option>
            {plan.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.stepNumber} · {s.timeframe}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#646A75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj zadania lub narzędzia..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:bg-white focus:border-[#3B0754]"
          />
        </div>
      </section>

      {/* Checklist by Stage */}
      {visibleStages.length === 0 ? (
        <section className="bg-white border border-[#E8E1D3] rounded-2xl p-10 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
          <h2 className="text-base font-semibold text-[#121926]">
            Brak zadań pasujących do wybranego filtra
          </h2>
          <p className="text-xs text-[#646A75]">
            Zmień filtr statusu albo wyczyść wyszukiwarkę, aby zobaczyć pełną listę kroków.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setStageFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#121926] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg"
          >
            Pokaż wszystkie zadania
          </button>
        </section>
      ) : (
        <div className="space-y-5">
          {visibleStages.map((stage) => {
            const stageTasks = filteredTasksByStage.get(stage.id) ?? [];
            const allStageTasks = plan.tasks.filter((t) => t.stageId === stage.id);
            const stageDone = allStageTasks.filter((t) => t.completed).length;

            return (
              <section
                key={stage.id}
                className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4"
              >
                {/* Stage Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 pb-4 border-b border-[#F1ECE1]">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                      <span className="font-semibold text-[#5B2182]">{stage.stepNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{stage.timeframe}</span>
                      <span aria-hidden="true">·</span>
                      <span>{stage.framework}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#121926] font-medium">
                        ICE {stage.iceTotal} (I:{stage.iceImpact} · C:{stage.iceConfidence} · E:
                        {stage.iceEase})
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-[#121926]">{stage.title}</h2>
                    <p className="text-xs text-[#414751] leading-relaxed">{stage.goal}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono tabular-nums font-semibold text-[#121926]">
                      {stageDone} / {allStageTasks.length} ukończono
                    </span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="divide-y divide-[#F1ECE1]">
                  {stageTasks.map((task) => {
                    const isNoteOpen = expandedNoteId === task.id;
                    return (
                      <div key={task.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2.5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={task.completed}
                              aria-label={`Oznacz zadanie: ${task.title}`}
                              onClick={() => handleToggleTask(task.id)}
                              className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B0754] ${
                                task.completed
                                  ? 'bg-[#16A34A] border-[#16A34A] text-white'
                                  : 'bg-white border-[#C8BFB0] hover:border-[#121926] text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#646A75]">
                                <span
                                  className={`font-semibold ${
                                    task.completed ? 'text-[#16A34A]' : 'text-[#D97706]'
                                  }`}
                                >
                                  {task.completed ? 'Zrobione' : 'Do zrobienia'}
                                </span>
                                {task.completed && task.completedAt && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-mono tabular-nums">
                                      {task.completedAt}
                                    </span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>Narzędzie: {task.tools}</span>
                                {task.isCustom && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Zadanie własne</span>
                                  </>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleTask(task.id)}
                                className={`text-left text-sm font-semibold transition-colors ${
                                  task.completed
                                    ? 'line-through text-[#646A75]'
                                    : 'text-[#121926] hover:text-[#3B0754]'
                                }`}
                              >
                                {task.title}
                              </button>

                              <p className="text-xs text-[#414751] leading-relaxed">
                                {task.details}
                              </p>

                              {task.note && !isNoteOpen && (
                                <p className="text-xs text-[#3B0754] bg-[#FAF6EA] px-2.5 py-1.5 rounded-lg inline-block">
                                  Notatka: {task.note}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.shortcut && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigate(task.shortcut!.tab, task.shortcut!.agentId)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#3B0754] bg-[#FAF6EA] hover:bg-[#FFF2CC] border border-[#E8E1D3] rounded-lg transition-colors whitespace-nowrap shrink-0"
                              >
                                <span>{task.shortcut.label}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedNoteId((prev) => (prev === task.id ? null : task.id))
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#414751] hover:text-[#121926] border border-[#E8E1D3] rounded-lg hover:bg-[#FAF6EA] transition-colors whitespace-nowrap shrink-0"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>{task.note ? 'Edytuj notatkę' : 'Notatka'}</span>
                            </button>
                            {task.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomTask(task.id)}
                                aria-label="Usuń zadanie własne"
                                className="p-1.5 text-[#646A75] hover:text-[#DC2626] rounded-lg hover:bg-[#FEF2F2] transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isNoteOpen && (
                          <div className="pl-9 space-y-2">
                            <textarea
                              rows={2}
                              value={task.note ?? ''}
                              onChange={(e) => handleUpdateNote(task.id, e.target.value)}
                              placeholder="Wpisz link do dokumentu, wnioski z testu lub datę wdrożenia..."
                              className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg text-[#121926] focus:outline-none focus:bg-white focus:border-[#3B0754]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* KPI Table */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#121926]">
            Metryki sukcesu (KPI) na pierwsze 90 dni
          </h2>
          <p className="text-xs text-[#646A75]">
            Mierzymy twarde przejścia do /sklep, zdarzenia koszyka i realne skany QR, bez pustych
            zasięgów.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E1D3] text-[#646A75]">
                <th className="py-2.5 pr-4 font-semibold">Etap / Okno</th>
                <th className="py-2.5 px-4 font-semibold">Kluczowa metryka</th>
                <th className="py-2.5 px-4 font-semibold">Kryterium weryfikacji</th>
                <th className="py-2.5 pl-4 font-semibold">Narzędzie pomiaru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1ECE1]">
              {plan.kpis.map((row) => (
                <tr key={row.phase} className="hover:bg-[#FAF6EA]/60">
                  <td className="py-3 pr-4 font-semibold text-[#121926] whitespace-nowrap font-mono tabular-nums">
                    {row.phase}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#121926]">{row.metric}</td>
                  <td className="py-3 px-4 text-[#414751] leading-relaxed">
                    {row.targetDefinition}
                  </td>
                  <td className="py-3 pl-4 text-[#5B2182] font-medium whitespace-nowrap">
                    {row.tool}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 Diagnostic Questions Before Module 3 */}
      <section className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1ECE1] pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#121926]">
              5 pytań diagnostycznych przed wdrożeniem SEO i Social
            </h2>
            <p className="text-xs text-[#646A75]">
              Wpisz odpowiedzi poniżej. Pozwolą dopasować audytor GEO, harmonogram Social i bramkę
              prawną w kolejnym etapie.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums font-semibold text-[#5B2182] whitespace-nowrap">
            {answeredQuestionsCount} / {plan.questions.length} uzupełnionych
          </span>
        </div>

        <div className="divide-y divide-[#F1ECE1]">
          {plan.questions.map((q) => (
            <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#121926]">
                  {q.number}. {q.title}
                </h3>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    q.answer.trim() ? 'text-[#16A34A]' : 'text-[#646A75]'
                  }`}
                >
                  {q.answer.trim() ? 'Odpowiedź zapisana' : 'Oczekuje na odpowiedź'}
                </span>
              </div>
              <p className="text-xs text-[#414751] leading-relaxed">{q.question}</p>
              <textarea
                rows={2}
                value={q.answer}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Wpisz swoją odpowiedź roboczą..."
                className="w-full px-3 py-2 text-xs bg-[#FAF6EA] border border-[#E8E1D3] rounded-lg text-[#121926] placeholder:text-[#646A75] focus:outline-none focus:bg-white focus:border-[#3B0754]"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
