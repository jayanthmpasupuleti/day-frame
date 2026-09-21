import React from 'react';
import { Sparkles, Trophy, Plus, CheckCircle2, Flame } from 'lucide-react';

interface CompletionCelebrationProps {
  doneCount: number;
  totalPomos: number;
  onCelebrateAgain: () => void;
  onAddNewTask: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  doneCount,
  totalPomos,
  onCelebrateAgain,
  onAddNewTask,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 rounded-2xl bg-gradient-to-b from-[var(--bg-inset)]/90 via-[var(--bg-card)] to-[var(--bg-inset)]/90 border border-primary/35 shadow-[0_0_50px_var(--glow-primary)] relative overflow-hidden animate-card-enter text-center select-none">
      {/* Dynamic ambient radial gradients */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-[var(--glow-primary)]/20 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-[var(--accent-audio)]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Status Capsule */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10.5px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_var(--glow-primary)]">
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>Sprint Accomplished • 100% Cleared</span>
      </div>

      {/* Main Illustration & Happy Headline */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center max-w-md">
        {/* Floating Celebration Hero Icon with Pulse Aura */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[var(--glow-primary)]/25 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 via-[var(--bg-inset)] to-[var(--accent-audio)]/20 border border-primary/40 flex items-center justify-center shadow-mint-glow animate-celebration-float">
            <Trophy className="w-10 h-10 text-primary drop-shadow-[0_0_12px_var(--glow-primary)]" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-black shadow-lg">
              ✨
            </div>
          </div>
        </div>

        {/* Happy Celebration Message */}
        <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight">
          Yayy!! You are done with your tasks.
        </h3>
        <div className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-[var(--accent-secondary)] tracking-tight mt-1 flex items-center justify-center gap-2">
          <span>Let's go!!</span>
          <span className="text-2xl">🎉🚀</span>
        </div>

        <p className="text-xs text-slate-400 mt-2.5 max-w-xs leading-relaxed">
          Both your backlog and in-focus queues are completely clear! Take a well-earned break or launch into your next challenge.
        </p>

        {/* Stats Recap Chips */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border-card)] text-[11px] font-mono text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span><strong className="text-white font-semibold">{doneCount}</strong> {doneCount === 1 ? 'task' : 'tasks'} crushed</span>
          </div>

          {totalPomos > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border-card)] text-[11px] font-mono text-slate-300">
              <Flame className="w-3.5 h-3.5 text-[var(--accent-badge)]" />
              <span><strong className="text-white font-semibold">{totalPomos}</strong> {totalPomos === 1 ? 'pomo' : 'pomos'} logged</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Interactive Action Buttons */}
      <div className="relative z-10 w-full grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-card)]">
        <button
          type="button"
          onClick={onCelebrateAgain}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:brightness-110 active:scale-95 text-primaryText font-bold text-xs shadow-mint-btn transition-all cursor-pointer"
          title="Blast confetti again!"
        >
          <span>Celebrate Again</span>
          <span className="text-sm">🎊</span>
        </button>

        <button
          type="button"
          onClick={onAddNewTask}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-inset)] hover:bg-white/[0.08] hover:border-white/20 active:scale-95 text-slate-200 border border-[var(--border-card)] font-semibold text-xs transition-all cursor-pointer"
          title="Add a new task to your backlog"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};
