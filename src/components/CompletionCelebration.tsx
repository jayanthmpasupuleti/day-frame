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
    <div className="flex-1 flex flex-col items-center justify-between p-6 rounded-2xl bg-gradient-to-b from-[#161B22]/90 via-[#0D1117] to-[#161B22]/90 border border-[#00E599]/35 shadow-[0_0_50px_rgba(0,229,153,0.15)] relative overflow-hidden animate-card-enter text-center select-none">
      {/* Dynamic ambient radial gradients */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#00E599]/15 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />
      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-[#A78BFA]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Status Capsule */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 border border-[#00E599]/30 text-[#00E599] text-[10.5px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(0,229,153,0.2)]">
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>Sprint Accomplished • 100% Cleared</span>
      </div>

      {/* Main Illustration & Happy Headline */}
      <div className="relative z-10 my-auto py-2 flex flex-col items-center max-w-md">
        {/* Floating Celebration Hero Icon with Pulse Aura */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00E599]/25 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00E599]/20 via-[#161B22] to-[#A78BFA]/20 border border-[#00E599]/40 flex items-center justify-center shadow-mint-glow animate-celebration-float">
            <Trophy className="w-10 h-10 text-[#00E599] drop-shadow-[0_0_12px_rgba(0,229,153,0.8)]" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#F59E0B] text-black flex items-center justify-center text-xs font-black shadow-lg">
              ✨
            </div>
          </div>
        </div>

        {/* Happy Celebration Message */}
        <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight">
          Yayy!! You are done with your tasks.
        </h3>
        <div className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00E599] via-[#4DFFB2] to-[#38BDF8] tracking-tight mt-1 flex items-center justify-center gap-2">
          <span>Let's go!!</span>
          <span className="text-2xl">🎉🚀</span>
        </div>

        <p className="text-xs text-slate-400 mt-2.5 max-w-xs leading-relaxed">
          Both your backlog and in-focus queues are completely clear! Take a well-earned break or launch into your next challenge.
        </p>

        {/* Stats Recap Chips */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1117]/80 border border-white/[0.08] text-[11px] font-mono text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00E599]" />
            <span><strong className="text-white font-semibold">{doneCount}</strong> {doneCount === 1 ? 'task' : 'tasks'} crushed</span>
          </div>

          {totalPomos > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1117]/80 border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span><strong className="text-white font-semibold">{totalPomos}</strong> {totalPomos === 1 ? 'pomo' : 'pomos'} logged</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Interactive Action Buttons */}
      <div className="relative z-10 w-full grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onCelebrateAgain}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#4DFFB2] active:scale-95 text-[#0A0D14] font-bold text-xs shadow-mint-btn transition-all cursor-pointer"
          title="Blast confetti again!"
        >
          <span>Celebrate Again</span>
          <span className="text-sm">🎊</span>
        </button>

        <button
          type="button"
          onClick={onAddNewTask}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#161B22] hover:bg-white/[0.08] hover:border-white/20 active:scale-95 text-slate-200 border border-white/[0.08] font-semibold text-xs transition-all cursor-pointer"
          title="Add a new task to your backlog"
        >
          <Plus className="w-4 h-4 text-[#00E599]" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};
