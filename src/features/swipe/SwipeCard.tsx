import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Photo } from '@/types';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui';
import { relativeTime } from '@/utils/time';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const CARD_H = Math.min(SCREEN_H * 0.66, CARD_W * 1.45);

export interface SwipeCardProps {
  photo: Photo;
  keepOverlayStyle?: AnimatedStyle;
  passOverlayStyle?: AnimatedStyle;
}

export function SwipeCard({ photo, keepOverlayStyle, passOverlayStyle }: SwipeCardProps) {
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

      {/* KEEP stamp */}
      {keepOverlayStyle ? (
        <Animated.View style={[styles.stamp, styles.keepStamp, keepOverlayStyle]} pointerEvents="none">
          <Text variant="title2" weight="700" color={theme.colors.keep}>
            KEEP
          </Text>
        </Animated.View>
      ) : null}

      {/* SKIP stamp */}
      {passOverlayStyle ? (
        <Animated.View style={[styles.stamp, styles.passStamp, passOverlayStyle]} pointerEvents="none">
          <Text variant="title2" weight="700" color={theme.colors.pass}>
            LET GO
          </Text>
        </Animated.View>
      ) : null}
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
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
  },
  keepStamp: {
    right: 24,
    transform: [{ rotate: '12deg' }],
    borderColor: '#34C759',
    backgroundColor: 'rgba(52,199,89,0.12)',
  },
  passStamp: {
    left: 24,
    transform: [{ rotate: '-12deg' }],
    borderColor: '#FF453A',
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
});
