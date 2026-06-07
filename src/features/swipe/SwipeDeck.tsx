import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
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
import { haptics } from '@/utils/haptics';
import { SwipeCard } from './SwipeCard';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

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
 */
export const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>(function SwipeDeck(
  { photos, onDecision, onIndexChange, onEmpty },
  ref,
) {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

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
      const to = decision === 'keep' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
      translateX.value = withTiming(to, { duration: 240 }, (finished) => {
        if (finished) runOnJS(advance)(decision);
      });
    },
    [advance, translateX],
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
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 800) {
        const decision: SwipeDecision = e.translationX > 0 ? 'keep' : 'pass';
        if (decision === 'keep') runOnJS(haptics.success)();
        else runOnJS(haptics.soft)();
        const to = decision === 'keep' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
        translateX.value = withTiming(to, { duration: 220 }, (finished) => {
          if (finished) runOnJS(advance)(decision);
        });
      } else {
        translateX.value = withSpring(0, motion.spring.gentle);
        translateY.value = withSpring(0, motion.spring.gentle);
      }
    });

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_W, 0, SCREEN_W], [-9, 0, 9]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const keepOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const passOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.abs(translateX.value) / SWIPE_THRESHOLD);
    return {
      transform: [{ scale: interpolate(progress, [0, 1], [0.94, 1]) }],
      opacity: interpolate(progress, [0, 1], [0.6, 1]),
    };
  });

  if (!current) return null;

  return (
    <View style={styles.container}>
      {next ? (
        <Animated.View style={[styles.cardWrap, nextCardStyle]} pointerEvents="none">
          <SwipeCard photo={next} />
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, topCardStyle]}>
          <SwipeCard photo={current} keepOverlayStyle={keepOverlay} passOverlayStyle={passOverlay} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export { SWIPE_THRESHOLD };

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
