import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Cloud,
  CloudOff,
  Link as LinkIcon,
  ChevronUp,
  X,
  Zap,
  Headphones,
  Check,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { PomodoroMode, AudioTrack } from '../types';

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
    sync,
    toggleGuestMode,
  } = useDayframeStore();

  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isCustomUrlOpen, setIsCustomUrlOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');

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
    <footer className="h-[52px] min-h-[52px] px-5 border-t border-white/[0.07] bg-[#0D1117]/95 backdrop-blur-2xl flex items-center justify-between relative z-30 select-none">
      {/* ===================================================================== */}
      {/* Left: YouTube Focus Stream Selector & Audio Controls                  */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-[340px] min-w-0">
        {/* Headphone Icon with Active Neon Mint Visualizer Pulse Dot */}
        <div className="relative flex items-center justify-center shrink-0">
          <button
            onClick={toggleAudio}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              audio.isPlayingAudio
                ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/40 shadow-mint-glow'
                : 'bg-[#161B22] text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
            title={audio.isPlayingAudio ? 'Pause focus audio' : 'Play focus audio'}
          >
            <Headphones className="w-4 h-4" />
          </button>
          {audio.isPlayingAudio && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E599] shadow-[0_0_8px_#00E599]" />
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
            <span className="text-[12px] font-semibold text-slate-200 group-hover:text-white truncate max-w-[110px] sm:max-w-[155px]">
              {activeTrack?.title || 'Lofi Chill Radio'}
            </span>
            <ChevronUp
              className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0 ${
                isPresetsOpen ? 'rotate-180 text-[#00E599]' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                audio.isPlayingAudio
                  ? 'bg-[#00E599] shadow-[0_0_6px_#00E599] animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-mono truncate">
              {audio.isPlayingAudio ? 'Focus Audio' : 'Paused'}
            </span>
            <span className="text-slate-600">•</span>

            {/* Auto-Sync Toggle Pill */}
            <button
              onClick={() =>
                updateSettings({ autoSyncAudio: !pomodoro.settings.autoSyncAudio })
              }
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                pomodoro.settings.autoSyncAudio
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30 shadow-xs'
                  : 'bg-[#161B22] text-slate-500 border-white/[0.06] hover:text-slate-300'
              }`}
              title="Automatically sync audio playback with Pomodoro sprint state"
            >
              <Zap
                className={`w-2.5 h-2.5 ${
                  pomodoro.settings.autoSyncAudio
                    ? 'fill-current text-[#00E599]'
                    : 'text-slate-500'
                }`}
              />
              <span>Auto-Sync</span>
            </button>
          </div>

          {/* Preset Streams Popover Drawer */}
          {isPresetsOpen && (
            <div className="absolute bottom-12 left-0 w-72 bg-[#0D1117] border border-white/15 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-[10px] font-mono uppercase text-[#94A3B8] px-2 py-1 tracking-wider border-b border-white/10 mb-1.5 flex items-center justify-between">
                <span>YouTube Ambient Focus</span>
                <span className="text-[9px] text-[#00E599] font-semibold">Live Streams</span>
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
                        ? 'bg-[#00E599]/15 text-[#00E599] font-semibold'
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
                      <Check className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
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

        {/* Volume & Mute Controls with Custom Midnight Mint Slider */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08] shrink-0">
          <button
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
          </button>

          {/* Custom Styled Slider in #161B22 with #00E599 fill */}
          <div className="relative flex items-center w-16 h-4 group cursor-pointer">
            <div className="w-full h-1.5 bg-[#161B22] rounded-full overflow-hidden border border-white/[0.08]">
              <div
                className="h-full bg-[#00E599] rounded-full transition-all duration-150 shadow-[0_0_6px_rgba(0,229,153,0.4)]"
                style={{ width: `${Math.round(audio.volume * 100)}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audio.volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title={`Volume: ${Math.round(audio.volume * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Center: Interval Mode Switcher (Pill capsules)                        */}
      {/* ===================================================================== */}
      <div className="inline-flex p-1 rounded-full bg-[#161B22] border border-white/[0.08] shadow-card shrink-0">
        {(
          [
            { id: 'focus', label: 'Focus', min: '25m' },
            { id: 'shortBreak', label: 'Short Break', min: '5m' },
            { id: 'longBreak', label: 'Long Break', min: '15m' },
          ] as { id: PomodoroMode; label: string; min: string }[]
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold tracking-tight transition-all cursor-pointer ${
              pomodoro.mode === m.id
                ? m.id === 'focus'
                  ? 'bg-[#00E599] text-black font-bold shadow-mint-btn'
                  : 'bg-[#F59E0B] text-black font-bold shadow-xs'
                : 'text-[#94A3B8] hover:text-white font-medium'
            }`}
          >
            <span className="hidden lg:inline">{m.min} </span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* Right: Cloud Sync Status (Guest / Offline Mode)                       */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-end gap-2.5 flex-1 max-w-[340px] text-right min-w-0">
        <button
          onClick={toggleGuestMode}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border transition-all cursor-pointer text-[10.5px] sm:text-[11px] shrink-0 ${
            sync.isGuest
              ? 'bg-[#161B22] border-white/[0.07] text-[#94A3B8] hover:border-white/20'
              : 'bg-[#00E599]/10 border-[#00E599]/40 text-[#00E599]'
          }`}
          title="Click to toggle Guest / Supabase Cloud Sync"
        >
          {sync.isGuest ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-none">Guest / Offline</span>
              <span className="text-[10px] text-[#00E599] font-mono underline hover:text-[#4DFFB2] shrink-0">
                Sign In
              </span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-[#00E599] shrink-0" />
              <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-none">Cloud Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E599] animate-pulse shrink-0" />
            </>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* Custom YouTube Track Modal Dialog                                     */}
      {/* ===================================================================== */}
      {isCustomUrlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0D1117] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#A78BFA]" />
                <h3 className="text-[14px] font-bold text-white">
                  Add Custom YouTube Focus Stream
                </h3>
              </div>
              <button
                onClick={() => setIsCustomUrlOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11.5px] text-[#94A3B8] leading-relaxed">
              Add any YouTube lofi livestream, synthwave mix, or nature noise. You can paste a full URL or direct Video ID.
            </p>

            <form onSubmit={handleApplyCustomTrack} className="space-y-3">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Track Title (e.g. Japanese Rain Garden)..."
                className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-white/15 text-white placeholder-slate-500 text-[12px] focus:outline-none focus:border-[#00E599]"
              />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="YouTube URL or Video ID (e.g. jfKfPfyJRdk or https://...)..."
                className="w-full px-3 py-2 rounded-xl bg-[#161B22] border border-white/15 text-white placeholder-slate-500 text-[12px] focus:outline-none focus:border-[#00E599]"
                autoFocus
                required
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustomUrlOpen(false)}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[11.5px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#00E599] hover:bg-[#4DFFB2] text-black text-[11.5px] font-bold shadow-mint-btn transition-all cursor-pointer"
                >
                  Save to Presets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};

export default BottomDock;
