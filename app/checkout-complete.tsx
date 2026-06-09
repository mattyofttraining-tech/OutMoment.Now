import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Badge, Button, IconButton, Text } from '@/components/ui';
import { getWorld } from '@/data/eventWorlds';
import type { OurEvent } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { takePendingBooking } from '@/services/payments';
import { haptics } from '@/utils/haptics';

/**
 * Stripe Checkout return point for the web PWA (the native flow returns inside
 * openAuthSessionAsync and never lands here). Picks up the stashed booking
 * draft and creates the event — the server independently verifies the session
 * is paid before anything is created.
 */
export default function CheckoutCompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { status, session_id: sessionId } = useLocalSearchParams<{
    status?: string;
    session_id?: string;
  }>();

  const createEvent = useAppStore((s) => s.createEvent);
  const setActiveEvent = useAppStore((s) => s.setActiveEvent);

  const [created, setCreated] = useState<OurEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // double-mount guard (web strict mode)
    ran.current = true;

    (async () => {
      const pending = await takePendingBooking();
      if (status !== 'success' || !sessionId) {
        router.replace('/(tabs)');
        return;
      }
      if (!pending) {
        setError(t('book.resumeMissing'));
        return;
      }
      try {
        const event = await createEvent({
          type: pending.type,
          title: pending.title,
          subtitle: pending.subtitle,
          hostName: 'You',
          startsAt: Date.now(),
          aiBrief: pending.brief,
          guestTier: pending.guestTier,
          checkoutSessionId: sessionId,
        });
        haptics.success();
        setCreated(event);
      } catch (e) {
        console.warn('[checkout] resume failed:', e);
        setError(t('book.resumeFailed'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: 24, gap: 16 }}
        edges={['top', 'bottom']}
      >
        <Text variant="title2" align="center">
          {error}
        </Text>
        <Button label={t('book.backHome')} onPress={() => router.replace('/(tabs)')} />
      </SafeAreaView>
    );
  }

  if (!created) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', gap: 14 }}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text variant="callout" dim>
          {t('book.finalizing')}
        </Text>
      </SafeAreaView>
    );
  }

  const world = getWorld(created.type);
  return (
    <View style={{ flex: 1, backgroundColor: world.gradient[0] }}>
      <Image source={{ uri: world.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.3)', world.gradient[0]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 24 }} edges={['top', 'bottom']}>
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton name="close" color="#fff" surface onPress={() => router.replace('/(tabs)')} />
        </View>

        <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 56 }}>{world.glyph}</Text>
          <Text variant="title1" color="#fff" align="center">
            {created.title} {t('book.ready')}
          </Text>
          <Text variant="callout" color="rgba(255,255,255,0.8)" align="center">
            {t('book.shareDesc')}
          </Text>

          <View style={styles.codeBox}>
            <Text variant="largeTitle" color="#fff" style={{ letterSpacing: 4 }}>
              {created.code}
            </Text>
          </View>
          <Badge label={t('book.expires')} bg="rgba(255,255,255,0.16)" color="#fff" />
        </Animated.View>

        <View style={{ gap: 12 }}>
          <Button
            label={t('book.shareCode')}
            icon={<Ionicons name="share-outline" size={20} color={theme.colors.onAccent} />}
            onPress={() =>
              Share.share({
                message: `Join our OurMoment event "${created.title}" — enter code ${created.code} in the app to add your photos.`,
              })
            }
          />
          <Button
            label={t('book.copyCode')}
            variant="secondary"
            onPress={async () => {
              await Clipboard.setStringAsync(created.code);
              haptics.success();
            }}
          />
          <Button
            label={t('book.goToEvent')}
            variant="ghost"
            onPress={() => {
              setActiveEvent(created.id);
              router.replace('/(tabs)');
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
