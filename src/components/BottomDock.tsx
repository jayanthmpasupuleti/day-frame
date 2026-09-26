import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Cloud,
  Link as LinkIcon,
  ChevronUp,
  Zap,
  Headphones,
  Check,
  Lock,
  RefreshCw,
  LogOut,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { PomodoroMode, AudioTrack } from '../types';
import {
  Plasma,
  PlasmaButton,
  PlasmaBadge,
  PlasmaSlider,
  PlasmaSegmentedControl,
  PlasmaDialog,
  PlasmaInput,
} from './plasma';

const PRESET_STREAMS: AudioTrack[] = [
  { id: 'lofi', title: 'Lofi Chill Radio', youtubeId: '5qap5aO4i9A' },
  { id: 'synthwave', title: 'Synthwave Focus', youtubeId: '4xDzrJKXOOY' },
  { id: 'ambient', title: 'Deep Ambient Noise', youtubeId: 'WPni755-Krg' },
];

export const BottomDock: React.FC = () => {
  const {
    audio,
    setActiveTrack,
    toggleAudio,
    setVolume,
    addCustomTrack,
    pomodoro,
    setMode,
    updateSettings,
    user,
    syncStatus,
    lastSyncedAt,
    openAuthModal,
    syncToCloud,
    signOutUser,
  } = useDayframeStore();

  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');

  // Close user sync popover menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Combine default preset streams with any custom tracks added
  const allTracks: AudioTrack[] = [
    ...PRESET_STREAMS,
    ...audio.audioTracks.filter(
      (t) => !PRESET_STREAMS.some((p) => p.id === t.id)
    ),
  ];

  const activeTrack =
    allTracks.find((t) => t.id === audio.activeTrackId) || allTracks[0];
  const isMuted = audio.volume === 0;

  const parseYoutubeId = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('v=')) {
      return trimmed.split('v=')[1].split('&')[0];
    }
    if (trimmed.includes('youtu.be/')) {
      return trimmed.split('youtu.be/')[1].split('?')[0];
    }
    if (trimmed.includes('embed/')) {
      return trimmed.split('embed/')[1].split('?')[0];
    }
    return trimmed;
  };

  const handleApplyCustomTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const ytId = parseYoutubeId(urlInput);
    const title = customTitle.trim() || 'Custom YouTube Stream';
    addCustomTrack(title, ytId);
    setIsCustomUrlOpen(false);
    setUrlInput('');
    setCustomTitle('');
  };

  const toggleMute = () => {
    setVolume(isMuted ? 0.7 : 0);
  };

  return (
    <>
      <Plasma
        as="footer"
        fuse={false}
        elevation={0.3}
        radius={0}
        className="h-[52px] min-h-[52px] px-5 border-t border-[var(--border-card)] bg-[var(--bg-card)]/95 backdrop-blur-2xl flex items-center justify-between relative z-30 select-none transition-colors duration-300"
      >
        {/* ===================================================================== */}
        {/* Left: YouTube Focus Stream Selector & Audio Controls                  */}
        {/* ===================================================================== */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-[380px] min-w-0">
          {/* Headphone Icon with Active Dynamic Pulse Dot */}
          <div className="relative flex items-center justify-center shrink-0">
            <PlasmaButton
              variant={audio.isPlayingAudio ? 'primary' : 'secondary'}
              size="icon"
              onClick={toggleAudio}
              className="w-8 h-8 rounded-full"
              title={audio.isPlayingAudio ? 'Pause focus audio' : 'Play focus audio'}
            >
              <Headphones className="w-4 h-4" />
            </PlasmaButton>
            {audio.isPlayingAudio && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-[0_0_8px_var(--glow-primary)]" />
              </span>
            )}
          </div>

          {/* Track Title Display with Dropdown Arrow Trigger */}
          <div className="relative min-w-0 flex-1">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="flex items-center gap-1.5 text-left group cursor-pointer max-w-full min-w-0"
              title="Choose focus ambient stream"
            >
              <span className="text-[12px] font-semibold text-slate-200 group-hover:text-white truncate max-w-[130px] sm:max-w-[175px]">
                {activeTrack?.title || 'Lofi Chill Radio'}
              </span>
              <ChevronUp
                className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0 ${
                  isPresetsOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-[#94A3B8] mt-0.5 min-w-0">
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                  audio.isPlayingAudio
                    ? 'bg-primary shadow-[0_0_6px_var(--glow-primary)] animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="font-mono whitespace-nowrap shrink-0">
                {audio.isPlayingAudio ? 'Focus Audio' : 'Paused'}
              </span>
              <span className="text-slate-600 shrink-0 select-none">•</span>

              {/* Auto-Sync Toggle Pill */}
              <PlasmaBadge
                variant={pomodoro.settings.autoSyncAudio ? 'primary' : 'muted'}
                size="sm"
                mono
                interactive
                onClick={() =>
                  updateSettings({ autoSyncAudio: !pomodoro.settings.autoSyncAudio })
                }
                title="Automatically sync audio playback with Pomodoro sprint state"
                className="shrink-0"
              >
                <Zap
                  className={`w-2.5 h-2.5 shrink-0 ${
                    pomodoro.settings.autoSyncAudio
                      ? 'fill-current text-primary'
                      : 'text-slate-500'
                  }`}
                />
                <span className="whitespace-nowrap leading-none">Auto-Sync</span>
              </PlasmaBadge>
            </div>

            {/* Preset Streams Popover Drawer */}
            {isPresetsOpen && (
              <div className="absolute bottom-12 left-0 w-72 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-mono uppercase text-[#94A3B8] px-2 py-1 tracking-wider border-b border-[var(--border-card)] mb-1.5 flex items-center justify-between">
                  <span>YouTube Ambient Focus</span>
                  <span className="text-[9px] text-primary font-semibold">Live Streams</span>
                </div>

                <div className="space-y-1">
                  {allTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setActiveTrack(track.id);
                        setIsPresetsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11.5px] transition-colors text-left cursor-pointer ${
                        audio.activeTrackId === track.id
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[12px]">
                          {track.id === 'synthwave'
                            ? '⚡'
                            : track.id === 'ambient'
                            ? '☕'
                            : '🎧'}
                        </span>
                        <div className="truncate">
                          <div className="truncate font-medium">{track.title}</div>
                          <div className="text-[9px] font-mono text-slate-500 truncate">
                            ID: {track.youtubeId}
                          </div>
                        </div>
                      </div>
                      {audio.activeTrackId === track.id && (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom YouTube URL Trigger */}
                <div className="pt-2 mt-1.5 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsPresetsOpen(false);
                      setIsCustomUrlOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-[#A78BFA] hover:bg-[#A78BFA]/10 transition-colors text-left cursor-pointer font-medium"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>+ Custom YouTube Stream / URL</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Volume & Mute Controls with PlasmaSlider */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-card)] shrink-0">
            <PlasmaButton
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#94A3B8]" />
              )}
            </PlasmaButton>

            <div className="w-16">
              <PlasmaSlider
                value={audio.volume}
                min={0}
                max={1}
                step={0.05}
                onChange={(val) => setVolume(val)}
                title={`Volume: ${Math.round(audio.volume * 100)}%`}
              />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* Center: Interval Mode Switcher (PlasmaSegmentedControl)               */}
        {/* ===================================================================== */}
        <div className="shrink-0">
          <PlasmaSegmentedControl<PomodoroMode>
            value={pomodoro.mode}
            onChange={(val) => setMode(val)}
            options={[
              {
                value: 'focus',
                label: (
                  <span>
                    <span className="hidden lg:inline">25m </span>Focus
                  </span>
                ),
              },
              {
                value: 'shortBreak',
                label: (
                  <span>
                    <span className="hidden lg:inline">5m </span>Short Break
                  </span>
                ),
              },
              {
                value: 'longBreak',
                label: (
                  <span>
                    <span className="hidden lg:inline">15m </span>Long Break
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* ===================================================================== */}
        {/* Right: Cloud Sync Status (Guest / Synced / Syncing)                   */}
        {/* ===================================================================== */}
        <div
          className="flex items-center justify-end gap-2.5 flex-1 max-w-[360px] text-right min-w-0 relative"
          ref={userMenuRef}
        >
          {!user ? (
            /* Guest / Local Storage State */
            <PlasmaBadge
              variant="muted"
              size="md"
              interactive
              onClick={openAuthModal}
              className="cursor-pointer gap-2 shadow-xs"
              title="Local-first storage active. Click to sign in for multi-device cloud sync."
            >
              <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-none font-medium">Local Storage</span>
              <span className="text-slate-600 select-none">•</span>
              <span className="text-[10px] text-primary font-mono font-semibold hover:underline shrink-0">
                Sign In to Sync
              </span>
            </PlasmaBadge>
          ) : (
            /* Signed In State (Synced, Syncing, or Error) */
            <>
              <PlasmaBadge
                variant={
                  syncStatus === 'syncing'
                    ? 'warning'
                    : syncStatus === 'error'
                    ? 'accent'
                    : 'success'
                }
                size="md"
                interactive
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="cursor-pointer gap-2 shadow-xs"
                title="Click to view cloud sync status and account options"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                    <span className="font-semibold text-white">Syncing...</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="font-semibold text-rose-300">Sync Error</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10B981]" />
                    </span>
                    <Cloud className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-white">Synced</span>
                  </>
                )}
                <span className="text-slate-600 select-none">•</span>
                <span className="truncate max-w-[100px] sm:max-w-[130px] font-mono text-[10px] text-slate-300">
                  {user.email || 'Cloud User'}
                </span>
              </PlasmaBadge>

              {/* Account & Sync Dropdown Popover */}
              {isUserMenuOpen && (
                <div className="absolute bottom-12 right-0 w-64 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 text-left">
                  {/* User Info Header */}
                  <div className="flex items-center gap-2.5 pb-2.5 mb-2 border-b border-[var(--border-card)]">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                      {user.email ? user.email.charAt(0) : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-white truncate">
                        {user.email || 'Connected Account'}
                      </p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        <span>Encrypted Cloud Backup</span>
                      </p>
                    </div>
                  </div>

                  {/* Sync Details */}
                  <div className="px-1 py-1 text-[10.5px] text-slate-400 space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="font-mono text-slate-200 capitalize">
                        {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Failed' : 'Up to date'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last synced</span>
                      <span className="font-mono text-slate-200">
                        {lastSyncedAt || 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 pt-1 border-t border-[var(--border-card)]">
                    <PlasmaButton
                      onClick={() => {
                        syncToCloud();
                        setIsUserMenuOpen(false);
                      }}
                      disabled={syncStatus === 'syncing'}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-[11px]"
                    >
                      <RefreshCw className={`w-3 h-3 text-primary ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </PlasmaButton>

                    <PlasmaButton
                      onClick={() => {
                        signOutUser();
                        setIsUserMenuOpen(false);
                      }}
                      variant="danger"
                      size="sm"
                      className="w-full justify-start text-[11px]"
                    >
                      <LogOut className="w-3 h-3 text-rose-400" />
                      <span>Sign Out (Keep Local Data)</span>
                    </PlasmaButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Plasma>

      {/* ===================================================================== */}
      {/* Custom YouTube Track Modal Dialog using PlasmaDialog                   */}
      {/* ===================================================================== */}
      <PlasmaDialog
        isOpen={isCustomUrlOpen}
        onClose={() => setIsCustomUrlOpen(false)}
        title="Add Custom YouTube Focus Stream"
        description="Add any YouTube lofi livestream, synthwave mix, or nature noise. You can paste a full URL or direct Video ID."
        icon={<Radio className="w-4 h-4 text-primary" />}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleApplyCustomTrack} className="space-y-3 p-5">
          <PlasmaInput
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Track Title (e.g. Japanese Rain Garden)..."
          />
          <PlasmaInput
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="YouTube URL or Video ID (e.g. jfKfPfyJRdk or https://...)..."
            autoFocus
            required
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <PlasmaButton
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsCustomUrlOpen(false)}
            >
              Cancel
            </PlasmaButton>
            <PlasmaButton
              type="submit"
              variant="primary"
              size="md"
            >
              Save to Presets
            </PlasmaButton>
          </div>
        </form>
      </PlasmaDialog>
    </>
  );
};

export default BottomDock;
