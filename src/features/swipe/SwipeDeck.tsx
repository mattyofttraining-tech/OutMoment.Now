import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Photo, SwipeDecision } from '@/types';
import { motion } from '@/theme';
import { Text } from '@/components/ui';
import { haptics } from '@/utils/haptics';
import { useTranslation } from '@/i18n/useTranslation';
import { SwipeCard } from './SwipeCard';

export interface SwipeDeckHandle {
  keep: () => void;
  pass: () => void;
}

export interface SwipeDeckProps {
  photos: Photo[];
  onDecision: (photo: Photo, decision: SwipeDecision) => void;
  onIndexChange?: (index: number) => void;
  onEmpty?: () => void;
}

/**
 * The emotional climax: a full-bleed deck where each photo is decided one at a
 * time. Right = keep forever, left = let it go with the rest of the pool.
 * Spring physics + a real haptic on every save. Action buttons drive the same
 * animation via the imperative handle.
 *
 * Card size and swipe thresholds come from the measured container — never the
 * window — so the deck is correct inside the desktop-web frame too.
 */
export const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>(function SwipeDeck(
  { photos, onDecision, onIndexChange, onEmpty },
  ref,
) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const cardW = Math.max(0, box.w - 32);
  const cardH = Math.min(box.h * 0.92, cardW * 1.45);
  const threshold = Math.max(80, box.w * 0.28);
  const flingTo = Math.max(box.w, 600) * 1.5;

  const current = photos[index];
  const next = photos[index + 1];

  const advance = useCallback(
    (decision: SwipeDecision) => {
      const photo = photos[index];
      if (photo) onDecision(photo, decision);
      const nextIndex = index + 1;
      setIndex(nextIndex);
      onIndexChange?.(nextIndex);
      translateX.value = 0;
      translateY.value = 0;
      if (nextIndex >= photos.length) onEmpty?.();
    },
    [index, photos, onDecision, onIndexChange, onEmpty, translateX, translateY],
  );

  const fling = useCallback(
    (decision: SwipeDecision) => {
      if (decision === 'keep') haptics.success();
      else haptics.soft();
      const to = decision === 'keep' ? flingTo : -flingTo;
      translateX.value = withTiming(to, { duration: 240 }, (finished) => {
        if (finished) runOnJS(advance)(decision);
      });
    },
    [advance, translateX, flingTo],
  );

  useImperativeHandle(ref, () => ({
    keep: () => fling('keep'),
    pass: () => fling('pass'),
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.4;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > 800) {
        const decision: SwipeDecision = e.translationX > 0 ? 'keep' : 'pass';
        if (decision === 'keep') runOnJS(haptics.success)();
        else runOnJS(haptics.soft)();
        const to = decision === 'keep' ? flingTo : -flingTo;
        translateX.value = withTiming(to, { duration: 220 }, (finished) => {
          if (finished) runOnJS(advance)(decision);
        });
      } else {
        translateX.value = withSpring(0, motion.spring.gentle);
        translateY.value = withSpring(0, motion.spring.gentle);
      }
    });

  const topCardStyle = useAnimatedStyle(() => {
    const range = Math.max(box.w, 320);
    const rotate = interpolate(translateX.value, [-range, 0, range], [-9, 0, 9]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const keepOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], 'clamp'),
  }));
  const passOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], 'clamp'),
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(translateX.value) / threshold);
    return {
      transform: [{ scale: interpolate(progress, [0, 1], [0.94, 1]) }],
      opacity: interpolate(progress, [0, 1], [0.6, 1]),
    };
  });

  return (
    <View style={styles.container} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {current && cardW > 0 ? (
        <>
          {next ? (
            <Animated.View style={[styles.cardWrap, nextCardStyle]} pointerEvents="none">
              <View style={{ width: cardW, height: cardH }}>
                <SwipeCard photo={next} />
              </View>
            </Animated.View>
          ) : null}

          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.cardWrap, topCardStyle]}>
              <View style={{ width: cardW, height: cardH }}>
                <SwipeCard photo={current} />

                {/* Decision stamps, driven by the same pan value. */}
                <Animated.View style={[styles.stamp, styles.keepStamp, keepOverlay]} pointerEvents="none">
                  <Text variant="title2" weight="700" color="#34C759">
                    {t('stamps.keep')}
                  </Text>
                </Animated.View>
                <Animated.View style={[styles.stamp, styles.passStamp, passOverlay]} pointerEvents="none">
                  <Text variant="title2" weight="700" color="#FF453A">
                    {t('stamps.letGo')}
                  </Text>
                </Animated.View>
              </View>
            </Animated.View>
          </GestureDetector>
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
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
