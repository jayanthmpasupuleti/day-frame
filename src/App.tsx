import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { HabitPulse } from './components/HabitPulse';
import { AgileBoard } from './components/AgileBoard';
import { BottomDock } from './components/BottomDock';
import { AudioEngine } from './components/AudioEngine';
import { TrayPopover } from './components/TrayPopover';
import { useTimerEngine } from './hooks/useTimerEngine';
import { useCrossWindowSync } from './hooks/useCrossWindowSync';
import { useTraySync } from './hooks/useTraySync';
import { useDayframeStore } from './store/useDayframeStore';

if (typeof window !== 'undefined') {
  (window as any).__DAYFRAME_STORE__ = useDayframeStore;
}

export const App: React.FC = () => {
  const [isPopover, setIsPopover] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'popover';
    }
    return false;
  });

  useEffect(() => {
    if (!isPopover && typeof window !== 'undefined') {
      try {
        import('@tauri-apps/api/window')
          .then(({ getCurrentWindow }) => {
            const win = getCurrentWindow();
            if (win.label === 'popover') {
              setIsPopover(true);
            }
          })
          .catch(() => {});
      } catch {}
    }
  }, [isPopover]);

  // If this window is the popover widget, render the companion popover
  if (isPopover) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden selection:bg-[#00E599] selection:text-black">
        <TrayPopover />
      </div>
    );
  }

  // Otherwise, this is the main dashboard window:
  // Mount global Pomodoro timer ticking engine, cross-window sync, and tray menu/title sync
  useTimerEngine();
  useCrossWindowSync(false);
  useTraySync();

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
