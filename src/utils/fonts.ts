import { type TextStyle } from 'react-native';

/**
 * Font resolution. Inter everywhere — iOS, Android and web — so the native app
 * and the PWA render type pixel-identically. Each weight maps to its dedicated
 * Inter family (custom fonts don't honour `fontWeight`).
 */

export const interFontMap = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
} as const;

type Weight = keyof typeof interFontMap;

function normalizeWeight(weight: TextStyle['fontWeight']): Weight {
  switch (weight) {
    case '700':
    case 'bold':
    case '800':
    case '900':
      return '700';
    case '600':
      return '600';
    case '500':
      return '500';
    default:
      return '400';
  }
}

/**
 * Returns the style overrides needed to render a given weight with the right
 * font on the current platform.
 */
export function resolveFont(weight: TextStyle['fontWeight']): TextStyle {
  return { fontFamily: interFontMap[normalizeWeight(weight)] };
}
