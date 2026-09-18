import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Headphones,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  ChevronDown,
  Flame,
  Coffee,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import { useCrossWindowSync } from '../hooks/useCrossWindowSync';

export const TrayPopover: React.FC = () => {
  // Mount cross-window sync hook and get action dispatcher
  const { dispatchAction } = useCrossWindowSync(true);

  const { pomodoro, tasks, habits, audio } = useDayframeStore();

  const handleToggleTimer = () => dispatchAction('toggleTimer');
  const handleResetTimer = () => dispatchAction('resetTimer');
  const handleSetMode = (mode: string) => dispatchAction('setMode', mode);
  const handlePromoteToFocus = (id: string) => dispatchAction('promoteToFocus', id);
  const handleCompleteHeroTask = (id: string) => dispatchAction('completeHeroTask', id);
  const handleToggleHabit = (id: string) => dispatchAction('toggleHabit', id);
  const handleToggleAudio = () => dispatchAction('toggleAudio');
  const handleSetVolume = (vol: number) => dispatchAction('setVolume', vol);

  const [showPicker, setShowPicker] = useState(false);

  // Active in-focus task and backlog tasks
  const activeFocusTask = tasks.find((t) => t.status === 'in_focus');
  const backlogTasks = tasks.filter((t) => t.status === 'backlog');

  // Pomodoro countdown calculations
  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const isUntimed = pomodoro.timeLeft === 0;
  const formattedTime = isUntimed
    ? 'Untimed'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress ring calculations
  const totalDuration =
    pomodoro.mode === 'focus'
      ? (activeFocusTask?.durationMinutes ? activeFocusTask.durationMinutes * 60 : pomodoro.settings.focusDuration)
      : pomodoro.mode === 'shortBreak'
      ? pomodoro.settings.shortBreakDuration
      : pomodoro.settings.longBreakDuration;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalDuration > 0 ? pomodoro.timeLeft / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progressRatio)));

  const activeTrack =
    audio.audioTracks.find((t) => t.id === audio.activeTrackId) || audio.audioTracks[0];
  const isMuted = audio.volume === 0;
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;

  const handleOpenFullDashboard = () => {
    try {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('open_full_dashboard').catch(() => {});
      });
    } catch {}
  };

  const handleClosePopover = () => {
    try {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('hide_popover').catch(() => {});
      });
    } catch {}
  };

  // Auto-hide popover when it loses focus (clicking anywhere outside)
  React.useEffect(() => {
    const handleBlur = () => {
      handleClosePopover();
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  return (
    <div className="w-[360px] h-[460px] bg-[#0A0D14]/98 text-[#DCE2EC] border border-white/[0.09] shadow-2xl backdrop-blur-2xl flex flex-col justify-between p-3.5 select-none overflow-hidden font-sans rounded-2xl">
      {/* 1. Header: Brand, Close dot & Expand to Dashboard */}
      <header className="flex items-center justify-between pb-2 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClosePopover}
            className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center group"
            title="Close Popover"
          >
            <X className="w-2 h-2 text-black/60 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
          </button>
          <span className="relative flex h-2 w-2 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599] shadow-[0_0_6px_#00E599]" />
          </span>
          <span className="font-semibold text-xs tracking-tight text-white">
            Dayframe Mini
          </span>
        </div>

        <button
          onClick={handleOpenFullDashboard}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Open Full Dashboard"
        >
          <span>Dashboard</span>
          <Maximize2 className="w-3 h-3 text-[#00E599]" />
        </button>
      </header>

      {/* 2. Circular Pomodoro Ring & Controls */}
      <div className="flex items-center justify-between px-2 py-2 bg-[#0D1117] rounded-xl border border-white/[0.06]">
        {/* Left: SVG Progress Ring with countdown */}
        <div className="relative flex items-center justify-center w-[92px] h-[92px]">
          <svg className="w-[92px] h-[92px] -rotate-90" viewBox="0 0 92 92">
            <circle
              cx="46"
              cy="46"
              r={radius}
              className="stroke-[#161B22]"
              strokeWidth="5.5"
              fill="transparent"
            />
            <circle
              cx="46"
              cy="46"
              r={radius}
              className={`transition-all duration-300 ${
                pomodoro.mode === 'focus' ? 'stroke-[#00E599]' : 'stroke-[#F59E0B]'
              }`}
              strokeWidth="5.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-mono text-base font-bold text-white tracking-tight tabular-nums">
              {formattedTime}
            </span>
            <span
              className={`text-[8.5px] font-bold uppercase tracking-wider ${
                pomodoro.mode === 'focus' ? 'text-[#00E599]' : 'text-[#F59E0B]'
              }`}
            >
              {isUntimed ? 'UNTIMED' : pomodoro.mode === 'focus' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>

        {/* Right: Pomodoro CTA Buttons & Mode Switcher */}
        <div className="flex flex-col gap-1.5 flex-1 pl-4">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Cycle {pomodoro.currentCycle}/4</span>
            <button
              onClick={() => {
                const next = pomodoro.mode === 'focus' ? 'shortBreak' : 'focus';
                handleSetMode(next);
              }}
              className="hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-[10px]"
            >
              <Coffee className="w-2.5 h-2.5 text-[#F59E0B]" />
              <span>{pomodoro.mode === 'focus' ? 'Break' : 'Focus'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleToggleTimer}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                pomodoro.isRunning
                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 hover:bg-[#F59E0B]/30'
                  : 'bg-[#00E599] text-black hover:bg-[#4DFFB2] shadow-mint-btn'
              }`}
            >
              {pomodoro.isRunning ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="w-8 h-8 rounded-lg bg-[#161B22] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. In-Focus Task Slot */}
      <div className="p-2.5 bg-[#0D1117] rounded-xl border border-white/[0.06] relative">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
            <span>Active Focus Task</span>
          </span>
          {activeFocusTask?.tag && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-mono text-[9px]">
              {activeFocusTask.tag}
            </span>
          )}
        </div>

        {activeFocusTask ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate" title={activeFocusTask.title}>
                {activeFocusTask.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>
                  {activeFocusTask.pomosDone} / {activeFocusTask.pomosEst || 1} 🍅
                </span>
                {activeFocusTask.durationMinutes ? (
                  <span>• {activeFocusTask.durationMinutes}m</span>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => handleCompleteHeroTask(activeFocusTask.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 hover:bg-[#00E599] hover:text-black font-semibold text-[11px] transition-all cursor-pointer active:scale-95 shrink-0"
              title="Mark Task Completed"
            >
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Done</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full py-1 px-2 rounded-lg bg-[#161B22] border border-white/[0.08] hover:border-white/20 text-slate-300 text-xs flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="text-slate-400 truncate">
                {backlogTasks.length > 0 ? 'Pick task from backlog...' : 'No backlog tasks'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
            </button>

            {showPicker && backlogTasks.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#161B22] border border-white/[0.12] rounded-lg shadow-xl max-h-28 overflow-y-auto z-50 p-1">
                {backlogTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      handlePromoteToFocus(task.id);
                      setShowPicker(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/[0.08] text-slate-200 truncate cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{task.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                      {task.durationMinutes || 25}m
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Quick Habits Checklist */}
      <div className="p-2.5 bg-[#0D1117] rounded-xl border border-white/[0.06] flex-1 flex flex-col justify-between my-1.5 overflow-hidden">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span>Habits • {completedHabitsCount} of {habits.length}</span>
          <span className="text-[#00E599] font-mono text-[10px]">
            {habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0}%
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[82px] pr-1">
          {habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => handleToggleHabit(habit.id)}
              className="flex items-center justify-between p-1 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    habit.completedToday
                      ? 'bg-[#00E599] border-[#00E599] text-black'
                      : 'border-white/20 bg-white/[0.03] group-hover:border-white/40'
                  }`}
                >
                  {habit.completedToday && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs truncate max-w-[200px] ${
                    habit.completedToday ? 'line-through text-slate-500' : 'text-slate-200'
                  }`}
                >
                  {habit.name}
                </span>
              </div>

              {habit.streak > 0 && (
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5 shrink-0">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  <span>{habit.streak}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Mini Ambient Audio Bar */}
      <footer className="flex items-center justify-between px-2.5 py-1.5 bg-[#0D1117] rounded-xl border border-white/[0.06] text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <Headphones className="w-3.5 h-3.5 text-[#A78BFA] shrink-0" />
          <span className="text-[11px] font-medium truncate max-w-[170px] text-slate-200">
            {activeTrack?.title || 'Ambient Focus Audio'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => handleSetVolume(isMuted ? 0.7 : 0)}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-rose-400" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>

          <button
            onClick={handleToggleAudio}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
              audio.isPlayingAudio
                ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/40'
                : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'
            }`}
          >
            {audio.isPlayingAudio ? 'Pause' : 'Play'}
          </button>
        </div>
      </footer>
    </div>
  );
};
