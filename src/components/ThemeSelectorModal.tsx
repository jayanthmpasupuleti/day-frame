import React, { useEffect } from 'react';
import {
  X,
  Lock,
  Sparkles,
  Check,
  Eye,
  Crown,
  Palette,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { ThemeDefinition, ThemeId } from '../types';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'midnight-mint',
    name: 'Midnight Mint',
    tagline: 'Deep space obsidian with high-energy neon mint focus accents',
    isPro: false,
    colors: {
      canvas: '#0A0D14',
      card: '#0D1117',
      inset: '#161B22',
      primary: '#00E599',
      secondary: '#00E599',
      glow: 'rgba(0, 229, 153, 0.35)',
    },
  },
  {
    id: 'cyber-tokyo',
    name: 'Cyber Tokyo',
    tagline: 'Pitch black OLED canvas with hot neon pink & cyan cyberpunk aura',
    isPro: true,
    colors: {
      canvas: '#000000',
      card: '#08080C',
      inset: '#121118',
      primary: '#FF007A',
      secondary: '#00F0FF',
      glow: 'rgba(255, 0, 122, 0.35)',
    },
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    tagline: 'Glacial arctic fjord navy paired with crisp ice blue & cool mint',
    isPro: true,
    colors: {
      canvas: '#0F141C',
      card: '#151D28',
      inset: '#1C2636',
      primary: '#38BDF8',
      secondary: '#6EE7B7',
      glow: 'rgba(56, 189, 248, 0.30)',
    },
  },
  {
    id: 'kyoto-amber',
    name: 'Kyoto Amber',
    tagline: 'Warm roasted charcoal & espresso with luminous lantern amber gold',
    isPro: true,
    colors: {
      canvas: '#14110F',
      card: '#1C1815',
      inset: '#25201C',
      primary: '#F59E0B',
      secondary: '#84CC16',
      glow: 'rgba(245, 158, 11, 0.30)',
    },
  },
  {
    id: 'obsidian-sunset',
    name: 'Obsidian Sunset',
    tagline: 'Midnight twilight violet with electric amethyst & rose bloom',
    isPro: true,
    colors: {
      canvas: '#0D0A14',
      card: '#141020',
      inset: '#1E1830',
      primary: '#A855F7',
      secondary: '#FB7185',
      glow: 'rgba(168, 85, 247, 0.30)',
    },
  },
];

export const ThemeSelectorModal: React.FC = () => {
  const isThemeModalOpen = useDayframeStore((s) => s.isThemeModalOpen);
  const closeThemeModal = useDayframeStore((s) => s.closeThemeModal);
  const activeTheme = useDayframeStore((s) => s.activeTheme);
  const isProUnlocked = useDayframeStore((s) => s.isProUnlocked);
  const previewTheme = useDayframeStore((s) => s.previewTheme);
  const previewSecondsRemaining = useDayframeStore((s) => s.previewSecondsRemaining);
  const setTheme = useDayframeStore((s) => s.setTheme);
  const unlockProMock = useDayframeStore((s) => s.unlockProMock);
  const startPreviewTheme = useDayframeStore((s) => s.startPreviewTheme);
  const cancelPreviewTheme = useDayframeStore((s) => s.cancelPreviewTheme);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeThemeModal();
      }
    };
    if (isThemeModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThemeModalOpen, closeThemeModal]);

  const handleSelectTheme = (theme: ThemeDefinition) => {
    if (!theme.isPro || isProUnlocked) {
      setTheme(theme.id);
    } else {
      startPreviewTheme(theme.id);
    }
  };

  const handleUnlockPro = (targetThemeId?: ThemeId) => {
    unlockProMock();
    if (targetThemeId) {
      setTheme(targetThemeId);
    }
  };

  const currentEffectiveThemeId = previewTheme || activeTheme;
  const currentPreviewDef = THEMES.find((t) => t.id === previewTheme);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING LIVE PREVIEW BANNER (Visible whenever a preview is active)   */}
      {/* ========================================================================= */}
      {previewTheme && currentPreviewDef && (
        <aside
          aria-label="Theme live preview banner"
          className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl px-4 py-2.5 rounded-2xl bg-[#0D1117]/95 border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-banner-slide-down"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: currentPreviewDef.colors.primary }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: currentPreviewDef.colors.primary }} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate flex items-center gap-1.5">
                <span>Previewing {currentPreviewDef.name}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono text-slate-300">
                  {previewSecondsRemaining}s left
                </span>
              </p>
              <p className="text-[10.5px] text-slate-400 truncate">
                Unlock Dayframe Pro to keep this aesthetic permanently.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={cancelPreviewTheme}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Revert to original theme"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revert</span>
            </button>
            <button
              onClick={() => handleUnlockPro(previewTheme)}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-black transition-all shadow-md cursor-pointer flex items-center gap-1 active:scale-95"
              style={{
                backgroundColor: currentPreviewDef.colors.primary,
                boxShadow: `0 0 12px ${currentPreviewDef.colors.glow}`,
              }}
            >
              <Crown className="w-3 h-3 fill-black" />
              <span>Unlock ($9)</span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN THEME SELECTOR MODAL DIALOG                                      */}
      {/* ========================================================================= */}
      {isThemeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeThemeModal}
        >
          {/* Modal Container Card */}
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="theme-modal-title" className="text-base font-bold text-white tracking-tight">
                      Dayframe Studio Themes
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>{isProUnlocked ? 'PRO UNLOCKED' : 'PRO TIER'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Switch your focus ambiance instantly or test-drive Pro palettes.
                  </p>
                </div>
              </div>

              <button
                onClick={closeThemeModal}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Theme Cards Grid */}
            <div className="p-5 overflow-y-auto space-y-3 max-h-[calc(85vh-160px)]">
              <div className="grid grid-cols-1 gap-3">
                {THEMES.map((theme) => {
                  const isActive = activeTheme === theme.id && !previewTheme;
                  const isPreviewingThis = previewTheme === theme.id;
                  const isLocked = theme.isPro && !isProUnlocked;

                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme)}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'border-primary ring-1 ring-primary/40 bg-[var(--bg-inset)] shadow-md'
                          : isPreviewingThis
                          ? 'border-amber-400/80 ring-1 ring-amber-400/40 bg-[var(--bg-inset)] shadow-md'
                          : 'border-[var(--border-card)] bg-[var(--bg-inset)]/60 hover:bg-[var(--bg-inset)] hover:border-white/20'
                      }`}
                    >
                      {/* Left: Swatch circles & Theme details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* 3-Color Swatch Preview Circle Trio */}
                        <div className="flex items-center -space-x-1.5 shrink-0 p-1 bg-black/40 rounded-full border border-white/10">
                          <span
                            className="w-5 h-5 rounded-full border border-white/25 shadow-sm transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.colors.canvas }}
                            title="Canvas background"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-white/25 shadow-sm transition-transform group-hover:scale-105"
                            style={{ backgroundColor: theme.colors.card }}
                            title="Cards & Panels"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-white/25 shadow-sm transition-transform group-hover:scale-110"
                            style={{
                              backgroundColor: theme.colors.primary,
                              boxShadow: `0 0 8px ${theme.colors.glow}`,
                            }}
                            title="Primary Accent"
                          />
                        </div>

                        {/* Title & Tagline */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-semibold text-white group-hover:text-primary transition-colors">
                              {theme.name}
                            </h3>

                            {/* Badge */}
                            {!theme.isPro ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                FREE
                              </span>
                            ) : isProUnlocked ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5 text-purple-400" />
                                PRO
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {theme.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/20 text-primary border border-primary/40">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : isPreviewingThis ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                            <Eye className="w-3 h-3" />
                            <span>Previewing ({previewSecondsRemaining}s)</span>
                          </span>
                        ) : isLocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startPreviewTheme(theme.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>Preview (10s)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTheme(theme.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-primary hover:text-black text-white transition-all cursor-pointer active:scale-95"
                          >
                            <span>Select</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer: Pro Unlock Callout & Bottom Actions */}
            <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              {isProUnlocked ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dayframe Pro Active • All themes unlocked forever</span>
                </div>
              ) : (
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Unlock 4 Custom Pro Palettes</span>
                    <span className="text-[10px] font-mono px-1.5 rounded-full bg-amber-400/20 text-amber-300">
                      Lifetime Access
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    One-time purchase, instant activation, offline forever.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {!isProUnlocked ? (
                  <button
                    onClick={() => handleUnlockPro(currentEffectiveThemeId)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 fill-white" />
                    <span>Unlock All Themes ($9 one-time)</span>
                  </button>
                ) : (
                  <button
                    onClick={closeThemeModal}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelectorModal;
