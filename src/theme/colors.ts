/**
 * OurMoment colour system.
 *
 * Philosophy: a calm, near-black canvas that lets photographs and the
 * per-event accent colour carry the emotion. Two full palettes (dark + light)
 * with matching semantic tokens, plus a dedicated accent per event world.
 */

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  /** App background, furthest back. */
  background: string;
  /** Slightly raised surface (cards, sheets). */
  surface: string;
  /** Surface raised above `surface` (modals, popovers). */
  surfaceElevated: string;
  /** Hairline borders / separators. */
  border: string;
  /** Translucent fill for glass / blur overlays. */
  glass: string;

  /** Primary text. */
  text: string;
  /** Secondary text. */
  textSecondary: string;
  /** Tertiary / disabled text. */
  textTertiary: string;
  /** Text that sits on top of an accent fill. */
  onAccent: string;

  /** The current event accent (overridden per event world at runtime). */
  accent: string;
  accentSoft: string;

  /** Feedback. */
  success: string;
  warning: string;
  danger: string;

  /** Swipe affordances. */
  keep: string;
  pass: string;

  /** Pure tones. */
  white: string;
  black: string;
}

const dark: Palette = {
  background: '#0B0B0F',
  surface: '#15151C',
  surfaceElevated: '#1F1F29',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(20,20,28,0.6)',

  text: '#F5F5F7',
  textSecondary: 'rgba(245,245,247,0.62)',
  textTertiary: 'rgba(245,245,247,0.38)',
  onAccent: '#FFFFFF',

  accent: '#C9A227', // overridden per event
  accentSoft: 'rgba(201,162,39,0.16)',

  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF453A',

  keep: '#34C759',
  pass: '#FF453A',

  white: '#FFFFFF',
  black: '#000000',
};

const light: Palette = {
  background: '#FBFBFD',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(255,255,255,0.6)',

  text: '#1A1A1F',
  textSecondary: 'rgba(26,26,31,0.6)',
  textTertiary: 'rgba(26,26,31,0.36)',
  onAccent: '#FFFFFF',

  accent: '#C9A227',
  accentSoft: 'rgba(201,162,39,0.14)',

  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',

  keep: '#30B350',
  pass: '#FF3B30',

  white: '#FFFFFF',
  black: '#000000',
};

export const palettes: Record<ColorScheme, Palette> = { dark, light };
