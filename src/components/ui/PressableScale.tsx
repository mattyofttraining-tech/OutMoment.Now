import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { motion } from '@/theme';
import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends PressableProps {
  /** Scale to shrink to while pressed. */
  activeScale?: number;
  /** Fire a light selection haptic on press-in. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A pressable that springs down on touch — the tactile foundation for every
 * tappable surface in the app. On web it also breathes up slightly on hover,
 * so the PWA feels as alive under a cursor as the app does under a thumb.
 */
export function PressableScale({
  activeScale = 0.96,
  haptic = false,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withSpring(activeScale, motion.spring.snappy);
        if (haptic) haptics.selection();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, motion.spring.snappy);
        onPressOut?.(e);
      }}
      onHoverIn={(e) => {
        scale.value = withSpring(1.02, motion.spring.gentle);
        onHoverIn?.(e);
      }}
      onHoverOut={(e) => {
        scale.value = withSpring(1, motion.spring.gentle);
        onHoverOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
