import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text } from '@/components/ui';
import { EventWorldCard } from '@/features/store/EventWorldCard';
import { EVENT_WORLD_LIST } from '@/data/eventWorlds';

export default function StoreScreen() {
  const router = useRouter();

  return (
    <Screen scroll edges={['top']}>
      <View style={{ paddingTop: 8, paddingBottom: 16 }}>
        <Text variant="largeTitle">Host an event</Text>
        <Text variant="callout" dim style={{ marginTop: 4 }}>
          Pick a world, name your day, and we’ll hand you a code to share. Your guests join in seconds.
        </Text>
      </View>

      {EVENT_WORLD_LIST.map((world) => (
        <EventWorldCard key={world.type} world={world} onPress={() => router.push(`/book/${world.type}`)} />
      ))}

      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text variant="caption" dim align="center" style={{ maxWidth: 280 }}>
          Every event self-destructs 30 days after it’s created. Privacy by design — no public feed, no recovery.
        </Text>
      </View>
    </Screen>
  );
}
