import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, EmptyState, IconButton, PressableScale, Screen, Text } from '@/components/ui';
import { CountdownBadge } from '@/components/CountdownBadge';
import { useAppStore } from '@/store/useAppStore';
import { getWorld } from '@/data/eventWorlds';

export default function EventsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const myEvents = useAppStore((s) => s.myEvents);
  const activeEventId = useAppStore((s) => s.activeEventId);
  const setActiveEvent = useAppStore((s) => s.setActiveEvent);

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text variant="title1">Your events</Text>
        <IconButton name="close" surface onPress={() => router.back()} />
      </View>

      {myEvents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState glyph="✨" title="No events yet" subtitle="Join one with a code, or host your own." />
        </View>
      ) : (
        <View style={{ gap: 12, marginTop: 8 }}>
          {myEvents.map((event) => {
            const world = getWorld(event.type);
            const active = event.id === activeEventId;
            return (
              <PressableScale
                key={event.id}
                haptic
                activeScale={0.98}
                onPress={() => {
                  setActiveEvent(event.id);
                  router.back();
                }}
              >
                <View style={[styles.row, { borderRadius: theme.radius.xl, borderColor: active ? world.accent : 'transparent' }]}>
                  <Image source={{ uri: event.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                  <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 24 }}>{world.glyph}</Text>
                      {active ? <Ionicons name="checkmark-circle" size={24} color="#fff" /> : null}
                    </View>
                    <View>
                      <Text variant="title3" color="#fff">
                        {event.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <CountdownBadge expiresAt={event.expiresAt} />
                        <Text variant="caption" color="rgba(255,255,255,0.7)">
                          {event.photoCount} photos
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </View>
      )}

      <View style={{ gap: 10, marginTop: 24 }}>
        <Button label="Join with a code" variant="secondary" onPress={() => { router.back(); router.push('/join'); }} />
        <Button label="Host an event" variant="ghost" onPress={() => { router.back(); router.push('/(tabs)/store'); }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 8 },
  row: { height: 130, overflow: 'hidden', backgroundColor: '#111', borderWidth: 2 },
});
