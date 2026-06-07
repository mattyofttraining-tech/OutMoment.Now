import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type ColorScheme, type Palette } from './colors';
import { typography } from './typography';
import { spacing, radius, motion, shadows } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  motion: typeof motion;
  shadows: typeof shadows;
}

interface ThemeControls {
  /** Override the OS colour scheme. `null` follows the system. */
  setSchemeOverride: (scheme: ColorScheme | null) => void;
  schemeOverride: ColorScheme | null;
  /** Tint the whole UI with an event world's accent colour. */
  setAccent: (accent: string | null) => void;
}

const ThemeContext = createContext<Theme | null>(null);
const ThemeControlsContext = createContext<ThemeControls | null>(null);

function withAccent(palette: Palette, accent: string | null): Palette {
  if (!accent) return palette;
  return {
    ...palette,
    accent,
    accentSoft: hexToRgba(accent, 0.16),
  };
}

/** Convert a #RRGGBB hex into an rgba() string at the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [schemeOverride, setSchemeOverride] = useState<ColorScheme | null>(null);
  const [accent, setAccent] = useState<string | null>(null);

  const scheme: ColorScheme = schemeOverride ?? (systemScheme === 'light' ? 'light' : 'dark');

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: withAccent(palettes[scheme], accent),
      typography,
      spacing,
      radius,
      motion,
      shadows,
    }),
    [scheme, accent],
  );

  const controls = useMemo<ThemeControls>(
    () => ({ setSchemeOverride, schemeOverride, setAccent }),
    [schemeOverride],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeControlsContext.Provider value={controls}>{children}</ThemeControlsContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export function useThemeControls(): ThemeControls {
  const ctx = useContext(ThemeControlsContext);
  if (!ctx) throw new Error('useThemeControls must be used within a ThemeProvider');
  return ctx;
}
