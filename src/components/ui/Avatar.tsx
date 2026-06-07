import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
}

const FALLBACK_COLORS = ['#C9A227', '#FF6B9D', '#6C7BD6', '#5BB8C4', '#9B6BFF', '#34C759'];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]!;
}

export function Avatar({ name, color, size = 36 }: AvatarProps) {
  const bg = color ?? colorFor(name);
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="footnote" weight="700" color="#FFFFFF" style={{ fontSize: size * 0.36 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
