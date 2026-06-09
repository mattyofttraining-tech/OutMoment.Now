import React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme, type TypographyVariant } from '@/theme';
import { resolveFont } from '@/utils/fonts';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: keyof ReturnType<typeof useTheme>['colors'] | (string & {});
  align?: TextStyle['textAlign'];
  /** Override the variant's weight. */
  weight?: TextStyle['fontWeight'];
  dim?: boolean;
}

/**
 * The single text primitive. Applies a typography variant, theme colour and the
 * platform-correct font family/weight so the whole app reads in one voice.
 */
export function Text({
  variant = 'body',
  color,
  align,
  weight,
  dim,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const variantStyle = theme.typography[variant];
  const resolvedWeight = weight ?? variantStyle.fontWeight;

  const resolvedColor =
    (color && color in theme.colors
      ? theme.colors[color as keyof typeof theme.colors]
      : (color as string)) ??
    (dim ? theme.colors.textSecondary : theme.colors.text);

  // When a caller overrides fontSize (e.g. emoji glyphs at fontSize 56) without
  // a matching lineHeight, the variant's small lineHeight clips the tall glyph.
  // Give it room so emojis and oversized text are never cut off.
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const emojiSafeLineHeight =
    flat && typeof flat.fontSize === 'number' && flat.lineHeight === undefined
      ? { lineHeight: Math.ceil(flat.fontSize * 1.3) }
      : null;

  return (
    <RNText
      {...rest}
      style={[
        variantStyle,
        resolveFont(resolvedWeight),
        { color: resolvedColor as string },
        align ? { textAlign: align } : null,
        style,
        emojiSafeLineHeight,
      ]}
    />
  );
}
