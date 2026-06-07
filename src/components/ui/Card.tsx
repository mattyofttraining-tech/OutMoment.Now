import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padded?: boolean;
}

/** A soft, borderless surface — depth via subtle fill + shadow, not lines. */
export function Card({ children, style, elevated = false, padded = true }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderRadius: theme.radius.xl,
          padding: padded ? theme.spacing.lg : 0,
        },
        elevated ? theme.shadows.md : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
