import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventWorld } from '@/types';
import { useTheme } from '@/theme';
import { Badge, PressableScale, Text } from '@/components/ui';

export interface EventWorldCardProps {
  world: EventWorld;
  onPress: () => void;
}

/** An elegant, photo-forward card for each event world in the store. */
export function EventWorldCard({ world, onPress }: EventWorldCardProps) {
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} activeScale={0.97} haptic style={{ marginBottom: theme.spacing.lg }}>
      <View style={[styles.card, theme.shadows.lg, { borderRadius: theme.radius.xxl }]}>
        <Image source={{ uri: world.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', world.gradient[0]]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.top}>
          {world.aiPowered ? <Badge label="AI quests" icon="✨" bg="rgba(255,255,255,0.16)" color="#fff" /> : <View />}
          <Badge label={world.priceLabel} bg="rgba(255,255,255,0.16)" color="#fff" />
        </View>

        <View style={styles.bottom}>
          <Text style={{ fontSize: 34 }}>{world.glyph}</Text>
          <Text variant="title2" color="#fff">
            {world.name}
          </Text>
          <Text variant="subhead" color="rgba(255,255,255,0.78)">
            {world.tagline}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { height: 220, overflow: 'hidden', backgroundColor: '#111', justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  bottom: { padding: 18, gap: 2 },
});
