import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, EmptyState, IconButton, PressableScale, Text } from '@/components/ui';
import { CountdownBadge } from '@/components/CountdownBadge';
import { Confetti } from '@/components/Confetti';
import { SwipeDeck, type SwipeDeckHandle } from '@/features/swipe/SwipeDeck';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import type { Photo, SwipeDecision } from '@/types';
import { exportPhotoToLibrary } from '@/services/media';

export default function SwipeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const activeEventId = useAppStore((s) => s.activeEventId);
  const myEvents = useAppStore((s) => s.myEvents);
  const photosByEvent = useAppStore((s) => s.photosByEvent);
  const save = useAppStore((s) => s.save);

  const event = useMemo(() => myEvents.find((e) => e.id === activeEventId), [myEvents, activeEventId]);
  const photos = activeEventId ? photosByEvent[activeEventId] ?? [] : [];

  const deckRef = useRef<SwipeDeckHandle>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);

  const onDecision = (photo: Photo, decision: SwipeDecision) => {
    if (decision === 'keep') {
      setSavedCount((c) => c + 1);
      // Save immediately; export to camera roll in the background.
      exportPhotoToLibrary(photo.url)
        .then((exported) => save(photo, exported))
        .catch(() => save(photo, false));
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton name="close" surface onPress={() => router.back()} />
          {event ? <CountdownBadge expiresAt={event.expiresAt} prominent /> : <View />}
          <View style={styles.counter}>
            <Ionicons name="heart" size={15} color={theme.colors.keep} />
            <Text variant="subhead" weight="700">
              {savedCount}
            </Text>
          </View>
        </View>

        {photos.length === 0 ? (
          <View style={styles.center}>
            <EmptyState glyph="📭" title={t('swipe.emptyTitle')} subtitle={t('swipe.emptyBody')} />
          </View>
        ) : done ? (
          <Animated.View entering={FadeIn} style={styles.center}>
            {savedCount > 0 ? <Confetti count={36} /> : null}
            <EmptyState glyph="🤍" title={t('swipe.doneTitle')} subtitle={t('swipe.doneBody')}>
              <View style={{ gap: 10 }}>
                <Button label={t('swipe.seeSaved')} onPress={() => router.replace('/(tabs)/saved')} />
                <Button label={t('swipe.done')} variant="secondary" onPress={() => router.back()} />
              </View>
            </EmptyState>
          </Animated.View>
        ) : (
          <>
            <View style={styles.deck}>
              <SwipeDeck ref={deckRef} photos={photos} onDecision={onDecision} onEmpty={() => setDone(true)} />
            </View>

            <View style={styles.hint}>
              <Text variant="footnote" dim align="center">
                {t('swipe.hint')}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <PressableScale onPress={() => deckRef.current?.pass()} haptic style={[styles.action, { borderColor: theme.colors.pass }]}>
                <Ionicons name="close" size={32} color={theme.colors.pass} />
              </PressableScale>
              <PressableScale onPress={() => deckRef.current?.keep()} haptic style={[styles.action, styles.keepAction, { borderColor: theme.colors.keep }]}>
                <Ionicons name="heart" size={32} color={theme.colors.keep} />
              </PressableScale>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 44, justifyContent: 'flex-end' },
  center: { flex: 1, justifyContent: 'center' },
  deck: { flex: 1 },
  hint: { paddingVertical: 8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingBottom: 12, paddingTop: 4 },
  action: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(127,127,127,0.06)',
  },
  keepAction: { width: 76, height: 76, borderRadius: 38 },
});
