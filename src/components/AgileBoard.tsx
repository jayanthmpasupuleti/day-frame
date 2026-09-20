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
  Lock,
  Timer,
  AlertTriangle,
  Coffee,
  Trash2,
  Undo2,
  FileText,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import { ConfettiCanvas, ConfettiRef } from './ConfettiCanvas';
import { CompletionCelebration } from './CompletionCelebration';

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
  return 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/20';
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
  } = useDayframeStore();

  // Inline Add Task state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTag, setTaskTag] = useState('#dev');
  const [taskPomos, setTaskPomos] = useState(2);
  const [taskDuration, setTaskDuration] = useState(25);

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<'backlog' | 'in_focus' | null>(null);
  const [isDragOverFocus, setIsDragOverFocus] = useState(false);
  const [isDragOverBacklog, setIsDragOverBacklog] = useState(false);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
  const [blockedAlert, setBlockedAlert] = useState<string | null>(null);

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

  // --- Drag and Drop Handlers ---
  const handleDragStartFromBacklog = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    setDragSource('backlog');
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromFocus = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    setDragSource('in_focus');
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragSource(null);
    setIsDragOverFocus(false);
    setIsDragOverBacklog(false);
  };

  // Drop onto IN FOCUS Column
  const handleDragOverFocus = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragSource === 'backlog') {
      if (focusTask !== null) {
        e.dataTransfer.dropEffect = 'none';
      } else {
        e.dataTransfer.dropEffect = 'move';
      }
      if (!isDragOverFocus) {
        setIsDragOverFocus(true);
      }
    }
  };

  const handleDragLeaveFocus = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverFocus(false);
    }
  };

  const handleDropOnFocus = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;

    if (focusTask !== null) {
      triggerBlockedAlert(
        pomodoro.isRunning
          ? 'Active Session in Progress: Complete or return the active task to Backlog before starting a new one!'
          : 'Slot Occupied: Complete or return the active task to Backlog before starting a new one!'
      );
      setIsDragOverFocus(false);
      setDraggedTaskId(null);
      setDragSource(null);
      return;
    }

    if (taskId && dragSource === 'backlog') {
      setTaskStatus(taskId, 'in_focus');
      setJustDroppedId(taskId);
      setTimeout(() => setJustDroppedId(null), 700);
    }
    setIsDragOverFocus(false);
    setDraggedTaskId(null);
    setDragSource(null);
  };

  // Drop onto BACKLOG Column
  const handleDragOverBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverBacklog && dragSource === 'in_focus') {
      setIsDragOverBacklog(true);
    }
  };

  const handleDragLeaveBacklog = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverBacklog(false);
    }
  };

  const handleDropOnBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId && dragSource === 'in_focus') {
      setTaskStatus(taskId, 'backlog');
    }
    setIsDragOverBacklog(false);
    setDraggedTaskId(null);
    setDragSource(null);
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
      <main className="flex-1 p-5 flex flex-col gap-3 min-h-0 overflow-hidden select-none bg-[#0A0D14] relative">
        {/* Top Celebration Banner on Screen */}
        {isAllDone && showCelebrationBanner && (
          <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E599]/15 via-[#161B22] to-[#A78BFA]/15 border border-[#00E599]/30 shadow-mint-glow flex items-center justify-between animate-banner-slide-down shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#00E599]/20 border border-[#00E599]/40 flex items-center justify-center text-sm shadow-sm">
                🎉
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide">
                  Yayy!! You are done with your tasks. Let's go!!
                </span>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  Backlog and in-focus are completely cleared today.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => confettiRef.current?.fire()}
                className="px-2.5 py-1 rounded-lg bg-[#00E599]/20 hover:bg-[#00E599]/35 text-[#00E599] text-[10.5px] font-mono font-bold border border-[#00E599]/40 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
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
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* COLUMN 1: TODAY'S BACKLOG (Col span 4)                                   */}
          {/* ========================================================================= */}
          <section
        onDragOver={handleDragOverBacklog}
        onDragLeave={handleDragLeaveBacklog}
        onDrop={handleDropOnBacklog}
        className={`col-span-4 flex flex-col bg-[#0D1117] rounded-xl border p-4 shadow-card min-h-0 transition-all duration-200 ${
          isDragOverBacklog
            ? 'border-[#A78BFA] ring-2 ring-[#A78BFA]/30 bg-[#A78BFA]/[0.03] scale-[1.006]'
            : 'border-white/[0.07]'
        }`}
      >
        {/* Header: Column title and active count badge */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
              Today's Backlog
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              Drag to Focus
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#161B22] text-slate-300 border border-white/[0.06] tabular-nums">
              {backlogTasks.length}
            </span>
          </div>
        </div>

        {/* Drag Over Backlog Drop Indicator */}
        {isDragOverBacklog && (
          <div className="mb-3 py-2.5 px-3 rounded-xl border-2 border-dashed border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA] font-bold text-[11px] flex items-center justify-center gap-2 animate-pulse">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Drop here to return task to Backlog</span>
          </div>
        )}

        {/* Task Cards List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {isAllDone && (
            <div className="py-7 px-4 rounded-xl bg-[#161B22]/40 border border-dashed border-[#00E599]/25 flex flex-col items-center justify-center text-center animate-card-enter my-3">
              <div className="w-10 h-10 rounded-full bg-[#00E599]/10 border border-[#00E599]/30 flex items-center justify-center text-[#00E599] mb-2 shadow-mint-glow">
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
            const isBeingDragged = draggedTaskId === task.id;
            const taskDurationMin = task.durationMinutes ?? 25;
            const isTaskUntimed = taskDurationMin === 0;
            const isEditingDuration = editingDurationTaskId === task.id;

            return (
              <div
                key={task.id}
                draggable={true}
                onDragStart={(e) => handleDragStartFromBacklog(e, task.id)}
                onDragEnd={handleDragEnd}
                className={`group relative p-3 rounded-xl bg-[#161B22] border transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-[1px] ${
                  isBeingDragged
                    ? 'opacity-35 scale-95 border-dashed border-[#00E599]/80 rotate-1 shadow-mint-glow bg-[#161B22]/60'
                    : 'border-white/[0.05] hover:border-white/15 hover:bg-[#1A202C] hover:shadow-card'
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
                    <div className="text-slate-600 group-hover:text-[#00E599] transition-colors mt-0.5 shrink-0">
                      <GripVertical className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-200 leading-snug group-hover:text-white flex-1">
                      {task.title}
                    </span>
                  </div>

                  {/* Actions: Compact "Focus" Pill Button & Delete Trash Icon on Hover */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromoteClick(task.id);
                      }}
                      disabled={focusTask !== null}
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-all flex items-center gap-1 ${
                        focusTask !== null
                          ? 'opacity-30 bg-white/[0.04] text-slate-500 cursor-not-allowed'
                          : 'cursor-pointer bg-white/[0.06] hover:bg-[#00E599] text-slate-300 hover:text-[#0A0D14] border border-white/[0.08] hover:border-[#00E599]'
                      }`}
                      title={
                        focusTask !== null
                          ? pomodoro.isRunning
                            ? 'Focus timer running — complete current task first'
                            : 'Focus slot occupied — complete current task first'
                          : 'Focus this task'
                      }
                    >
                      <span>Focus</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Meta Row: Tag Capsule, Duration Pill, Pomos Badge */}
                <div className="flex items-center justify-between text-[11px] pl-5">
                  <div className="flex items-center gap-2">
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDurationTaskId(isEditingDuration ? null : task.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] border transition-all cursor-pointer ${
                          isTaskUntimed
                            ? 'bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border-[#A78BFA]/30 text-[#A78BFA]'
                            : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-[#00E599]'
                        }`}
                        title="Click to adjust duration or make untimed"
                      >
                        {isTaskUntimed ? (
                          <>
                            <Coffee className="w-2.5 h-2.5 text-[#A78BFA]" />
                            <span>Untimed</span>
                          </>
                        ) : (
                          <>
                            <Timer className="w-2.5 h-2.5 text-[#00E599]" />
                            <span>{taskDurationMin}m</span>
                          </>
                        )}
                      </button>

                      {/* Duration Quick Selector Popover */}
                      {isEditingDuration && (
                        <div
                          className="absolute left-0 bottom-6 z-40 p-1.5 rounded-xl bg-[#0D1117] border border-white/20 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {DURATION_OPTIONS.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                updateTaskDuration(task.id, d);
                                setEditingDurationTaskId(null);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                                taskDurationMin === d
                                  ? 'bg-[#00E599] text-black font-bold'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {d === 0 ? 'Untimed (0m)' : `${d}m`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estimated Pomodoro Badge */}
                  <div className="flex items-center gap-1 text-[#94A3B8] font-mono text-[11px]">
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
                  </div>
                </div>
              </div>
            );
          })}

          {/* Inline Add Task Form (when open) */}
          {isAddingTask && (
            <form
              onSubmit={handleCreateTask}
              className="p-3 rounded-xl bg-[#161B22] border border-[#00E599]/40 space-y-2.5 text-xs shadow-mint-glow animate-in fade-in"
            >
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add task to backlog..."
                className="w-full bg-[#0D1117] px-3 py-1.5 rounded-lg text-white border border-white/15 placeholder-slate-500 focus:outline-none focus:border-[#00E599] text-[12px]"
                autoFocus
              />

              <div className="flex items-center justify-between text-[11px] pt-1">
                <select
                  value={taskTag}
                  onChange={(e) => setTaskTag(e.target.value)}
                  className="bg-[#0D1117] text-slate-300 px-2 py-1 rounded-full border border-white/10 text-[10.5px] font-mono"
                >
                  <option value="#dev">#dev</option>
                  <option value="#writing">#writing</option>
                  <option value="#design">#design</option>
                  <option value="#personal">#personal</option>
                  <option value="#routine">#routine</option>
                </select>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#0D1117] px-2 py-0.5 rounded-full border border-white/10">
                    {taskDuration === 0 ? (
                      <Coffee className="w-3 h-3 text-[#A78BFA]" />
                    ) : (
                      <Timer className="w-3 h-3 text-[#00E599]" />
                    )}
                    <select
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white font-mono text-[10.5px] focus:outline-none"
                    >
                      <option value={0} className="bg-[#0D1117]">
                        0m (Untimed)
                      </option>
                      {DURATION_OPTIONS.filter((d) => d > 0).map((d) => (
                        <option key={d} value={d} className="bg-[#0D1117]">
                          {d}m
                        </option>
                      ))}
                    </select>
                  </div>

                  {taskDuration > 0 && (
                    <div className="flex items-center gap-1 bg-[#0D1117] px-2 py-0.5 rounded-full border border-white/10">
                      <span>🍅</span>
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

                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#00E599] hover:bg-[#4DFFB2] text-black rounded-full text-[11px] font-bold shadow-mint-btn transition-all cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-slate-400 hover:text-white px-1 text-[11px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Inline Add Task Bar: #161B22 background, 1px border. Fixed double '+' */}
        {!isAddingTask && (
          <div className="mt-3 pt-2">
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#161B22] border border-white/[0.08] hover:border-[#00E599]/40 text-[#94A3B8] hover:text-[#00E599] text-[11.5px] font-medium transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 2: IN FOCUS (HERO ACTIVE CARD) (Col span 5)                       */}
      {/* ========================================================================= */}
      <section
        onDragOver={handleDragOverFocus}
        onDragLeave={handleDragLeaveFocus}
        onDrop={handleDropOnFocus}
        className={`col-span-5 flex flex-col bg-[#0D1117] rounded-xl border p-4 shadow-[0_0_24px_rgba(0,229,153,0.08)] relative overflow-hidden min-h-0 transition-all duration-200 ${
          isDragOverFocus && focusTask !== null
            ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-amber-500/[0.04]'
            : isDragOverFocus && focusTask === null
            ? 'border-[#00E599] ring-2 ring-[#00E599]/40 bg-[#00E599]/[0.04] shadow-[0_0_35px_rgba(0,229,153,0.22)] scale-[1.008]'
            : focusTask !== null
            ? 'border-[#00E599]/40'
            : 'border-white/[0.08]'
        }`}
      >
        {/* Ambient subtle neon emerald halo */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00E599]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Column Header: Title with emerald pulse dot */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#00E599]/20 relative z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599] shadow-[0_0_8px_#00E599]" />
            </span>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#00E599] font-mono flex items-center gap-1.5">
              <span>IN FOCUS</span>
              <Sparkles className="w-3 h-3 text-[#00E599]" />
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#94A3B8]">
              {focusTask ? (pomodoro.isRunning ? 'Timer Active' : 'Slot Occupied') : 'Drop Target'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border tabular-nums ${
                focusTask
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30'
                  : 'bg-white/[0.05] text-slate-400 border-white/10'
              }`}
            >
              {focusTask ? '1 ACTIVE' : '0 ACTIVE'}
            </span>
          </div>
        </div>

        {/* Prohibited Drop Alert or Active Guide */}
        {isDragOverFocus && focusTask !== null && (
          <div className="mb-3 py-2.5 px-3 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-2 animate-pulse relative z-20">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {pomodoro.isRunning
                ? 'Timer Running — Complete or return active task to Backlog first'
                : 'Slot Occupied — Complete or return active task to Backlog first'}
            </span>
          </div>
        )}

        {/* Drop Guide when slot is empty */}
        {isDragOverFocus && focusTask === null && (
          <div className="mb-3 py-3 px-4 rounded-xl border-2 border-dashed border-[#00E599] bg-[#00E599]/15 text-[#00E599] font-bold text-[12px] flex items-center justify-center gap-2 shadow-mint-glow animate-pulse relative z-20">
            <Sparkles className="w-4 h-4 text-[#00E599]" />
            <span>Drop here to start focusing!</span>
          </div>
        )}

        {/* Blocked Alert Banner */}
        {blockedAlert && (
          <div className="mb-3 py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-[11.5px] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 relative z-20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{blockedAlert}</span>
          </div>
        )}

        {/* Active Hero Card vs Empty State */}
        {focusTask ? (
          <div
            draggable={true}
            onDragStart={(e) => handleDragStartFromFocus(e, focusTask.id)}
            onDragEnd={handleDragEnd}
            className={`flex-1 flex flex-col justify-between bg-[#161B22]/95 rounded-xl p-4 border border-white/10 shadow-lg relative z-10 transition-all duration-300 ${
              justDroppedId === focusTask.id ? 'animate-drop-glow animate-card-enter' : ''
            } ${draggedTaskId === focusTask.id ? 'opacity-40 scale-95 border-dashed border-[#A78BFA]' : ''}`}
            title="Drag back to Backlog to free slot"
          >
            <div>
              {/* Category badge pill alongside completed/estimated Pomodoros */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="text-slate-600 hover:text-[#00E599] transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag back to Backlog"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10.5px] font-bold border ${getTagBadgeStyle(
                      focusTask.tag
                    )}`}
                  >
                    {focusTask.tag || '#dev'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {focusTask.durationMinutes === 0 ? (
                    <span className="flex items-center gap-1 text-[10.5px] font-mono text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/25 px-2.5 py-0.5 rounded-full font-semibold">
                      <Coffee className="w-3 h-3 text-[#A78BFA]" />
                      <span>Untimed</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/20 px-2.5 py-0.5 rounded-full tabular-nums">
                      <span>🍅</span>
                      <span className="font-bold">
                        {focusTask.pomosDone} / {focusTask.pomosEst}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Large semibold title (headline-md) */}
              <h3 className="text-[18px] md:text-[20px] font-semibold text-white tracking-tight leading-snug mb-3">
                {focusTask.title}
              </h3>

              {/* 6px Progress Track in #161B22 filled with #00E599 by completion ratio */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Sprint Progress</span>
                  <span className="text-[#00E599] font-bold tabular-nums">
                    {isUntimed ? 'Untimed (Self-Paced)' : `${Math.round(completionRatio * 100)}%`}
                  </span>
                </div>
                <div className="h-[6px] w-full bg-[#161B22] rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-[#00E599] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,229,153,0.5)]"
                    style={{
                      width: `${isUntimed ? 100 : Math.max(4, Math.round(completionRatio * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Focus Session Timer Controls Container */}
              {focusTask.durationMinutes === 0 ? (
                <div className="p-3.5 rounded-xl bg-[#0D1117] border border-[#A78BFA]/20 flex items-center gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/30 flex items-center justify-center shrink-0">
                    <Coffee className="w-5 h-5 text-[#A78BFA]" />
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
                <div className="p-3.5 rounded-xl bg-[#0D1117] border border-white/[0.08] flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          pomodoro.isRunning
                            ? 'bg-[#00E599] animate-pulse shadow-[0_0_8px_#00E599]'
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTimer}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                        pomodoro.isRunning
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 hover:bg-[#F59E0B]/30'
                          : 'bg-[#00E599] text-[#0A0D14] hover:bg-[#4DFFB2] shadow-mint-btn'
                      }`}
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
                    </button>

                    <button
                      onClick={resetTimer}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Deliverables / Focus Notes Context */}
              <div className="text-[11px] text-slate-400 bg-[#0D1117]/80 p-3 rounded-xl border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                  <FileText className="w-3.5 h-3.5 text-[#00E599]" />
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

            {/* Bottom Actions: Bold Neon Emerald "Complete Task" & Ghost "Return to Backlog" */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/[0.08]">
              <button
                onClick={() => setTaskStatus(focusTask.id, 'done')}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#00E599] hover:bg-[#4DFFB2] active:scale-[0.98] text-[#0A0D14] font-semibold text-[12px] shadow-mint-btn transition-all cursor-pointer"
                title="Complete task and reset timer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete Task</span>
              </button>

              <button
                onClick={() => setTaskStatus(focusTask.id, 'backlog')}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#161B22] hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.08] text-slate-300 font-medium text-[12px] transition-all cursor-pointer"
                title="Return task to Backlog"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
                <span>Return to Backlog</span>
              </button>
            </div>
          </div>
        ) : isAllDone ? (
          <CompletionCelebration
            doneCount={doneTasks.length}
            totalPomos={totalPomosDone}
            onCelebrateAgain={() => confettiRef.current?.fire()}
            onAddNewTask={() => setIsAddingTask(true)}
          />
        ) : (
          /* Empty State: Dashed Inset Container */
          <div className="flex-1 flex flex-col items-center justify-center border-dashed border-white/10 rounded-xl p-8 text-center text-slate-400 text-sm bg-[#161B22]/30">
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
      <section className="col-span-3 flex flex-col bg-[#0D1117] rounded-xl border border-white/[0.07] p-4 shadow-card min-h-0">
        {/* Header: Title and count badge */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E599]" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
              Done Today
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 tabular-nums">
            {doneTasks.length}
          </span>
        </div>

        {/* Completed Cards List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {doneTasks.map((task) => {
            const isTaskUntimed = task.durationMinutes === 0;
            return (
              <div
                key={task.id}
                className="group p-2.5 rounded-xl bg-[#161B22]/60 border border-white/[0.04] hover:border-white/15 hover:-translate-y-[1px] transition-all duration-200"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[#94A3B8] line-through leading-snug font-medium">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="tabular-nums">{task.completedAt || 'Today'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#00E599] font-medium">
                          {isTaskUntimed
                            ? '✓ Untimed'
                            : `✓ ${task.pomosDone || 1} Pomos`}
                        </span>
                        {/* Compact "Undo" button calling setTaskStatus(task.id, 'backlog') */}
                        <button
                          onClick={() => setTaskStatus(task.id, 'backlog')}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/15 transition-all cursor-pointer"
                          title="Return to backlog"
                        >
                          <Undo2 className="w-2.5 h-2.5" />
                          <span>Undo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
