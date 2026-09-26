import type { Mood, MoodName, MaterialName } from '@cruxgarden/plasma-ui';
import { moods } from '@cruxgarden/plasma-ui';
import type { ThemeId } from '../../types';

export interface PlasmaThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  moodName: MoodName | 'custom';
  mood: MoodName | Mood;
  material: MaterialName;
  tint: string;
  opacity: number;
  frost: number;
  elevation: number;
  rimColor: string;
  accentColor: string;
  accentTextColor: string;
  bgCanvas: string;
  bgCard: string;
  bgInset: string;
  borderCard: string;
  isPro?: boolean;
  isLegendary?: boolean;
  price?: string;
}

export const PLASMA_THEMES: Record<ThemeId, PlasmaThemeConfig> = {
  'midnight-mint': {
    id: 'midnight-mint',
    name: 'Midnight Mint',
    tagline: 'Deep obsidian slate with iridescent mint plasma glass',
    moodName: 'aurora',
    mood: moods.aurora,
    material: 'plasma',
    tint: '#00E599',
    opacity: 0.12,
    frost: 0.35,
    elevation: 0.35,
    rimColor: '#00E599',
    accentColor: '#00E599',
    accentTextColor: '#000000',
    bgCanvas: '#0A0D14',
    bgCard: '#0D1117',
    bgInset: '#161B22',
    borderCard: 'rgba(255, 255, 255, 0.08)',
    isPro: false,
  },
  'sage-chakra': {
    id: 'sage-chakra',
    name: 'Sage Chakra',
    tagline: 'Legendary Nine-Tails flame crystal with brushed bronze hairlines',
    moodName: 'ember',
    mood: {
      colors: ['#0B0E11', '#241408', '#FF6B00'],
      blend: 36,
      spring: { stiffness: 180, damping: 14 },
    },
    material: 'crystal',
    tint: '#FF6B00',
    opacity: 0.16,
    frost: 0.5,
    elevation: 0.55,
    rimColor: '#FF6B00',
    accentColor: '#FF6B00',
    accentTextColor: '#0A0D14',
    bgCanvas: '#0B0E11',
    bgCard: '#12171E',
    bgInset: '#18202A',
    borderCard: 'rgba(234, 179, 8, 0.22)',
    isPro: true,
    isLegendary: true,
    price: '$29 / Lifetime',
  },
  'cyber-tokyo': {
    id: 'cyber-tokyo',
    name: 'Cyber Tokyo',
    tagline: 'High-contrast neon fuchsia & cyan synthwave refraction',
    moodName: 'custom',
    mood: {
      colors: ['#05020A', '#1C0626', '#FF007A'],
      blend: 32,
      spring: { stiffness: 200, damping: 12 },
    },
    material: 'plasma',
    tint: '#FF007A',
    opacity: 0.14,
    frost: 0.45,
    elevation: 0.45,
    rimColor: '#00F0FF',
    accentColor: '#FF007A',
    accentTextColor: '#FFFFFF',
    bgCanvas: '#05020A',
    bgCard: '#0B0614',
    bgInset: '#140A22',
    borderCard: 'rgba(255, 0, 122, 0.24)',
    isPro: true,
    price: '$12 / Lifetime',
  },
  'nordic-frost': {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    tagline: 'Crystalline Arctic ice with deep glacial cyan highlights',
    moodName: 'tidal',
    mood: moods.tidal,
    material: 'crystal',
    tint: '#38BDF8',
    opacity: 0.12,
    frost: 0.6,
    elevation: 0.4,
    rimColor: '#38BDF8',
    accentColor: '#38BDF8',
    accentTextColor: '#000000',
    bgCanvas: '#0A1018',
    bgCard: '#101824',
    bgInset: '#172233',
    borderCard: 'rgba(56, 189, 248, 0.20)',
    isPro: true,
    price: '$12 / Lifetime',
  },
  'kyoto-amber': {
    id: 'kyoto-amber',
    name: 'Kyoto Amber',
    tagline: 'Earthy tatami warmth, golden amber resin & organic stone',
    moodName: 'custom',
    mood: {
      colors: ['#0E0B07', '#261C10', '#F59E0B'],
      blend: 28,
      spring: { stiffness: 140, damping: 16 },
    },
    material: 'wood',
    tint: '#F59E0B',
    opacity: 0.12,
    frost: 0.35,
    elevation: 0.35,
    rimColor: '#F59E0B',
    accentColor: '#F59E0B',
    accentTextColor: '#000000',
    bgCanvas: '#0E0B07',
    bgCard: '#17120C',
    bgInset: '#221B12',
    borderCard: 'rgba(245, 158, 11, 0.20)',
    isPro: true,
    price: '$12 / Lifetime',
  },
  'obsidian-sunset': {
    id: 'obsidian-sunset',
    name: 'Obsidian Sunset',
    tagline: 'Smoky volcanic stone with radiant twilight amethyst glow',
    moodName: 'custom',
    mood: {
      colors: ['#0C0814', '#241238', '#A855F7'],
      blend: 30,
      spring: { stiffness: 160, damping: 15 },
    },
    material: 'stone',
    tint: '#A855F7',
    opacity: 0.13,
    frost: 0.45,
    elevation: 0.4,
    rimColor: '#FB7185',
    accentColor: '#A855F7',
    accentTextColor: '#FFFFFF',
    bgCanvas: '#0C0814',
    bgCard: '#150E22',
    bgInset: '#1F1433',
    borderCard: 'rgba(168, 85, 247, 0.22)',
    isPro: true,
    price: '$12 / Lifetime',
  },
};

/**
 * Apply Plasma theme CSS tokens to document root so HTML elements and controls
 * seamlessly share the Plasma palette.
 */
export function applyPlasmaThemeToDom(config: PlasmaThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.setAttribute('data-theme', config.id);
  root.setAttribute('data-plasma-mood', String(config.moodName));
  root.setAttribute('data-plasma-material', config.material);

  root.style.setProperty('--bg-canvas', config.bgCanvas);
  root.style.setProperty('--bg-card', config.bgCard);
  root.style.setProperty('--bg-inset', config.bgInset);
  root.style.setProperty('--border-card', config.borderCard);
  root.style.setProperty('--accent-primary', config.accentColor);
  root.style.setProperty('--accent-primary-text', config.accentTextColor);
  root.style.setProperty('--accent-secondary', config.rimColor);
  root.style.setProperty('--plasma-tint', config.tint);
  root.style.setProperty('--plasma-rim', config.rimColor);
  root.style.setProperty('--plasma-rim-glow', `color-mix(in srgb, ${config.rimColor} 35%, transparent)`);
  root.style.setProperty('--glow-secondary', `color-mix(in srgb, ${config.rimColor} 40%, transparent)`);
}
