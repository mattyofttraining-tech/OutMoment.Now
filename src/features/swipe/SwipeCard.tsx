import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Photo } from '@/types';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui';
import { relativeTime } from '@/utils/time';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
export const CARD_W = SCREEN_W - 32;
export const CARD_H = Math.min(SCREEN_H * 0.66, CARD_W * 1.45);

export interface SwipeCardProps {
  photo: Photo;
}

/** The photo surface for the swipe deck. Decision stamps are overlaid by the deck. */
export function SwipeCard({ photo }: SwipeCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, theme.shadows.xl, { borderRadius: theme.radius.xxl }]}>
      <Image
        source={{ uri: photo.url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
      />

      {/* Bottom gradient for legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.meta} pointerEvents="none">
        <Text variant="headline" color="#FFFFFF">
          {photo.uploaderName}
        </Text>
        <Text variant="footnote" color="rgba(255,255,255,0.7)">
          {photo.caption ? `${photo.caption} · ` : ''}
          {relativeTime(photo.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 },
  meta: { position: 'absolute', left: 20, bottom: 20, right: 20 },
});
