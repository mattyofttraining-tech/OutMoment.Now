import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const COLORS = ['#C9A227', '#FF6B9D', '#6C7BD6', '#5BB8C4', '#9B6BFF', '#34C759', '#FF9F0A'];

interface Piece {
  x: number;
  size: number;
  color: string;
  delay: number;
  drift: number;
  rotateTo: number;
  duration: number;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }).map(() => ({
    x: Math.random() * SCREEN_W,
    size: 7 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    delay: Math.random() * 250,
    drift: (Math.random() - 0.5) * 160,
    rotateTo: (Math.random() - 0.5) * 720,
    duration: 1600 + Math.random() * 900,
  }));
}

/**
 * A lightweight, dependency-free confetti burst (pure Reanimated). Drops a spray
 * of colourful pieces from the top, then fades. Mount it when something worth
 * celebrating happens — a completed quest, a finished save session.
 */
export function Confetti({ count = 28, originY = -40 }: { count?: number; originY?: number }) {
  const pieces = useMemo(() => makePieces(count), [count]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} originY={originY} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, originY }: { piece: Piece; originY: number }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [piece, progress]);

  const style = useAnimatedStyle(() => {
    const fallTo = SCREEN_H * 0.85;
    return {
      transform: [
        { translateY: originY + progress.value * fallTo },
        { translateX: progress.value * piece.drift },
        { rotate: `${progress.value * piece.rotateTo}deg` },
      ],
      opacity: progress.value < 0.7 ? 1 : 1 - (progress.value - 0.7) / 0.3,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: piece.x,
          top: 0,
          width: piece.size,
          height: piece.size * 0.6,
          borderRadius: 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}
