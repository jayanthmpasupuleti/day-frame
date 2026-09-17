import React from 'react';
import { TitleBar } from './components/TitleBar';
import { HabitPulse } from './components/HabitPulse';
import { AgileBoard } from './components/AgileBoard';
import { BottomDock } from './components/BottomDock';
import { AudioEngine } from './components/AudioEngine';
import { useTimerEngine } from './hooks/useTimerEngine';

export const App: React.FC = () => {
  // Mount global Pomodoro timer ticking engine
  useTimerEngine();

  return (
    <div className="h-screen w-screen flex items-center justify-center p-0 bg-[#0A0D14] text-[#DCE2EC] antialiased font-sans relative overflow-hidden selection:bg-[#00E599] selection:text-black">
      {/* Headless YouTube Ambient Audio Engine */}
      <AudioEngine />
      {/* Ambient backdrop dot matrix & neon emerald radial halos */}
      <div className="fixed inset-0 bg-dot-matrix ambient-glow pointer-events-none opacity-80" />

      {/* Primary Mac Window Dashboard Container */}
      <div className="relative w-full h-full bg-[#0A0D14]/95 border border-white/[0.07] shadow-window flex flex-col overflow-hidden backdrop-blur-3xl z-10">
        {/* Top: Mac Window Chrome & Header */}
        <TitleBar />

        {/* Section 1: Daily Habit Pulse with Expandable Heatmap Grid */}
        <HabitPulse />

        {/* Section 2: Personal Day Agile Board (3 Columns) */}
        <AgileBoard />

        {/* Bottom Utility Dock: YouTube Ambient Audio & Timer Controls */}
        <BottomDock />
      </div>
    </div>
  );
};

export default App;
