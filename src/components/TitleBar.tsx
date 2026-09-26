import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Headphones,
  Palette,
  Flame,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import { PlasmaBadge, PlasmaButton } from './plasma';

export const TitleBar: React.FC = () => {
  const {
    pomodoro,
    togglePomodoroRunning,
    resetPomodoro,
    setPomodoroMode,
    audio,
    toggleAudioPlaying,
    openThemeModal,
    isProUnlocked,
    activeTheme,
    previewThemeId,
  } = useDayframeStore();

  const minutes = Math.floor(pomodoro.timeLeft / 60);
  const seconds = pomodoro.timeLeft % 60;
  const isUntimed = pomodoro.timeLeft === 0;
  const formattedTime = isUntimed
    ? 'Untimed'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeTrack =
    audio.audioTracks.find((t) => t.id === audio.activeTrackId) || audio.audioTracks[0];
  const isMuted = audio.volume === 0;

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [role="button"]')) {
      return;
    }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('start_drag');
      } catch {}
    }
  };

  const handleDoubleClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [role="button"]')) {
      return;
    }
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {}
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="h-[46px] min-h-[46px] px-4 flex items-center justify-between border-b border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-xl relative z-30 select-none cursor-default"
    >
      {/* Left: Native macOS Traffic Lights space + Dayframe Brand with Dynamic Pulse */}
      <div data-tauri-drag-region className="flex items-center gap-2.5 flex-1 max-w-[340px] pl-[70px] min-w-0 shrink-0">
        <div className="flex items-center gap-2 pointer-events-none min-w-0 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)] shadow-[0_0_8px_var(--glow-primary)]" />
          </span>
          <span className="font-bold text-[13px] tracking-tight text-white shrink-0">
            Dayframe
          </span>
          <PlasmaBadge variant="muted" mono size="sm" className="hidden sm:inline-flex">
            v5.0
          </PlasmaBadge>
          {(previewThemeId || activeTheme) === 'sage-chakra' && (
            <PlasmaBadge variant="warning" size="sm" className="font-bold">
              <Flame className="w-2.5 h-2.5 text-[#FF6B00] fill-[#FF6B00]" />
              <span>Legendary Tier</span>
            </PlasmaBadge>
          )}
        </div>
      </div>

      {/* Center: Live Pomodoro Pill using Plasma primitives */}
      <div data-tauri-drag-region className="flex items-center justify-center shrink-0 min-w-0">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1 rounded-full bg-[var(--bg-inset)] border border-[var(--border-card)] shadow-card backdrop-blur-md">
          {/* Mode Pill Switcher */}
          <PlasmaButton
            size="sm"
            variant={
              isUntimed
                ? 'subtle'
                : pomodoro.mode === 'focus'
                ? 'primary'
                : 'secondary'
            }
            onClick={() => {
              const nextMode =
                pomodoro.mode === 'focus'
                  ? 'shortBreak'
                  : pomodoro.mode === 'shortBreak'
                  ? 'longBreak'
                  : 'focus';
              setPomodoroMode(nextMode);
            }}
            title="Switch Focus/Break interval"
            className="uppercase font-bold tracking-wider text-[10px] py-0.5 px-2"
          >
            {isUntimed
              ? 'Untimed'
              : pomodoro.mode === 'focus'
              ? 'Focus'
              : pomodoro.mode === 'shortBreak'
              ? 'Short Break'
              : 'Long Break'}
          </PlasmaButton>

          {/* Tabular Mono Timer */}
          <span className="text-[13.5px] font-mono font-bold tracking-tight text-white tabular-nums px-0.5">
            {formattedTime}
          </span>

          {/* Play/Pause Pill Button */}
          {!isUntimed && (
            <PlasmaButton
              size="sm"
              variant={pomodoro.isRunning ? 'danger' : 'primary'}
              onClick={togglePomodoroRunning}
              title={pomodoro.isRunning ? 'Pause timer' : 'Start focus timer'}
              className="py-0.5 px-2.5 text-[11px]"
            >
              {pomodoro.isRunning ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </PlasmaButton>
          )}

          {/* Cycle Indicator */}
          <span className="text-[11px] font-mono text-slate-400 border-l border-white/10 pl-2 hidden md:inline">
            {isUntimed ? 'Freeform' : `Cycle ${pomodoro.currentCycle} of 4`}
          </span>

          {/* Quick Reset */}
          {!isUntimed && (
            <PlasmaButton
              size="icon"
              variant="ghost"
              onClick={resetPomodoro}
              title="Reset timer"
              className="w-5 h-5 text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
            </PlasmaButton>
          )}
        </div>
      </div>

      {/* Right: Ambient Focus Audio & Theme Switcher Palette */}
      <div data-tauri-drag-region className="flex items-center justify-end gap-2 flex-1 max-w-[280px] shrink-0">
        {/* Ambient Focus Audio Widget Pill */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full bg-[var(--bg-inset)] border border-[var(--border-card)] text-slate-300 transition-all text-[11.5px] min-w-0">
          <button
            data-plasma-nodrag
            onClick={toggleAudioPlaying}
            className="flex items-center gap-1.5 cursor-pointer hover:text-white min-w-0"
            title={audio.isPlayingAudio ? 'Pause focus audio' : 'Play focus audio'}
          >
            <Headphones className="w-3.5 h-3.5 text-[var(--accent-secondary)] shrink-0" />
            <span className="font-medium text-slate-200 max-w-[75px] sm:max-w-[110px] truncate text-[11px]">
              {activeTrack?.title || 'Focus Audio'}
            </span>
          </button>

          {/* Mini Equalizer or Mute Toggle */}
          <button
            data-plasma-nodrag
            onClick={() => useDayframeStore.getState().setVolume(isMuted ? 0.7 : 0)}
            className="text-slate-400 hover:text-[var(--accent-secondary)] transition-colors cursor-pointer ml-0.5"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : audio.isPlayingAudio ? (
              <div className="flex items-end gap-0.5 h-2.5 px-0.5">
                <span className="w-0.5 bg-[var(--accent-secondary)] rounded-full bar-1" />
                <span className="w-0.5 bg-[var(--accent-secondary)] rounded-full bar-2" />
                <span className="w-0.5 bg-[var(--accent-secondary)] rounded-full bar-3" />
              </div>
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
          </button>
        </div>

        {/* Theme Switcher Palette Button */}
        <PlasmaButton
          size="icon"
          variant="secondary"
          onClick={openThemeModal}
          title="Dayframe Plasma Themes"
          className="relative group p-1.5"
        >
          <Palette className="w-3.5 h-3.5 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
          {!isProUnlocked && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-[var(--bg-card)]" />
          )}
        </PlasmaButton>
      </div>
    </header>
  );
};

export default TitleBar;
