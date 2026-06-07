import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface EmptyStateProps {
  glyph?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({ glyph, title, subtitle, children }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.sm }}>
      {glyph ? <Text style={{ fontSize: 52, marginBottom: theme.spacing.sm }}>{glyph}</Text> : null}
      <Text variant="title3" align="center">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" dim align="center" style={{ maxWidth: 300 }}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: theme.spacing.lg, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}
