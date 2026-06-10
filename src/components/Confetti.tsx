import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Brand palette first (periwinkle/terracotta/peach), then celebration tones.
const COLORS = ['#717DAD', '#A3564A', '#EC8D65', '#C9A227', '#FF6B9D', '#5BB8C4', '#34C759'];

interface Piece {
  x: number; // 0..1, fraction of container width
  size: number;
  color: string;
  delay: number;
  drift: number;
  rotateTo: number;
  duration: number;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }).map(() => ({
    x: Math.random(),
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
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => makePieces(count), [count]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} originY={originY} width={width} height={height} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  piece,
  originY,
  width,
  height,
}: {
  piece: Piece;
  originY: number;
  width: number;
  height: number;
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) }),
    );
  }, [piece, progress]);

  const style = useAnimatedStyle(() => {
    const fallTo = height * 0.85;
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
          left: piece.x * width,
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
