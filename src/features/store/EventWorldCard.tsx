import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { EventWorld } from '@/types';
import { motion, useTheme } from '@/theme';
import { Badge, PressableScale, Text } from '@/components/ui';
import { deviceCurrency, formatPrice, priceFor } from '@/data/pricing';
import { useTranslation } from '@/i18n/useTranslation';

export interface EventWorldCardProps {
  world: EventWorld;
  onPress: () => void;
}

/**
 * An elegant, photo-forward card for each event world in the store. A gentle
 * 3D tilt on hover/press gives the cards physical depth without shouting.
 */
export function EventWorldCard({ world, onPress }: EventWorldCardProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const currency = React.useMemo(deviceCurrency, []);
  const tilt = useSharedValue(0);

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tilt.value * 2.4}deg` },
      { rotateY: `${tilt.value * -1.6}deg` },
    ],
  }));

  return (
    <PressableScale
      onPress={onPress}
      activeScale={0.97}
      haptic
      style={{ marginBottom: theme.spacing.lg }}
      onHoverIn={() => (tilt.value = withSpring(1, motion.spring.gentle))}
      onHoverOut={() => (tilt.value = withSpring(0, motion.spring.gentle))}
      onPressIn={() => (tilt.value = withSpring(1, motion.spring.snappy))}
      onPressOut={() => (tilt.value = withSpring(0, motion.spring.gentle))}
    >
      <Animated.View style={[styles.card, theme.shadows.lg, { borderRadius: theme.radius.xxl }, tiltStyle]}>
        <Image source={{ uri: world.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', world.gradient[0]]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.top}>
          {world.aiPowered ? <Badge label={t('worlds.aiBadge')} icon="✨" bg="rgba(255,255,255,0.16)" color="#fff" /> : <View />}
          <Badge
            label={t('pricing.from', { price: formatPrice(priceFor(world.type, 'intimate', currency), currency, locale) })}
            bg="rgba(255,255,255,0.16)"
            color="#fff"
          />
        </View>

        <View style={styles.bottom}>
          <Text style={{ fontSize: 34 }}>{world.glyph}</Text>
          <Text variant="title2" color="#fff">
            {t(`worlds.${world.type}.name`)}
          </Text>
          <Text variant="subhead" color="rgba(255,255,255,0.78)">
            {t(`worlds.${world.type}.tagline`)}
          </Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { height: 220, overflow: 'hidden', backgroundColor: '#111', justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  bottom: { padding: 18, gap: 2 },
});
