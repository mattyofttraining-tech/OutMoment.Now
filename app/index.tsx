import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Button, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { WELCOME_IMAGE } from '@/data/media';
import { useTranslation } from '@/i18n/useTranslation';

const { height } = Dimensions.get('window');

export default function Welcome() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const activeEventId = useAppStore((s) => s.activeEventId);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  // First run: show the intro that sells the "save it or lose it" magic.
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  // Returning guest with a live event lands straight inside it.
  if (activeEventId) return <Redirect href="/(tabs)" />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Image source={{ uri: WELCOME_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient
        colors={['rgba(11,11,15,0.2)', 'rgba(11,11,15,0.65)', '#0B0B0F']}
        locations={[0, 0.5, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.brand}>
          <Text variant="overline" color="rgba(255,255,255,0.7)">
            OURMOMENT
          </Text>
        </Animated.View>

        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.delay(150).duration(700)}>
            <Text variant="largeTitle" color="#fff" style={{ fontSize: 44, lineHeight: 50 }}>
              {t('welcome.heroTitle')}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(700)}>
            <Text variant="title3" weight="400" color="rgba(255,255,255,0.78)" style={{ marginTop: 12 }}>
              {t('welcome.heroBody')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(480).duration(700)} style={{ marginTop: 36, gap: 12 }}>
            <Button label={t('welcome.haveCode')} onPress={() => router.push('/join')} />
            <Button label={t('welcome.hostEvent')} variant="secondary" onPress={() => router.push('/(tabs)/store')} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(620).duration(700)}>
            <Text variant="footnote" color="rgba(255,255,255,0.5)" align="center" style={{ marginTop: 16 }}>
              {t('welcome.privacy')}
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 28 },
  brand: { alignItems: 'center', paddingTop: 12 },
  hero: { paddingBottom: height * 0.04 },
});
