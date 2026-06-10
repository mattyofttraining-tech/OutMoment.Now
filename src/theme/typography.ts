import { TextStyle } from 'react-native';

/**
 * Typography scale modelled on Apple's Human Interface guidelines. The actual
 * family is Inter on every platform (see `utils/fonts.ts`), so the app and the
 * PWA set type identically; this file only defines sizes, weights and rhythm.
 */

const systemFont = undefined; // family resolved per-weight in utils/fonts.ts
const display = undefined;

type Variant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption'
  | 'overline';

export const typography: Record<Variant, TextStyle> = {
  largeTitle: {
    fontFamily: display,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: 0.36,
  },
  title1: {
    fontFamily: display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: 0.34,
  },
  title2: {
    fontFamily: systemFont,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title3: {
    fontFamily: systemFont,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headline: {
    fontFamily: systemFont,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: systemFont,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  callout: {
    fontFamily: systemFont,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  subhead: {
    fontFamily: systemFont,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  footnote: {
    fontFamily: systemFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  caption: {
    fontFamily: systemFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  overline: {
    fontFamily: systemFont,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};

export type TypographyVariant = Variant;
