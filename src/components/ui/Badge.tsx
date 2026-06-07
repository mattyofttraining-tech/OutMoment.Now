import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  icon?: string;
  style?: ViewStyle;
}

export function Badge({ label, color, bg, icon, style }: BadgeProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: 5,
          borderRadius: theme.radius.pill,
          backgroundColor: bg ?? theme.colors.accentSoft,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon ? <Text variant="caption">{icon}</Text> : null}
      <Text variant="caption" weight="600" color={color ?? theme.colors.accent}>
        {label}
      </Text>
    </View>
  );
}
