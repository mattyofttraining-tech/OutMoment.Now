import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { OurEvent } from '@/types';
import { useTheme } from '@/theme';
import { Text } from '@/components/ui';
import { CountdownBadge } from '@/components/CountdownBadge';
import { getWorld } from '@/data/eventWorlds';

export interface EventHeroProps {
  event: OurEvent;
  height?: number;
}

/** The cover moment at the top of the active event — cinematic and calm. */
export function EventHero({ event, height = 320 }: EventHeroProps) {
  const theme = useTheme();
  const world = getWorld(event.type);

  return (
    <View style={[styles.wrap, { height, borderRadius: theme.radius.xxl }]}>
      <Image source={{ uri: event.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'transparent', world.gradient[0]]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.top}>
        <CountdownBadge expiresAt={event.expiresAt} />
      </View>

      <View style={styles.bottom}>
        <Text style={{ fontSize: 30 }}>{world.glyph}</Text>
        <Text variant="largeTitle" color="#fff">
          {event.title}
        </Text>
        {event.subtitle ? (
          <Text variant="callout" color="rgba(255,255,255,0.8)">
            {event.subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', justifyContent: 'space-between', backgroundColor: '#111' },
  top: { flexDirection: 'row', justifyContent: 'flex-start', padding: 14 },
  bottom: { padding: 18, gap: 2 },
});
