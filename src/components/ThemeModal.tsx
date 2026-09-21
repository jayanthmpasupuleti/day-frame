import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Eye,
  Crown,
  Palette,
  ArrowRight,
  Flame,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { ThemeDefinition } from '../types';

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
    id: 'sage-chakra',
    name: 'Sage Chakra',
    tagline: 'Nine-Tails flame orange focus, Rasengan cyan audio accents, and brushed bronze-gold borders.',
    isPro: true,
    isLegendary: true,
    price: '$3.99',
    colors: {
      canvas: '#0B0E11',
      card: '#12171E',
      inset: '#18202A',
      primary: '#FF6B00',
      secondary: '#22C55E',
      glow: 'rgba(255, 107, 0, 0.40)',
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

export const ThemeModal: React.FC = () => {
  const isThemeModalOpen = useDayframeStore((s) => s.isThemeModalOpen);
  const closeThemeModal = useDayframeStore((s) => s.closeThemeModal);
  const activeTheme = useDayframeStore((s) => s.activeTheme);
  const unlockedThemeIds = useDayframeStore((s) => s.unlockedThemeIds || ['midnight-mint']);
  const previewThemeId = useDayframeStore((s) => s.previewThemeId);
  const previewSecondsRemaining = useDayframeStore((s) => s.previewSecondsRemaining);
  const setTheme = useDayframeStore((s) => s.setTheme);
  const previewTheme = useDayframeStore((s) => s.previewTheme);
  const revertPreview = useDayframeStore((s) => s.revertPreview);
  const unlockSageChakra = useDayframeStore((s) => s.unlockSageChakra);

  const [showStudioThemes, setShowStudioThemes] = useState(false);

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

  const isSageUnlocked = unlockedThemeIds.includes('sage-chakra');
  const isSageActive = activeTheme === 'sage-chakra' && !previewThemeId;
  const isSagePreviewing = previewThemeId === 'sage-chakra';

  const isMintActive = activeTheme === 'midnight-mint' && !previewThemeId;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING LIVE PREVIEW BANNER                                           */}
      {/* ========================================================================= */}
      {previewThemeId && (
        <aside
          aria-label="Theme live preview banner"
          className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl px-4 py-2.5 rounded-2xl bg-[#0D1117]/95 border border-amber-500/40 shadow-2xl backdrop-blur-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-banner-slide-down"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate flex items-center gap-1.5">
                <span>
                  {previewThemeId === 'sage-chakra'
                    ? '🔥 Previewing Sage Chakra (Legendary)'
                    : `Previewing ${THEMES.find((t) => t.id === previewThemeId)?.name || 'Theme'}`}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                  {previewSecondsRemaining}s left
                </span>
              </p>
              <p className="text-[10.5px] text-slate-400 truncate">
                Temporary preview • Unlock to keep this aesthetic permanently.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={revertPreview}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              title="Revert to original theme"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Revert</span>
            </button>
            <button
              onClick={() => {
                if (previewThemeId === 'sage-chakra') {
                  unlockSageChakra();
                } else {
                  useDayframeStore.getState().unlockProMock();
                  setTheme(previewThemeId);
                }
              }}
              className="px-3 py-1 rounded-lg text-[11px] font-bold text-black bg-gradient-to-r from-[#FF6B00] to-[#FF8533] shadow-[0_0_12px_rgba(255,107,0,0.4)] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Flame className="w-3 h-3 fill-black text-black" />
              <span>Unlock to Keep ($3.99)</span>
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
          {/* Modal Card Container */}
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200"
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
                      Dayframe Themes
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      <span>Legendary Available</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Switch your daily focus ambiance or preview legendary editions.
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

            {/* Modal Body: Theme Cards */}
            <div className="p-5 overflow-y-auto space-y-3 max-h-[calc(85vh-140px)]">
              {/* Option 1: Midnight Mint (Default / Core) */}
              <div
                onClick={() => setTheme('midnight-mint')}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isMintActive
                    ? 'border-[#00E599] ring-1 ring-[#00E599]/40 bg-[var(--bg-inset)] shadow-md'
                    : 'border-[var(--border-card)] bg-[var(--bg-inset)]/60 hover:bg-[var(--bg-inset)] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Swatches: #0A0D14, #0D1117, #00E599 */}
                  <div className="flex items-center -space-x-1.5 shrink-0 p-1 bg-black/40 rounded-full border border-white/10">
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{ backgroundColor: '#0A0D14' }}
                      title="Canvas (#0A0D14)"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{ backgroundColor: '#0D1117' }}
                      title="Card (#0D1117)"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{
                        backgroundColor: '#00E599',
                        boxShadow: '0 0 8px rgba(0, 229, 153, 0.4)',
                      }}
                      title="Mint Accent (#00E599)"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-white group-hover:text-primary transition-colors">
                        Midnight Mint
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                        Default / Core
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      Deep space obsidian with high-energy neon mint focus accents.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                  {isMintActive ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme('midnight-mint');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-[#00E599] hover:text-black text-white transition-all cursor-pointer active:scale-95"
                    >
                      <span>Apply Theme</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Sage Chakra (Legendary Edition • $3.99) */}
              <div
                onClick={() => {
                  if (isSageUnlocked) {
                    setTheme('sage-chakra');
                  } else {
                    previewTheme('sage-chakra');
                  }
                }}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSageActive
                    ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/40 bg-[#12171E] shadow-[0_0_20px_rgba(255,107,0,0.25)]'
                    : isSagePreviewing
                    ? 'border-amber-400 ring-1 ring-amber-400/50 bg-[#12171E] shadow-lg'
                    : 'border-amber-500/30 bg-[#12171E]/80 hover:bg-[#12171E] hover:border-amber-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Swatches: #0B0E11, #12171E, #FF6B00, #22C55E */}
                  <div className="flex items-center -space-x-1.5 shrink-0 p-1 bg-black/50 rounded-full border border-amber-500/30">
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: '#0B0E11' }}
                      title="Slate Canvas (#0B0E11)"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: '#12171E' }}
                      title="Ninja Obsidian Card (#12171E)"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{
                        backgroundColor: '#FF6B00',
                        boxShadow: '0 0 8px rgba(255, 107, 0, 0.5)',
                      }}
                      title="Nine-Tails Flame (#FF6B00)"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{
                        backgroundColor: '#22C55E',
                        boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)',
                      }}
                      title="Sage Leaf Green (#22C55E)"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-bold text-white group-hover:text-[#FF6B00] transition-colors flex items-center gap-1.5">
                        <span>Sage Chakra</span>
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1 shadow-xs">
                        <Flame className="w-2.5 h-2.5 text-[#FF6B00] fill-[#FF6B00]" />
                        <span>Legendary Tier • $3.99</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      Nine-Tails flame orange focus, Rasengan cyan audio accents, and brushed bronze-gold borders.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                  {isSageActive ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/40">
                      <Check className="w-3 h-3" />
                      <span>Equipped</span>
                    </span>
                  ) : isSagePreviewing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                        <Eye className="w-3 h-3" />
                        <span>Previewing ({previewSecondsRemaining}s)</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockSageChakra();
                        }}
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-black shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                      >
                        Unlock ($3.99)
                      </button>
                    </div>
                  ) : isSageUnlocked ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme('sage-chakra');
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#FF6B00] text-[#0A0D14] hover:brightness-110 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <span>Equip Theme</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          previewTheme('sage-chakra');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>15s Free Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockSageChakra();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#FF6B00] to-[#FF8533] text-black hover:brightness-110 shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Crown className="w-3 h-3 fill-black" />
                        <span>Unlock Theme ($3.99)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Studio Themes Expandable Section (Cyber Tokyo, Nordic Frost, Kyoto Amber, Obsidian Sunset) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudioThemes(!showStudioThemes)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Studio Themes Collection ({THEMES.length - 2} Palettes)</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showStudioThemes ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showStudioThemes && (
                  <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                    {THEMES.filter(
                      (t) => t.id !== 'midnight-mint' && t.id !== 'sage-chakra'
                    ).map((theme) => {
                      const isThisActive = activeTheme === theme.id && !previewThemeId;
                      const isThisPreviewing = previewThemeId === theme.id;
                      const isThisUnlocked = unlockedThemeIds.includes(theme.id);

                      return (
                        <div
                          key={theme.id}
                          onClick={() => {
                            if (isThisUnlocked) {
                              setTheme(theme.id);
                            } else {
                              previewTheme(theme.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isThisActive
                              ? 'border-primary bg-[var(--bg-inset)] shadow-sm'
                              : 'border-[var(--border-card)] bg-[var(--bg-inset)]/40 hover:bg-[var(--bg-inset)] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center -space-x-1.5 shrink-0 p-1 bg-black/40 rounded-full border border-white/10">
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: theme.colors.canvas }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{ backgroundColor: theme.colors.card }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/20"
                                style={{
                                  backgroundColor: theme.colors.primary,
                                  boxShadow: `0 0 6px ${theme.colors.glow}`,
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-white truncate">
                                {theme.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate">
                                {theme.tagline}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 ml-auto">
                            {isThisActive ? (
                              <span className="text-[10.5px] font-bold text-primary flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : isThisPreviewing ? (
                              <span className="text-[10.5px] font-bold text-amber-300 animate-pulse">
                                Previewing ({previewSecondsRemaining}s)
                              </span>
                            ) : isThisUnlocked ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTheme(theme.id);
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-white/10 hover:bg-primary hover:text-primaryText text-white transition-all cursor-pointer"
                              >
                                Equip
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewTheme(theme.id);
                                }}
                                className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                              >
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-sm flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Instant activation • Works 100% offline</span>
              </span>
              <button
                onClick={closeThemeModal}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeModal;
