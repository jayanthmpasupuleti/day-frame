import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { HabitPulse } from './components/HabitPulse';
import { AgileBoard } from './components/AgileBoard';
import { BottomDock } from './components/BottomDock';
import { AudioEngine } from './components/AudioEngine';
import { TrayPopover } from './components/TrayPopover';
import { ThemeModal } from './components/ThemeModal';
import { AuthModal } from './components/AuthModal';
import { AuthBridgePage } from './components/AuthBridgePage';
import { useTimerEngine } from './hooks/useTimerEngine';
import { useCrossWindowSync } from './hooks/useCrossWindowSync';
import { useTraySync } from './hooks/useTraySync';
import { useSyncEngine } from './hooks/useSyncEngine';
import { useDayframeStore } from './store/useDayframeStore';
import { isTauriApp } from './utils/platform';
import { PlasmaProvider, PlasmaCanvas, PLASMA_THEMES, applyPlasmaThemeToDom } from './components/plasma';

if (typeof window !== 'undefined') {
  (window as any).__DAYFRAME_STORE__ = useDayframeStore;
}

export const App: React.FC = () => {
  // If running in an external web browser and receiving an authentication callback/handoff,
  // render the dedicated AuthBridgePage to transfer credentials to the desktop app
  const [isAuthBridge] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (isTauriApp()) return false;
    const url = window.location.href;
    return (
      url.includes('auth_handoff=') ||
      url.includes('access_token=') ||
      url.includes('code=') ||
      url.includes('error=') ||
      url.includes('error_description=') ||
      url.includes('type=recovery') ||
      url.includes('type=magiclink') ||
      url.includes('type=signup')
    );
  });

  if (isAuthBridge) {
    return <AuthBridgePage />;
  }

  const [isPopover, setIsPopover] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'popover';
    }
    return false;
  });

  const activeTheme = useDayframeStore((s) => s.activeTheme);
  const previewThemeId = useDayframeStore((s) => s.previewThemeId);
  const effectiveThemeId = previewThemeId || activeTheme;
  const plasmaTheme = PLASMA_THEMES[effectiveThemeId] || PLASMA_THEMES['midnight-mint'];

  // Guarantee Plasma theme tokens and attributes are applied to document root
  useEffect(() => {
    applyPlasmaThemeToDom(plasmaTheme);
  }, [plasmaTheme]);

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
      <div className="w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden selection:bg-primary selection:text-primaryText">
        <TrayPopover />
      </div>
    );
  }

  // Otherwise, this is the main dashboard window:
  // Mount global Pomodoro timer ticking engine, cross-window sync, tray menu/title sync, and cloud sync engine
  useTimerEngine();
  useCrossWindowSync(false);
  useTraySync();
  useSyncEngine();

  return (
    <PlasmaProvider
      mood={plasmaTheme.mood}
      theme="dark"
      material={plasmaTheme.material}
      tint={plasmaTheme.tint}
      opacity={plasmaTheme.opacity}
      frost={plasmaTheme.frost}
      elevation={plasmaTheme.elevation}
      rimColor={plasmaTheme.rimColor}
      radius={20}
      maxSurfaces={24}
      canvas={false}
    >
      {/* Background WebGL Plasma Liquid Canvas */}
      <PlasmaCanvas zIndex={0} className="fixed inset-0 pointer-events-none" />

      <div className="h-screen w-screen flex items-center justify-center p-0 bg-[var(--bg-canvas)] text-[#DCE2EC] antialiased font-sans relative overflow-hidden selection:bg-primary selection:text-primaryText transition-colors duration-300">
        {/* Headless YouTube Ambient Audio Engine */}
        <AudioEngine />
        {/* Ambient backdrop dot matrix & neon radial halos */}
        <div className="fixed inset-0 bg-dot-matrix ambient-glow pointer-events-none opacity-85 transition-all duration-300" />

        {/* Primary Mac Window Dashboard Container */}
        <div className="relative w-full h-full bg-[var(--bg-canvas)]/95 border border-[var(--border-card)] shadow-window flex flex-col overflow-hidden backdrop-blur-3xl z-10 transition-colors duration-300">
          {/* Top: Mac Window Chrome & Header */}
          <TitleBar />

          {/* Section 1: Daily Habit Pulse with Expandable Heatmap Grid */}
          <HabitPulse />

          {/* Section 2: Personal Day Agile Board (3 Columns) */}
          <AgileBoard />

          {/* Bottom Utility Dock: YouTube Ambient Audio & Timer Controls */}
          <BottomDock />

          {/* Theme Switcher & Legendary Preview Modal */}
          <ThemeModal />

          {/* Cloud Authentication & Sync Modal */}
          <AuthModal />
        </div>
      </div>
    </PlasmaProvider>
  );
};

export default App;
