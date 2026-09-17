import React, { useState } from 'react';
import {
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  FileText,
  GripVertical,
  Lock,
  Timer,
  AlertTriangle,
  Coffee,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';

const DURATION_OPTIONS = [0, 15, 25, 30, 45, 60, 90];

export const DaySprintBoard: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTaskDuration,
    promoteToFocus,
    moveBackToBacklog,
    completeHeroTask,
    pomodoro,
    togglePomodoroRunning,
    resetPomodoro,
  } = useDayframeStore();

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

  // Duration editor popover state
  const [editingDurationTaskId, setEditingDurationTaskId] = useState<string | null>(null);

  const backlogTasks = tasks.filter((t) => t.status === 'backlog');
  const focusTask = tasks.find((t) => t.status === 'in_focus') || null;
  const doneTasks = tasks.filter((t) => t.status === 'done');

  // Format pomodoro time
  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const isUntimed = focusTask?.durationMinutes === 0;
  const formattedTime = isUntimed
    ? 'Untimed'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress calculations for hero card
  const estimatedPomos = focusTask?.pomosEst || 4;
  const completedPomos = focusTask?.pomosDone || 0;
  const progressRatio = estimatedPomos > 0 ? Math.min(1, completedPomos / estimatedPomos) : 1;
  const circumference = 88; // 2 * pi * 14
  const strokeOffset = circumference * (1 - progressRatio);

  const triggerBlockedAlert = (msg: string) => {
    setBlockedAlert(msg);
    setTimeout(() => setBlockedAlert(null), 3000);
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
    e.dataTransfer.effectAllowed = focusTask ? 'none' : 'move';
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
        'Slot Occupied: Finish or return the active task to Backlog before starting a new one!'
      );
      setIsDragOverFocus(false);
      setDraggedTaskId(null);
      setDragSource(null);
      return;
    }

    if (taskId && dragSource === 'backlog') {
      promoteToFocus(taskId);
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
      moveBackToBacklog(taskId);
    }
    setIsDragOverBacklog(false);
    setDraggedTaskId(null);
    setDragSource(null);
  };

  const handlePromoteClick = (taskId: string) => {
    if (focusTask !== null) {
      triggerBlockedAlert(
        'Slot Occupied: Finish or return the active task to Backlog before starting a new one!'
      );
      return;
    }
    promoteToFocus(taskId);
    setJustDroppedId(taskId);
    setTimeout(() => setJustDroppedId(null), 700);
  };

  return (
    <main className="flex-1 p-4 grid grid-cols-12 gap-3.5 min-h-0 overflow-hidden select-none bg-[#0A0D14]">
      {/* COLUMN 1: TODAY'S BACKLOG (Col span 4) */}
      <section
        onDragOver={handleDragOverBacklog}
        onDragLeave={handleDragLeaveBacklog}
        onDrop={handleDropOnBacklog}
        className={`col-span-4 flex flex-col bg-[#0D1117] rounded-xl border p-3.5 shadow-card min-h-0 transition-all duration-200 ${
          isDragOverBacklog
            ? 'border-[#A78BFA] ring-2 ring-[#A78BFA]/30 bg-[#A78BFA]/[0.03] scale-[1.006]'
            : 'border-white/[0.07]'
        }`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/[0.06]">
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#161B22] text-slate-300 border border-white/[0.06]">
              {backlogTasks.length}
            </span>
          </div>
        </div>

        {/* Drag Over Backlog Indicator */}
        {isDragOverBacklog && (
          <div className="mb-2.5 py-2.5 px-3 rounded-xl border-2 border-dashed border-[#A78BFA] bg-[#A78BFA]/10 text-[#A78BFA] font-bold text-[11px] flex items-center justify-center gap-2 animate-pulse">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Drop here to return task to Backlog</span>
          </div>
        )}

        {/* Task Cards List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
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
                className={`group relative p-3 rounded-xl bg-[#161B22] border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  isBeingDragged
                    ? 'opacity-35 scale-95 border-dashed border-[#00E599]/80 rotate-1 shadow-mint-glow bg-[#161B22]/60'
                    : 'border-white/[0.06] hover:border-[#00E599]/40 hover:bg-[#1A202C] hover:scale-[1.01] hover:shadow-card'
                }`}
                title={focusTask ? 'Slot occupied (complete active task first)' : 'Drag into In Focus'}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <div className="text-slate-600 group-hover:text-[#00E599] transition-colors mt-0.5 shrink-0">
                      <GripVertical className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span className="text-[12.5px] font-medium text-slate-200 leading-snug group-hover:text-white flex-1">
                      {task.title}
                    </span>
                  </div>

                  {/* Promote to Focus Button (respects lock) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePromoteClick(task.id);
                    }}
                    disabled={focusTask !== null}
                    className={`p-1 rounded-full text-slate-300 transition-all shrink-0 cursor-pointer ${
                      focusTask !== null
                        ? 'opacity-20 hover:text-amber-400 cursor-not-allowed'
                        : 'opacity-0 group-hover:opacity-100 bg-white/[0.08] hover:bg-[#00E599] hover:text-black'
                    }`}
                    title={focusTask !== null ? 'Focus slot occupied' : 'Make Active Focus'}
                  >
                    <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pl-5">
                  <div className="flex items-center gap-2">
                    {/* Tag pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                        task.tag === '#personal'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : task.tag === '#dev'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                          : task.tag === '#writing'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : task.tag === '#design'
                          ? 'bg-pink-500/10 text-pink-300 border-pink-500/20'
                          : 'bg-white/[0.05] text-[#94A3B8] border-white/[0.08]'
                      }`}
                    >
                      {task.tag || '#dev'}
                    </span>

                    {/* Per-Task Custom Duration Pill (or Untimed Badge) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDurationTaskId(isEditingDuration ? null : task.id);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] border transition-all cursor-pointer ${
                          isTaskUntimed
                            ? 'bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border-[#A78BFA]/30 text-[#A78BFA]'
                            : 'bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-[#00E599]'
                        }`}
                        title="Click to change Pomodoro duration or make Untimed"
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

                      {/* Compact Duration Quick-Selector Menu (with 0m Untimed) */}
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
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold transition-colors cursor-pointer ${
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

                  <div className="flex items-center gap-2">
                    {/* Pomodoro Cycles Count or Untimed Label */}
                    <div className="flex items-center gap-1 text-[#94A3B8] font-mono text-[11px]">
                      {isTaskUntimed ? (
                        <span className="text-slate-500 text-[10.5px]">No Timer</span>
                      ) : (
                        <>
                          <span>🍅</span>
                          <span className="tabular-nums font-semibold text-slate-300">
                            {task.pomosEst}
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      className={`text-[10.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ${
                        focusTask ? 'text-slate-500' : 'text-[#00E599]'
                      }`}
                    >
                      <span>{focusTask ? 'Locked' : 'Drag →'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Inline Add Task Form with Custom Duration selector (including 0m Untimed) */}
          {isAddingTask ? (
            <form
              onSubmit={handleCreateTask}
              className="p-3 rounded-xl bg-[#161B22] border border-[#00E599]/40 space-y-2.5 text-xs shadow-mint-glow animate-in fade-in"
            >
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Grab Starbucks Coffee, Ship v2.0, Read paper..."
                className="w-full bg-[#0D1117] px-3 py-1.5 rounded-lg text-white border border-white/15 placeholder-slate-500 focus:outline-none focus:border-[#00E599] text-[12px]"
                autoFocus
              />

              {/* Tag, Pomos count & Custom Duration selector */}
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
                  {/* Task Duration selector (0m = Untimed) */}
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
                        0m (No Timer)
                      </option>
                      {DURATION_OPTIONS.filter((d) => d > 0).map((d) => (
                        <option key={d} value={d} className="bg-[#0D1117]">
                          {d}m
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pomos cycles input (only if not untimed) */}
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
          ) : null}
        </div>

        {/* Bottom "+ Add Task" inline trigger button */}
        {!isAddingTask && (
          <button
            onClick={() => setIsAddingTask(true)}
            className="mt-3 pt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-full border border-dashed border-white/15 hover:border-[#00E599]/50 text-[#94A3B8] hover:text-[#00E599] text-[11.5px] font-medium transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Task</span>
          </button>
        )}
      </section>

      {/* COLUMN 2: IN FOCUS (HERO COLUMN — OCCUPIED / DROP TARGET) (Col span 5) */}
      <section
        onDragOver={handleDragOverFocus}
        onDragLeave={handleDragLeaveFocus}
        onDrop={handleDropOnFocus}
        className={`col-span-5 flex flex-col bg-[#0D1117] rounded-xl border p-4 shadow-[0_0_24px_rgba(0,229,153,0.08)] relative overflow-hidden min-h-0 transition-all duration-200 ${
          isDragOverFocus && focusTask === null
            ? 'border-[#00E599] ring-2 ring-[#00E599]/40 bg-[#00E599]/[0.04] shadow-[0_0_35px_rgba(0,229,153,0.22)] scale-[1.008]'
            : isDragOverFocus && focusTask !== null
            ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-amber-500/[0.04]'
            : focusTask !== null
            ? 'border-[#00E599]/40'
            : 'border-white/[0.08]'
        }`}
      >
        {/* Ambient subtle neon emerald glow behind card */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00E599]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Column Header */}
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
            <span className="text-[10.5px] font-mono text-[#94A3B8]">
              {focusTask ? 'Slot Occupied' : 'Drop Target'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
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
          <div className="mb-3 py-2.5 px-3 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 font-bold text-[11.5px] flex items-center justify-center gap-2 animate-pulse shadow-xs relative z-20">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Slot Occupied — Complete or return current task to Backlog first</span>
          </div>
        )}

        {/* Allowed Drop Guide (Only when empty) */}
        {isDragOverFocus && focusTask === null && (
          <div className="mb-3 py-3 px-4 rounded-xl border-2 border-dashed border-[#00E599] bg-[#00E599]/15 text-[#00E599] font-bold text-[12px] flex items-center justify-center gap-2 shadow-mint-glow animate-pulse relative z-20">
            <Sparkles className="w-4 h-4 text-[#00E599] animate-spin-slow" />
            <span>Drop here to start focusing!</span>
          </div>
        )}

        {/* Blocked Alert Banner (Triggered upon attempted drop or click while occupied) */}
        {blockedAlert && (
          <div className="mb-3 py-2 px-3 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-200 text-[11.5px] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 relative z-20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{blockedAlert}</span>
          </div>
        )}

        {/* Hero Active Card */}
        {focusTask ? (
          <div
            draggable={true}
            onDragStart={(e) => handleDragStartFromFocus(e, focusTask.id)}
            onDragEnd={handleDragEnd}
            className={`flex-1 flex flex-col justify-between bg-[#161B22]/95 rounded-xl p-4 border border-white/10 shadow-lg relative z-10 transition-all duration-300 ${
              justDroppedId === focusTask.id
                ? 'animate-drop-glow animate-card-enter'
                : 'hover:border-white/20'
            } ${draggedTaskId === focusTask.id ? 'opacity-40 scale-95 border-dashed border-[#A78BFA]' : ''}`}
            title="Drag back to Backlog to free slot"
          >
            <div>
              {/* Badge, Tag & Custom Duration Display */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="text-slate-600 hover:text-[#00E599] transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag back to Backlog"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00E599]/15 border border-[#00E599]/30 text-[#00E599] font-bold text-[10.5px] font-mono tracking-wide">
                    {focusTask.tag || '#dev'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {focusTask.durationMinutes === 0 ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/25 px-2.5 py-0.5 rounded-full font-semibold">
                      <Coffee className="w-3 h-3 text-[#A78BFA]" />
                      <span>Untimed Task</span>
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#00E599] bg-[#00E599]/10 border border-[#00E599]/20 px-2 py-0.5 rounded-full">
                        <Timer className="w-3 h-3 text-[#00E599]" />
                        <span>{focusTask.durationMinutes}m Pomodoro</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8]">
                        Target: {focusTask.pomosEst} Cycles
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Large Task Title (headline-md) */}
              <h3 className="text-[18px] font-bold text-white tracking-tight leading-snug mb-3.5">
                {focusTask.title}
              </h3>

              {/* Focus Progress Widget: Timed vs Untimed */}
              {focusTask.durationMinutes === 0 ? (
                /* Untimed / Freeform Task Banner */
                <div className="p-4 rounded-xl bg-[#0D1117] border border-[#A78BFA]/20 flex items-center gap-3.5 mb-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#A78BFA]/15 border border-[#A78BFA]/30 flex items-center justify-center shrink-0">
                    <Coffee className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-white">
                      Freeform / Personal Task
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                      No Pomodoro timer required. Focus at your own pace or run your errand freely, then click "Complete (Done)" when finished!
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Circular Pomodoro Progress Ring & Controls */
                <div className="p-3.5 rounded-xl bg-[#0D1117] border border-white/[0.08] flex items-center gap-4 mb-3.5">
                  <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-white/10"
                        strokeWidth="3.2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="url(#mint-grad)"
                        strokeWidth="3.2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="mint-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00E599" />
                          <stop offset="100%" stopColor="#4DFFB2" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-[11.5px] font-mono font-bold text-white tabular-nums">
                      {completedPomos}/{estimatedPomos}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-200">
                      Cycle {completedPomos + 1} of {estimatedPomos} in progress
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          pomodoro.isRunning ? 'bg-[#00E599] animate-pulse shadow-[0_0_6px_#00E599]' : 'bg-slate-500'
                        }`}
                      />
                      <span className="font-mono text-[#00E599] font-bold text-[12px] tabular-nums">
                        {formattedTime} left
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[#94A3B8]">
                        {pomodoro.mode === 'focus' ? 'Focus Session' : 'Break'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={togglePomodoroRunning}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                        pomodoro.isRunning
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 hover:bg-[#F59E0B]/30'
                          : 'bg-[#00E599] text-black hover:bg-[#4DFFB2] shadow-mint-btn'
                      }`}
                      title={pomodoro.isRunning ? 'Pause Pomodoro' : 'Start Focus Timer'}
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
                      onClick={resetPomodoro}
                      className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Reset Pomodoro"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Key Deliverables / Notes preview */}
              <div className="text-[11.5px] text-slate-400 bg-[#0D1117]/80 p-3 rounded-xl border border-white/[0.05] space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#00E599]" />
                  <span>Deliverables &amp; Focus Context:</span>
                </div>
                {(focusTask.notes || [
                  'Glassmorphic dock pill bar with YouTube focus stream',
                  'Single-window 3-column personal Agile board',
                  'Local-First SQLite offline data privacy',
                ]).map((note, idx) => (
                  <p key={idx} className="text-[#94A3B8] pl-5 text-[11px]">
                    • {note}
                  </p>
                ))}
              </div>
            </div>

            {/* Interactive Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/[0.08]">
              {/* Primary Emerald Pill "Complete (Done)" — Resets timer and frees slot */}
              <button
                onClick={() => completeHeroTask(focusTask.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#00E599] hover:bg-[#4DFFB2] active:scale-[0.98] text-black font-bold text-[12px] shadow-mint-btn transition-all cursor-pointer"
                title="Complete task and reset Pomodoro timer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete (Done)</span>
              </button>

              {/* Ghost Pill "Back to Queue" — Frees slot */}
              <button
                onClick={() => moveBackToBacklog(focusTask.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#161B22] hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.08] text-slate-300 font-medium text-[12px] transition-all cursor-pointer"
                title="Return task to Backlog"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
                <span>Back to Queue</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-[#161B22]/40 transition-colors">
            <Clock className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-slate-300 font-medium text-xs">No task currently in focus.</p>
            <p className="text-[#94A3B8] text-[11px] mt-1 max-w-xs">
              Drag and drop any card from "Today's Backlog" here to start focusing.
            </p>
          </div>
        )}
      </section>

      {/* COLUMN 3: DONE TODAY (Col span 3) */}
      <section className="col-span-3 flex flex-col bg-[#0D1117] rounded-xl border border-white/[0.07] p-3.5 shadow-card min-h-0">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E599]" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
              Done Today
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
            {doneTasks.length}
          </span>
        </div>

        {/* Completed Tasks List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {doneTasks.map((task) => {
            const isTaskUntimed = task.durationMinutes === 0;
            return (
              <div
                key={task.id}
                className="p-2.5 rounded-xl bg-[#161B22]/60 border border-white/[0.04] opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[#94A3B8] line-through leading-snug font-medium">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                      <span>{task.completedAt || 'Today'}</span>
                      <span className="text-[#00E599] font-medium">
                        {isTaskUntimed ? '✓ Untimed / Done' : `✓ ${task.pomosDone || 1} Pomos (${task.durationMinutes}m)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
