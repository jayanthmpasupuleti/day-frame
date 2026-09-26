import React from 'react';
import {
  Sparkles,
  Check,
  Eye,
  Crown,
  Palette,
  ArrowRight,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { ThemeId } from '../types';
import {
  PlasmaCard,
  PlasmaBadge,
  PlasmaButton,
  PlasmaDialog,
  PLASMA_THEMES,
} from './plasma';

export const THEMES = Object.values(PLASMA_THEMES);

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

  const previewingConfig = previewThemeId ? PLASMA_THEMES[previewThemeId] : null;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING LIVE PREVIEW BANNER                                           */}
      {/* ========================================================================= */}
      {previewThemeId && previewingConfig && (
        <aside
          aria-label="Theme live preview banner"
          className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl animate-banner-slide-down"
        >
          <PlasmaCard
            elevation={0.7}
            radius={20}
            className="p-3 shadow-2xl backdrop-blur-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-[var(--accent-primary)]/50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent-primary)] shadow-[0_0_8px_var(--glow-primary)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-white truncate flex items-center gap-1.5">
                  <span>
                    {previewThemeId === 'sage-chakra'
                      ? '🔥 Previewing Sage Chakra (Legendary)'
                      : `Previewing ${previewingConfig.name}`}
                  </span>
                  <PlasmaBadge variant="warning" size="sm" mono>
                    {previewSecondsRemaining}s left
                  </PlasmaBadge>
                </p>
                <p className="text-[10.5px] text-slate-400 truncate">
                  Temporary preview • Unlock to keep this aesthetic permanently.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <PlasmaButton
                variant="ghost"
                size="sm"
                onClick={revertPreview}
                title="Revert to original theme"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                <span>Revert</span>
              </PlasmaButton>

              <PlasmaButton
                variant="primary"
                size="sm"
                onClick={() => {
                  if (previewThemeId === 'sage-chakra') {
                    unlockSageChakra();
                  } else {
                    useDayframeStore.getState().unlockProMock();
                    setTheme(previewThemeId);
                  }
                }}
              >
                <Flame className="w-3 h-3 mr-1" />
                <span>Unlock to Keep ({previewingConfig.price || '$3.99'})</span>
              </PlasmaButton>
            </div>
          </PlasmaCard>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN THEME SELECTOR MODAL DIALOG USING PLASMADIALOG                    */}
      {/* ========================================================================= */}
      <PlasmaDialog
        isOpen={isThemeModalOpen}
        onClose={closeThemeModal}
        title="Dayframe Ambiance & Themes"
        description="Liquid WebGL materials, refraction shaders, and custom focus aesthetics."
        icon={<Palette className="w-4 h-4 text-primary" />}
        maxWidth="max-w-2xl"
      >
        <div className="p-5 overflow-y-auto space-y-3 max-h-[calc(85vh-140px)]">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id && !previewThemeId;
            const isPreviewing = previewThemeId === theme.id;
            const isUnlocked = unlockedThemeIds.includes(theme.id);

            return (
              <PlasmaCard
                key={theme.id}
                elevation={isActive ? 0.45 : isPreviewing ? 0.35 : 0.15}
                radius={16}
                active={isActive}
                className={`p-3.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                  isPreviewing ? 'ring-1 ring-amber-400/60 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Swatches: Canvas, Card, Accent */}
                  <div className="flex items-center -space-x-1.5 shrink-0 p-1 bg-black/40 rounded-full border border-white/10">
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{ backgroundColor: theme.bgCanvas }}
                      title={`Canvas (${theme.bgCanvas})`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{ backgroundColor: theme.bgCard }}
                      title={`Card (${theme.bgCard})`}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/25 shadow-sm"
                      style={{
                        backgroundColor: theme.accentColor,
                        boxShadow: `0 0 8px ${theme.tint}`,
                      }}
                      title={`Accent (${theme.accentColor})`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                        <span>{theme.name}</span>
                      </h3>

                      {/* Badges for Mood and Material */}
                      <PlasmaBadge variant="outline" size="sm" mono>
                        {theme.moodName}
                      </PlasmaBadge>
                      <PlasmaBadge variant="muted" size="sm" mono>
                        {theme.material}
                      </PlasmaBadge>

                      {theme.isLegendary ? (
                        <PlasmaBadge variant="warning" size="sm" mono className="gap-1">
                          <Flame className="w-2.5 h-2.5 text-[#FF6B00] fill-[#FF6B00]" />
                          <span>Legendary • {theme.price || '$3.99'}</span>
                        </PlasmaBadge>
                      ) : theme.isPro ? (
                        <PlasmaBadge variant="accent" size="sm" mono>
                          Pro • {theme.price || '$12'}
                        </PlasmaBadge>
                      ) : (
                        <PlasmaBadge variant="success" size="sm" mono>
                          Core
                        </PlasmaBadge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {theme.tagline}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                  {isActive ? (
                    <PlasmaBadge variant="primary" size="md">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </PlasmaBadge>
                  ) : isPreviewing ? (
                    <div className="flex items-center gap-1.5">
                      <PlasmaBadge variant="warning" size="md" className="animate-pulse">
                        <Eye className="w-3 h-3" />
                        <span>Previewing ({previewSecondsRemaining}s)</span>
                      </PlasmaBadge>
                      <PlasmaButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (theme.id === 'sage-chakra') {
                            unlockSageChakra();
                          } else {
                            useDayframeStore.getState().unlockProMock();
                            setTheme(theme.id);
                          }
                        }}
                      >
                        Unlock
                      </PlasmaButton>
                    </div>
                  ) : isUnlocked ? (
                    <PlasmaButton
                      variant="primary"
                      size="sm"
                      onClick={() => setTheme(theme.id as ThemeId)}
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </PlasmaButton>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <PlasmaButton
                        variant="subtle"
                        size="sm"
                        onClick={() => previewTheme(theme.id as ThemeId)}
                      >
                        <Eye className="w-3 h-3 mr-1 text-amber-400" />
                        <span>15s Preview</span>
                      </PlasmaButton>
                      <PlasmaButton
                        variant="warning"
                        size="sm"
                        onClick={() => {
                          if (theme.id === 'sage-chakra') {
                            unlockSageChakra();
                          } else {
                            useDayframeStore.getState().unlockProMock();
                            setTheme(theme.id as ThemeId);
                          }
                        }}
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        <span>Unlock</span>
                      </PlasmaButton>
                    </div>
                  )}
                </div>
              </PlasmaCard>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-sm flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Instant WebGL activation • Works 100% offline</span>
          </span>
          <PlasmaButton
            variant="ghost"
            size="md"
            onClick={closeThemeModal}
          >
            Close
          </PlasmaButton>
        </div>
      </PlasmaDialog>
    </>
  );
};

export default ThemeModal;
