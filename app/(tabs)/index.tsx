import React, { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeControls } from '@/theme';
import { Button, Card, EmptyState, IconButton, PressableScale, ProgressRing, Text } from '@/components/ui';
import { EventHero } from '@/features/event/EventHero';
import { QuestCard } from '@/features/quests/QuestCard';
import { useAppStore } from '@/store/useAppStore';
import { getWorld } from '@/data/eventWorlds';
import { getCountdown, isUrgent } from '@/utils/time';

export default function MomentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setAccent } = useThemeControls();

  const uid = useAppStore((s) => s.uid);
  const activeEventId = useAppStore((s) => s.activeEventId);
  const myEvents = useAppStore((s) => s.myEvents);
  const questsByEvent = useAppStore((s) => s.questsByEvent);
  const photosByEvent = useAppStore((s) => s.photosByEvent);
  const loadEventDetail = useAppStore((s) => s.loadEventDetail);
  const subscribeToPhotos = useAppStore((s) => s.subscribeToPhotos);

  const event = useMemo(
    () => myEvents.find((e) => e.id === activeEventId),
    [myEvents, activeEventId],
  );

  useEffect(() => {
    if (!activeEventId) return;
    loadEventDetail(activeEventId).catch(() => {});
    const unsub = subscribeToPhotos(activeEventId);
    return unsub;
  }, [activeEventId, loadEventDetail, subscribeToPhotos]);

  useEffect(() => {
    if (event) setAccent(getWorld(event.type).accent);
    return () => setAccent(null);
  }, [event, setAccent]);

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
        <EmptyState
          glyph="✨"
          title="Your moment starts here"
          subtitle="Got a code from a host? Jump in. Hosting your own day? Set it up in 60 seconds and hand out the code."
        >
          <View style={{ gap: 10 }}>
            <Button label="Enter event code" onPress={() => router.push('/join')} />
            <Button label="Host an event" variant="secondary" onPress={() => router.push('/(tabs)/store')} />
          </View>
        </EmptyState>
      </SafeAreaView>
    );
  }

  const quests = questsByEvent[event.id] ?? [];
  const photos = photosByEvent[event.id] ?? [];
  const myCompleted = quests.filter((q) => uid && q.completedBy.includes(uid)).length;
  const progress = quests.length ? myCompleted / quests.length : 0;
  const countdown = getCountdown(event.expiresAt);
  const urgent = isUrgent(countdown);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6 }}>
          <IconButton name="swap-horizontal" onPress={() => router.push('/events')} surface />
          <Text variant="overline" dim>
            OURMOMENT
          </Text>
          <IconButton name="person-circle-outline" onPress={() => router.push('/settings')} surface />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}>
          <EventHero event={event} />

          {/* Save-phase nudge */}
          {urgent ? (
            <Card elevated style={{ marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,69,58,0.4)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="time" size={26} color={theme.colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text variant="headline">Time to save your moment</Text>
                  <Text variant="footnote" dim>
                    Swipe through every photo and keep what matters before it’s gone.
                  </Text>
                </View>
              </View>
              <Button label="Start saving" onPress={() => router.push('/swipe')} style={{ marginTop: 12 }} />
            </Card>
          ) : null}

          {/* Primary actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Button label="Capture" icon={<Ionicons name="camera" size={20} color={theme.colors.onAccent} />} onPress={() => router.push('/capture')} style={{ flex: 1 }} />
            <Button label="Save" variant="secondary" icon={<Ionicons name="albums-outline" size={20} color={theme.colors.text} />} onPress={() => router.push('/swipe')} style={{ flex: 1 }} />
          </View>

          {/* Quests */}
          <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <ProgressRing progress={progress} size={56} label={`${myCompleted}`} sublabel={`/${quests.length}`} />
              <View>
                <Text variant="title3">Quests</Text>
                <Text variant="footnote" dim>
                  {progress >= 1 ? 'All done — beautiful work' : 'Little nudges to capture it all'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            {quests.slice(0, 4).map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                completedByMe={Boolean(uid && q.completedBy.includes(uid))}
                onPress={() => router.push({ pathname: '/capture', params: { questId: q.id } })}
              />
            ))}
            {quests.length > 4 ? (
              <PressableScale onPress={() => router.push('/(tabs)/gallery')} style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text variant="subhead" color={theme.colors.accent}>
                  See all {quests.length} quests
                </Text>
              </PressableScale>
            ) : null}
          </View>

          {/* Recent strip */}
          {photos.length > 0 ? (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="title3">Latest</Text>
                <PressableScale onPress={() => router.push('/(tabs)/gallery')}>
                  <Text variant="subhead" color={theme.colors.accent}>
                    Gallery
                  </Text>
                </PressableScale>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {photos.slice(0, 12).map((p) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.url }}
                    style={{ width: 120, height: 160, borderRadius: 16, backgroundColor: theme.colors.surface }}
                    contentFit="cover"
                    transition={180}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
