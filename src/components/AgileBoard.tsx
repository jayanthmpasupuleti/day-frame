import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  GripVertical,
  Timer,
  AlertTriangle,
  Coffee,
  Trash2,
  Undo2,
  FileText,
  Flame,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import { ConfettiCanvas, ConfettiRef } from './ConfettiCanvas';
import { CompletionCelebration } from './CompletionCelebration';
import type { Offset } from '@cruxgarden/plasma-ui';
import {
  PlasmaCard,
  PlasmaBadge,
  PlasmaButton,
  PlasmaInput,
  PlasmaProgress,
} from './plasma';

const KonohaLeafWatermark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 200 200"
    className={`pointer-events-none select-none ${className}`}
    fill="currentColor"
  >
    <path
      d="M100,20 C125,20 155,35 170,60 C185,85 185,120 170,145 C155,170 125,185 95,185 C65,185 35,170 20,145 C5,120 5,85 20,60 C26,50 35,42 45,36 C42,46 42,57 45,67 C35,85 35,110 46,128 C57,146 78,157 100,157 C122,157 143,146 154,128 C165,110 165,85 154,67 C143,49 122,38 100,38 C88,38 77,42 68,49 C64,43 58,38 52,34 C66,25 83,20 100,20 Z"
      fillRule="evenodd"
    />
    <path
      d="M100,60 C115,60 130,70 138,85 C146,100 146,118 138,133 C130,148 115,158 98,158 C81,158 66,148 58,133 C53,123 53,111 58,101 C61,106 66,110 72,113 C70,118 70,123 73,128 C78,136 88,141 98,141 C108,141 118,136 123,128 C128,120 128,108 123,100 C118,92 108,87 98,87 C91,87 85,90 80,95 C77,90 73,86 68,82 C76,68 87,60 100,60 Z"
    />
    <path
      d="M100,85 C108,85 116,91 120,99 C124,107 124,116 120,124 C116,132 108,138 99,138 C90,138 82,132 78,124 C75,119 75,113 78,108 C81,111 85,113 90,115 C89,118 90,120 92,122 C94,124 97,125 100,125 C103,125 106,124 108,122 C110,120 111,117 111,114 C111,111 110,108 108,106 C106,104 103,103 100,103 C96,103 93,105 91,108 C88,105 85,102 82,99 C87,90 93,85 100,85 Z"
    />
  </svg>
);

const DURATION_OPTIONS = [0, 15, 25, 30, 45, 60, 90];

// Category tag styling in Amber (#F59E0B), Violet (#A78BFA), or Cyan (#38BDF8)
const getTagBadgeStyle = (tag: string) => {
  const clean = tag.toLowerCase();
  if (clean.includes('dev') || clean.includes('code') || clean.includes('build')) {
    return 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20';
  }
  if (clean.includes('writing') || clean.includes('design') || clean.includes('doc')) {
    return 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/20';
  }
  if (clean.includes('personal') || clean.includes('routine') || clean.includes('errand')) {
    return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
  }
  return 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/20';
};

export const AgileBoard: React.FC = () => {
  const {
    tasks,
    addTask,
    deleteTask,
    setTaskStatus,
    updateTaskDuration,
    pomodoro,
    toggleTimer,
    resetTimer,
    activeTheme,
    previewThemeId,
  } = useDayframeStore();

  const isSageTheme = (previewThemeId || activeTheme) === 'sage-chakra';

  // Inline Add Task state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTag, setTaskTag] = useState('#dev');
  const [taskPomos, setTaskPomos] = useState(2);
  const [taskDuration, setTaskDuration] = useState(25);

  // Plasma Liquid Drag and Drop States & Refs
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [cardOffsets, setCardOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [focusCardOffset, setFocusCardOffset] = useState<{ x: number; y: number } | undefined>(undefined);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);

  const backlogColRef = useRef<HTMLElement | null>(null);
  const focusColRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const focusCardRef = useRef<HTMLDivElement | null>(null);

  // Duration editor popover state for backlog cards
  const [editingDurationTaskId, setEditingDurationTaskId] = useState<string | null>(null);

  const backlogTasks = tasks.filter((t) => t.status === 'backlog');
  const focusTask = tasks.find((t) => t.status === 'in_focus') || null;
  const doneTasks = tasks.filter((t) => t.status === 'done');

  // Track whether active sprint tasks have existed in this session
  const [hasHadActiveTasks, setHasHadActiveTasks] = useState(
    () => tasks.some((t) => t.status === 'backlog' || t.status === 'in_focus')
  );
  // Track whether any task was completed during this active session
  const [hasCompletedInSession, setHasCompletedInSession] = useState(false);
  const prevDoneCountRef = useRef(doneTasks.length);

  // When tasks are added or present in backlog / focus, record that the user has an active sprint
  useEffect(() => {
    if (backlogTasks.length > 0 || focusTask !== null) {
      setHasHadActiveTasks(true);
    }
  }, [backlogTasks.length, focusTask]);

  // Record whenever a task transitions into 'done' during this session
  useEffect(() => {
    if (doneTasks.length > prevDoneCountRef.current) {
      setHasCompletedInSession(true);
    }
    prevDoneCountRef.current = doneTasks.length;
  }, [doneTasks.length]);

  // Condition: Only celebrate if the user actually had active tasks, completed task(s) during this session,
  // and now both backlog and in-focus are completely cleared!
  const isAllDone =
    hasHadActiveTasks &&
    hasCompletedInSession &&
    backlogTasks.length === 0 &&
    focusTask === null &&
    doneTasks.length > 0;
  const totalPomosDone = doneTasks.reduce((sum, t) => sum + (t.pomosDone || 1), 0);

  const confettiRef = useRef<ConfettiRef | null>(null);
  const wasAllDoneRef = useRef(false);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // Automatically trigger confetti when transitioning into all-done state
  useEffect(() => {
    if (isAllDone && !wasAllDoneRef.current) {
      confettiRef.current?.fire();
      setShowCelebrationBanner(true);
    }
    wasAllDoneRef.current = isAllDone;
  }, [isAllDone]);

  // Format pomodoro time
  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const isUntimed = focusTask?.durationMinutes === 0;
  const formattedTime = isUntimed
    ? 'Untimed'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress Calculations for Hero In-Focus Card
  const estimatedPomos = focusTask?.pomosEst || 4;
  const completedPomos = focusTask?.pomosDone || 0;
  const totalSec = focusTask?.durationMinutes !== undefined
    ? focusTask.durationMinutes * 60
    : pomodoro.settings.focusDuration;
  const elapsedSec = totalSec > 0 ? Math.max(0, totalSec - pomodoro.timeLeft) : 0;
  const currentCycleProgress = totalSec > 0 ? elapsedSec / totalSec : 0;

  // Completion ratio for the 6px track
  const completionRatio = isUntimed
    ? 1
    : estimatedPomos > 0
    ? Math.min(1, (completedPomos + (pomodoro.isRunning ? currentCycleProgress : 0)) / estimatedPomos)
    : 0;

  const triggerBlockedAlert = (msg: string) => {
    setBlockedAlert(msg);
    setTimeout(() => setBlockedAlert(null), 3500);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle.trim(), taskTag, taskDuration === 0 ? 0 : taskPomos, taskDuration);
    setTaskTitle('');
    setTaskDuration(25);
    setIsAddingTask(false);
  };

  // --- Plasma Drag Handlers for Backlog Cards ---
  const handleBacklogCardDragStart = (taskId: string) => {
    setActiveDraggingId(taskId);
  };

  const handleBacklogCardDragEnd = (taskId: string, target: Offset) => {
    setActiveDraggingId(null);
    const cardEl = cardRefs.current.get(taskId);
    const focusColEl = focusColRef.current;

    let isDroppedInFocus = false;

    if (cardEl && focusColEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const focusRect = focusColEl.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      isDroppedInFocus =
        cardCenterX >= focusRect.left &&
        cardCenterX <= focusRect.right &&
        cardCenterY >= focusRect.top &&
        cardCenterY <= focusRect.bottom;
    } else if (target.x > 140) {
      isDroppedInFocus = true;
    }

    if (isDroppedInFocus) {
      if (focusTask !== null) {
        triggerBlockedAlert(
          pomodoro.isRunning
            ? 'Active Session in Progress: Complete or return the active task to Backlog before starting a new one!'
            : 'Slot Occupied: Complete or return the active task to Backlog before starting a new one!'
        );
        // Spring smoothly back to origin in Backlog
        setCardOffsets((prev) => ({ ...prev, [taskId]: { x: target.x, y: target.y } }));
        requestAnimationFrame(() => {
          setCardOffsets((prev) => ({ ...prev, [taskId]: { x: 0, y: 0 } }));
        });
      } else {
        // Promote to In Focus!
        setTaskStatus(taskId, 'in_focus');
        setJustDroppedId(taskId);
        setTimeout(() => setJustDroppedId(null), 700);
        setCardOffsets((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }
    } else {
      // Released outside focus: liquid spring back to its backlog slot
      setCardOffsets((prev) => ({ ...prev, [taskId]: { x: target.x, y: target.y } }));
      requestAnimationFrame(() => {
        setCardOffsets((prev) => ({ ...prev, [taskId]: { x: 0, y: 0 } }));
      });
    }
  };

  // --- Plasma Drag Handlers for Hero In-Focus Card ---
  const handleFocusCardDragStart = () => {
    if (focusTask) setActiveDraggingId(focusTask.id);
  };

  const handleFocusCardDragEnd = (target: Offset) => {
    setActiveDraggingId(null);
    if (!focusTask) return;

    const cardEl = focusCardRef.current;
    const backlogColEl = backlogColRef.current;

    let isDroppedInBacklog = false;

    if (cardEl && backlogColEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const backlogRect = backlogColEl.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      isDroppedInBacklog =
        cardCenterX >= backlogRect.left &&
        cardCenterX <= backlogRect.right &&
        cardCenterY >= backlogRect.top &&
        cardCenterY <= backlogRect.bottom;
    } else if (target.x < -140) {
      isDroppedInBacklog = true;
    }

    if (isDroppedInBacklog) {
      setTaskStatus(focusTask.id, 'backlog');
      setFocusCardOffset(undefined);
    } else {
      // Liquid spring back to center in In Focus
      setFocusCardOffset({ x: target.x, y: target.y });
      requestAnimationFrame(() => {
        setFocusCardOffset({ x: 0, y: 0 });
      });
    }
  };

  const handlePromoteClick = (taskId: string) => {
    if (focusTask !== null) {
      triggerBlockedAlert(
        pomodoro.isRunning
          ? 'Active Session in Progress: Complete or return the active task to Backlog before starting a new one!'
          : 'Slot Occupied: Complete or return the active task to Backlog before starting a new one!'
      );
      return;
    }
    setTaskStatus(taskId, 'in_focus');
    setJustDroppedId(taskId);
    setTimeout(() => setJustDroppedId(null), 700);
  };

  return (
    <>
      <ConfettiCanvas ref={confettiRef} />
      <main className="flex-1 p-3.5 sm:p-5 flex flex-col gap-3 min-h-0 overflow-hidden select-none bg-transparent relative transition-colors duration-300">
        {/* Top Celebration Banner on Screen */}
        {isAllDone && showCelebrationBanner && (
          <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary/15 via-[var(--bg-inset)] to-[var(--accent-audio)]/15 border border-primary/30 shadow-mint-glow flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 animate-banner-slide-down shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-sm shadow-sm shrink-0">
                🎉
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white tracking-wide">
                  Yayy!! You are done with your tasks. Let's go!!
                </span>
                <span className="text-[11px] text-slate-400 ml-2 hidden md:inline">
                  Backlog and in-focus are completely cleared today.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
              <button
                type="button"
                onClick={() => confettiRef.current?.fire()}
                className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/35 text-primary text-[10.5px] font-mono font-bold border border-primary/40 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Blast confetti again!"
              >
                <span>🎊 Confetti</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCelebrationBanner(false)}
                className="text-slate-400 hover:text-white p-1 text-[11px] cursor-pointer rounded-md hover:bg-white/10 transition-colors"
                title="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 3 Columns Grid */}
        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-4 md:gap-5 min-h-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* COLUMN 1: TODAY'S BACKLOG (Col span 4)                                   */}
          {/* ========================================================================= */}
          <section
            ref={backlogColRef}
            className="col-span-4 flex flex-col bg-[var(--bg-card)]/35 backdrop-blur-sm rounded-xl border border-[var(--border-card)]/60 p-3 sm:p-4 shadow-card min-h-0 transition-all duration-200 relative overflow-hidden"
          >
            {isSageTheme && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] overflow-hidden">
                <KonohaLeafWatermark className="w-72 h-72 text-amber-300" />
              </div>
            )}
            {/* Header: Column title and active count badge */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
                  Today's Backlog
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <PlasmaBadge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px]">
                  Drag to Focus
                </PlasmaBadge>
                <PlasmaBadge variant="muted" size="sm" mono>
                  {backlogTasks.length}
                </PlasmaBadge>
              </div>
            </div>

            {/* Task Cards List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {isAllDone && (
                <div className="py-7 px-4 rounded-xl bg-[var(--bg-inset)]/40 border border-dashed border-primary/25 flex flex-col items-center justify-center text-center animate-card-enter my-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2 shadow-mint-glow">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">Backlog 100% Cleared!</div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-[190px] leading-relaxed">
                    Zero pending tasks remaining. Everything scheduled for today is done!
                  </div>
                </div>
              )}

              {backlogTasks.length === 0 && !isAllDone && !isAddingTask && (
                <div className="py-8 px-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center my-4 bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 mb-2">
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Backlog is empty</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Add your tasks for today's sprint below
                  </p>
                </div>
              )}

              {backlogTasks.map((task) => {
                const isBeingDragged = activeDraggingId === task.id;
                const taskDurationMin = task.durationMinutes ?? 25;
                const isTaskUntimed = taskDurationMin === 0;
                const isEditingDuration = editingDurationTaskId === task.id;

                return (
                  <PlasmaCard
                    key={task.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(task.id, el);
                      else cardRefs.current.delete(task.id);
                    }}
                    elevation={isBeingDragged ? 0.7 : 0.25}
                    radius={14}
                    draggable={true}
                    snap={false}
                    lean={14}
                    fuse={true}
                    offset={cardOffsets[task.id]}
                    onDragStart={() => handleBacklogCardDragStart(task.id)}
                    onDragEnd={(target) => handleBacklogCardDragEnd(task.id, target)}
                    className={`group relative p-3 transition-colors duration-150 ${
                      isBeingDragged
                        ? 'z-30 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/50 shadow-2xl'
                        : 'hover:border-white/25 hover:shadow-card'
                    }`}
                    title={
                      focusTask
                        ? pomodoro.isRunning
                          ? 'Slot locked: Active timer running in In Focus'
                          : 'Slot occupied: Complete or return active task to Backlog first'
                        : 'Drag into In Focus to start work'
                    }
                  >
                  {/* Title & Grip / Hover Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-1.5 flex-1 min-w-0">
                      <div className="text-slate-500 group-hover:text-[var(--accent-primary)] transition-colors mt-0.5 shrink-0">
                        <GripVertical className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                      <span className="text-[13px] font-medium text-slate-200 leading-snug group-hover:text-white flex-1 break-words min-w-0">
                        {task.title}
                      </span>
                    </div>

                    {/* Actions: Compact "Focus" Pill Button & Delete Trash Icon on Hover */}
                    <div className="flex items-center gap-1 shrink-0">
                      <PlasmaButton
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </PlasmaButton>

                      <PlasmaButton
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePromoteClick(task.id);
                        }}
                        disabled={focusTask !== null}
                        title={
                          focusTask !== null
                            ? pomodoro.isRunning
                              ? 'Focus timer running — complete current task first'
                              : 'Focus slot occupied — complete current task first'
                            : 'Focus this task'
                        }
                      >
                        <span>Focus</span>
                        <ArrowRight className="w-2.5 h-2.5 ml-0.5" />
                      </PlasmaButton>
                    </div>
                  </div>

                  {/* Meta Row: Tag Capsule, Duration Pill, Pomos Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pl-5">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      {/* Category Tag Capsule */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${getTagBadgeStyle(
                          task.tag
                        )}`}
                      >
                        {task.tag || '#dev'}
                      </span>

                      {/* Duration / Untimed Pill */}
                      <div className="relative">
                        <PlasmaBadge
                          variant={isTaskUntimed ? 'accent' : 'muted'}
                          size="sm"
                          mono
                          interactive
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDurationTaskId(isEditingDuration ? null : task.id);
                          }}
                          title="Click to adjust duration or make untimed"
                        >
                          {isTaskUntimed ? (
                            <>
                              <Coffee className="w-2.5 h-2.5" />
                              <span>Untimed</span>
                            </>
                          ) : (
                            <>
                              <Timer className="w-2.5 h-2.5 text-[var(--accent-primary)]" />
                              <span>{taskDurationMin}m</span>
                            </>
                          )}
                        </PlasmaBadge>

                        {/* Duration Quick Selector Popover */}
                        {isEditingDuration && (
                          <div
                            className="absolute left-0 bottom-6 z-40 p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {DURATION_OPTIONS.map((d) => (
                              <PlasmaButton
                                key={d}
                                size="sm"
                                variant={taskDurationMin === d ? 'primary' : 'ghost'}
                                onClick={() => {
                                  updateTaskDuration(task.id, d);
                                  setEditingDurationTaskId(null);
                                }}
                              >
                                {d === 0 ? 'Untimed (0m)' : `${d}m`}
                              </PlasmaButton>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estimated Pomodoro Badge */}
                    <PlasmaBadge variant="muted" size="sm" mono>
                      {isTaskUntimed ? (
                        <span className="text-slate-500 text-[10px]">No Timer</span>
                      ) : (
                        <>
                          <span>🍅</span>
                          <span className="tabular-nums font-semibold text-slate-300">
                            {task.pomosEst}
                          </span>
                        </>
                      )}
                    </PlasmaBadge>
                  </div>
                </PlasmaCard>
              );
            })}

          {/* Inline Add Task Form (when open) */}
          {isAddingTask && (
            <form
              onSubmit={handleCreateTask}
              className="p-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--accent-primary)]/40 space-y-2.5 text-xs shadow-mint-glow animate-in fade-in"
            >
              <PlasmaInput
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onEnter={handleCreateTask as any}
                placeholder="Add task to backlog (press Enter)..."
                autoFocus
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Options Group: Tag, Duration Pill, Pomos Counter */}
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <select
                    value={taskTag}
                    onChange={(e) => setTaskTag(e.target.value)}
                    className="bg-[var(--bg-card)] text-slate-300 px-2 py-1 rounded-full border border-white/10 text-[10.5px] font-mono cursor-pointer shrink-0"
                  >
                    <option value="#dev">#dev</option>
                    <option value="#writing">#writing</option>
                    <option value="#design">#design</option>
                    <option value="#personal">#personal</option>
                    <option value="#routine">#routine</option>
                  </select>

                  <div className="flex items-center gap-1 bg-[var(--bg-card)] px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                    {taskDuration === 0 ? (
                      <Coffee className="w-3 h-3 text-[var(--accent-audio)] shrink-0" />
                    ) : (
                      <Timer className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
                    )}
                    <select
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white font-mono text-[10.5px] focus:outline-none cursor-pointer"
                    >
                      <option value={0} className="bg-[var(--bg-card)]">
                        0m (Untimed)
                      </option>
                      {DURATION_OPTIONS.filter((d) => d > 0).map((d) => (
                        <option key={d} value={d} className="bg-[var(--bg-card)]">
                          {d}m
                        </option>
                      ))}
                    </select>
                  </div>

                  {taskDuration > 0 && (
                    <div className="flex items-center gap-1 bg-[var(--bg-card)] px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                      <span className="text-[10px]">🍅</span>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={taskPomos}
                        onChange={(e) => setTaskPomos(parseInt(e.target.value) || 1)}
                        className="w-5 text-center bg-transparent text-white font-mono text-[11px] focus:outline-none"
                        title="Estimated Pomodoro Cycles"
                      />
                    </div>
                  )}
                </div>

                {/* Actions Group: Add & Cancel */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  <PlasmaButton type="submit" variant="primary" size="sm">
                    Add
                  </PlasmaButton>
                  <PlasmaButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAddingTask(false)}
                    title="Cancel"
                  >
                    ✕
                  </PlasmaButton>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Inline Add Task Bar */}
        {!isAddingTask && (
          <div className="mt-3 pt-2">
            <PlasmaButton
              variant="secondary"
              size="md"
              onClick={() => setIsAddingTask(true)}
              className="w-full justify-center text-[11.5px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Task</span>
            </PlasmaButton>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 2: IN FOCUS (HERO ACTIVE CARD) (Col span 5)                       */}
      {/* ========================================================================= */}
      <section
        ref={focusColRef}
        className={`col-span-5 flex flex-col bg-[var(--bg-card)]/35 backdrop-blur-sm rounded-xl border p-3 sm:p-4 relative overflow-hidden min-h-0 transition-all duration-200 ${
          isSageTheme && focusTask !== null
            ? 'chakra-flame-aura border-[#FF6B00]'
            : focusTask !== null
            ? 'border-primary/40 shadow-[0_0_24px_var(--glow-primary-subtle)]'
            : 'border-[var(--border-card)]/60'
        }`}
      >
        {isSageTheme && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
            <KonohaLeafWatermark className="w-80 h-80 text-amber-400" />
          </div>
        )}
        {/* Ambient subtle dynamic halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--glow-primary)]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Column Header: Title with dynamic pulse dot */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-primary/20 relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_8px_var(--glow-primary)]" />
            </span>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono flex items-center gap-1.5">
              <span>IN FOCUS</span>
              <Sparkles className="w-3 h-3 text-primary" />
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#94A3B8]">
              {focusTask ? (pomodoro.isRunning ? 'Timer Active' : 'Slot Occupied') : 'Drag Target'}
            </span>
            <PlasmaBadge
              variant={focusTask ? 'primary' : 'muted'}
              size="sm"
              mono
            >
              {focusTask ? '1 ACTIVE' : '0 ACTIVE'}
            </PlasmaBadge>
          </div>
        </div>

        {/* Blocked Alert Banner */}
        {blockedAlert && (
          <div className="mb-3 py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-[11.5px] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 relative z-20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{blockedAlert}</span>
          </div>
        )}

        {/* Active Hero Card vs Empty State */}
        {focusTask ? (
          <PlasmaCard
            ref={focusCardRef}
            elevation={activeDraggingId === focusTask.id ? 0.75 : 0.45}
            radius={18}
            active={true}
            draggable={true}
            snap={false}
            lean={12}
            fuse={true}
            offset={focusCardOffset}
            onDragStart={handleFocusCardDragStart}
            onDragEnd={handleFocusCardDragEnd}
            className={`flex-1 flex flex-col justify-between p-4 relative z-10 transition-colors duration-200 ${
              justDroppedId === focusTask.id ? 'animate-drop-glow animate-card-enter' : ''
            } ${
              activeDraggingId === focusTask.id
                ? 'z-30 border-dashed border-[var(--accent-secondary)] ring-2 ring-[var(--accent-secondary)]/40 shadow-2xl'
                : ''
            }`}
            title="Drag left toward Backlog to return task"
          >
              <div>
                {/* Category badge pill alongside completed/estimated Pomodoros */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="text-slate-500 hover:text-[var(--accent-primary)] transition-colors cursor-grab active:cursor-grabbing"
                      title="Drag back to Backlog"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <PlasmaBadge
                      variant="primary"
                      size="md"
                      mono
                      className={getTagBadgeStyle(focusTask.tag)}
                    >
                      {focusTask.tag || '#dev'}
                    </PlasmaBadge>
                  </div>

                  <div className="flex items-center gap-2">
                    {focusTask.durationMinutes === 0 ? (
                      <PlasmaBadge variant="accent" size="md" mono>
                        <Coffee className="w-3 h-3 text-[var(--accent-secondary)]" />
                        <span>Untimed</span>
                      </PlasmaBadge>
                    ) : (
                      <PlasmaBadge variant="primary" size="md" mono>
                        <span>🍅</span>
                        <span className="font-bold">
                          {focusTask.pomosDone} / {focusTask.pomosEst}
                        </span>
                      </PlasmaBadge>
                    )}
                  </div>
                </div>

                {/* Large semibold title (headline-md) */}
                <h3 className="text-[18px] md:text-[20px] font-semibold text-white tracking-tight leading-snug mb-3 break-words">
                  {focusTask.title}
                </h3>

                {/* Liquid Progress Track */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Sprint Progress</span>
                    <span className="text-primary font-bold tabular-nums">
                      {isUntimed ? 'Untimed (Self-Paced)' : `${Math.round(completionRatio * 100)}%`}
                    </span>
                  </div>
                  <PlasmaProgress
                    value={isUntimed ? 100 : Math.round(completionRatio * 100)}
                    size="sm"
                  />
                </div>

                {/* Focus Session Timer Controls Container */}
                {focusTask.durationMinutes === 0 ? (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-secondary)]/20 flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)]/15 border border-[var(--accent-secondary)]/30 flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5 text-[var(--accent-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-white">
                        Freeform / Personal Task
                      </div>
                      <div className="text-[10.5px] text-[#94A3B8] mt-0.5 leading-relaxed">
                        No Pomodoro timer required. Focus at your pace, then click Complete when done!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2 mb-3 relative overflow-hidden">
                    {isSageTheme && (
                      <div className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none opacity-15 flex items-center justify-end pr-2 overflow-hidden">
                        <Flame className="w-20 h-20 text-[#FF6B00] -rotate-12 translate-x-2" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="relative flex items-center justify-center">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            pomodoro.isRunning
                              ? 'bg-primary animate-pulse shadow-[0_0_8px_var(--glow-primary)]'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-mono text-white tabular-nums tracking-tight">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          {pomodoro.mode === 'focus' ? 'Focus Session' : 'Break'} • Cycle {completedPomos + 1} of {estimatedPomos}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                      <PlasmaButton
                        variant={pomodoro.isRunning ? 'warning' : 'primary'}
                        size="sm"
                        onClick={toggleTimer}
                        title={pomodoro.isRunning ? 'Pause Timer' : 'Start Timer'}
                      >
                        {pomodoro.isRunning ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                            <span>Start</span>
                          </>
                        )}
                      </PlasmaButton>

                      <PlasmaButton
                        variant="ghost"
                        size="icon"
                        onClick={resetTimer}
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </PlasmaButton>
                    </div>
                  </div>
                )}

                {/* Deliverables / Focus Notes Context */}
                <div className="text-[11px] text-slate-400 bg-[var(--bg-card)]/80 p-3 rounded-xl border border-[var(--border-card)] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Deliverables &amp; Focus Context:</span>
                  </div>
                  {(focusTask.notes || [
                    'Glassmorphic dock pill bar with YouTube focus stream',
                    'Single-window 3-column personal Agile board',
                    'Local-First IndexedDB offline data privacy',
                  ]).map((note, idx) => (
                    <p key={idx} className="text-[#94A3B8] pl-5 text-[10.5px]">
                      • {note}
                    </p>
                  ))}
                </div>
              </div>

              {/* Bottom Actions: Theme Accent "Complete Task" & Ghost "Return to Backlog" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[var(--border-card)]">
                <PlasmaButton
                  variant="primary"
                  size="lg"
                  onClick={() => setTaskStatus(focusTask.id, 'done')}
                  className="w-full justify-center text-[11.5px] sm:text-[12px]"
                  title="Complete task and reset timer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Complete Task</span>
                </PlasmaButton>

                <PlasmaButton
                  variant="secondary"
                  size="lg"
                  onClick={() => setTaskStatus(focusTask.id, 'backlog')}
                  className="w-full justify-center text-[11.5px] sm:text-[12px]"
                  title="Return task to Backlog"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Return to Backlog</span>
                </PlasmaButton>
              </div>
            </PlasmaCard>
        ) : isAllDone ? (
          <CompletionCelebration
            doneCount={doneTasks.length}
            totalPomos={totalPomosDone}
            onCelebrateAgain={() => confettiRef.current?.fire()}
            onAddNewTask={() => setIsAddingTask(true)}
          />
        ) : (
          /* Empty State: Dashed Inset Container */
          <div className="flex-1 flex flex-col items-center justify-center border-dashed border-white/10 rounded-xl p-6 sm:p-8 text-center text-slate-400 text-sm bg-[var(--bg-inset)]/30">
            <Clock className="w-8 h-8 text-slate-500 mb-3 stroke-[1.5]" />
            <p className="text-slate-300 font-medium text-sm">No active task in sprint.</p>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs">
              {backlogTasks.length > 0
                ? 'Select or drag a task from your backlog to start focusing.'
                : 'Add tasks to your backlog to start your day sprint.'}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 3: DONE TODAY (Col span 3)                                         */}
      {/* ========================================================================= */}
      <section className="col-span-3 flex flex-col bg-[var(--bg-card)]/35 backdrop-blur-sm rounded-xl border border-[var(--border-card)]/60 p-3 sm:p-4 shadow-card min-h-0">
        {/* Header: Title and count badge */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
              Done Today
            </h2>
          </div>
          <PlasmaBadge variant="accent" size="sm" mono>
            {doneTasks.length}
          </PlasmaBadge>
        </div>

        {/* Completed Cards List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {doneTasks.map((task) => {
            const isTaskUntimed = task.durationMinutes === 0;
            return (
              <PlasmaCard
                key={task.id}
                elevation={0.15}
                radius={12}
                className="group p-2.5 hover:border-white/15 hover:-translate-y-[0.5px] transition-all duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[#94A3B8] line-through leading-snug font-medium break-words">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-1 mt-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="tabular-nums">{task.completedAt || 'Today'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--accent-secondary)] font-medium">
                          {isTaskUntimed
                            ? '✓ Untimed'
                            : `✓ ${task.pomosDone || 1} Pomos`}
                        </span>
                        {/* Compact "Undo" button calling setTaskStatus(task.id, 'backlog') */}
                        <PlasmaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskStatus(task.id, 'backlog')}
                          className="opacity-0 group-hover:opacity-100 py-0.5 px-1.5 text-[10px]"
                          title="Return to backlog"
                        >
                          <Undo2 className="w-2.5 h-2.5 mr-1" />
                          <span>Undo</span>
                        </PlasmaButton>
                      </div>
                    </div>
                  </div>
                </div>
              </PlasmaCard>
            );
          })}
        </div>
      </section>
    </div>
  </main>
</>
  );
};

export default AgileBoard;
