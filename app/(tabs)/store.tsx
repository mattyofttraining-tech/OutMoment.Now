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
        <Text variant="largeTitle">Don’t let the day disappear</Text>
        <Text variant="callout" dim style={{ marginTop: 4 }}>
          Pick your moment, share one code, and turn every guest into your photographer. Hundreds of photos you’d never have seen — for less than the cost of a single print.
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
