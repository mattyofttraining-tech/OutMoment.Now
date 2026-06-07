/**
 * Spacing, radii, shadow and motion tokens.
 * A consistent 4-point spacing grid keeps every screen feeling deliberate.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const motion = {
  /** Snappy, for taps. */
  fast: 180,
  /** Default UI transitions. */
  base: 280,
  /** Expressive, for sheets and hero moments. */
  slow: 480,
  /** Reanimated spring presets. */
  spring: {
    gentle: { damping: 18, stiffness: 160, mass: 1 },
    bouncy: { damping: 12, stiffness: 180, mass: 0.9 },
    snappy: { damping: 22, stiffness: 320, mass: 0.8 },
  },
} as const;

export interface Shadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows: Record<'sm' | 'md' | 'lg' | 'xl', Shadow> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 40,
    elevation: 20,
  },
};
