import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';

export type TipKey = 'moment' | 'gallery' | 'saved' | 'store';

const LOGO = require('../../assets/images/ourmoment-logo.png');
const SHOW_DELAY_MS = 650;
// Mirrors the tab bar height in app/(tabs)/_layout.tsx so the tip floats just above it.
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;

// Only one tip may be on screen at a time. A dismissed-elsewhere tip simply
// waits for its screen's next focus, so guidance arrives one beat at a time.
let activeTip: TipKey | null = null;
function claimTip(key: TipKey): boolean {
  if (activeTip && activeTip !== key) return false;
  activeTip = key;
  return true;
}
function releaseTip(key: TipKey) {
  if (activeTip === key) activeTip = null;
}

/**
 * First-arrival coach mark: a small branded popup that introduces a screen the
 * first time the user lands on it, then never again (persisted per tip, versioned
 * key so future copy rewrites can re-show). Non-blocking by design — it floats
 * above the tab bar and the whole screen stays interactive behind it.
 */
export function FirstRunTip({ tipKey }: { tipKey: TipKey }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const ready = useAppStore((s) => s.ready);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const [unseen, setUnseen] = useState(false);
  const [visible, setVisible] = useState(false);
  const storageKey = `ourmoment.tip.${tipKey}.v1`;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((v) => {
        if (!cancelled && v !== 'seen') setUnseen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Show on focus (after a beat, so the screen settles first); hide on blur
  // without marking as seen — only an explicit "Got it" counts as read.
  useFocusEffect(
    useCallback(() => {
      if (!ready || !hasOnboarded || !unseen) return;
      const timer = setTimeout(() => {
        if (claimTip(tipKey)) setVisible(true);
      }, SHOW_DELAY_MS);
      return () => {
        clearTimeout(timer);
        releaseTip(tipKey);
        setVisible(false);
      };
    }, [ready, hasOnboarded, unseen, tipKey]),
  );

  function dismiss() {
    haptics.selection();
    setUnseen(false);
    setVisible(false);
    releaseTip(tipKey);
    AsyncStorage.setItem(storageKey, 'seen').catch(() => {});
  }

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18).stiffness(220)}
      exiting={FadeOut.duration(180)}
      style={styles.wrap}
      pointerEvents="box-none"
    >
      <View
        accessible
        accessibilityLiveRegion="polite"
        style={[
          styles.card,
          theme.shadows.lg,
          { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={LOGO}
            style={{ width: 18, height: 18, borderRadius: 5 }}
            contentFit="cover"
            accessibilityLabel="OurMoment logo"
          />
          <Text variant="headline" style={{ flex: 1 }}>
            {t(`tips.${tipKey}Title`)}
          </Text>
        </View>
        <Text variant="footnote" dim style={{ marginTop: 4 }}>
          {t(`tips.${tipKey}Body`)}
        </Text>
        <PressableScale
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('tips.gotIt')}
          style={styles.cta}
        >
          <Text variant="subhead" weight="600" color={theme.colors.accent}>
            {t('tips.gotIt')}
          </Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: TAB_BAR_HEIGHT + 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cta: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4, marginTop: 2 },
});
