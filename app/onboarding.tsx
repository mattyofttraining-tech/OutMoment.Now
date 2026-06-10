import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { BrandMark, Button, PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { EVENT_COVERS, WELCOME_IMAGE } from '@/data/media';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';

interface Slide {
  image: string;
  glyph: string;
  titleKey: string;
  bodyKey: string;
}

const SLIDES: Slide[] = [
  { image: WELCOME_IMAGE, glyph: '📸', titleKey: 'onboarding.s1Title', bodyKey: 'onboarding.s1Body' },
  { image: EVENT_COVERS.birthday, glyph: '🎯', titleKey: 'onboarding.s2Title', bodyKey: 'onboarding.s2Body' },
  { image: EVENT_COVERS.marriage, glyph: '⏳', titleKey: 'onboarding.s3Title', bodyKey: 'onboarding.s3Body' },
];

/**
 * First-run intro. State-driven crossfade slides (not FlatList paging, which is
 * unreliable on react-native-web) so the experience is identical in the app and
 * the PWA: swipe or tap to advance, slow Ken Burns drift on each photo, and a
 * conversion-focused CTA that grows on the final slide.
 */
export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index]!;

  async function finish() {
    haptics.success();
    await completeOnboarding();
    router.replace('/');
  }

  function goTo(next: number) {
    if (next === index || next < 0 || next >= SLIDES.length) return;
    haptics.selection();
    setIndex(next);
  }

  function next() {
    if (isLast) return finish();
    goTo(index + 1);
  }

  // Swipe left/right anywhere on the slide — works with touch and mouse drag.
  // runOnJS(true): callbacks fire on the JS thread so we can set state directly.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .onEnd((e) => {
      if (e.translationX < -48) goTo(index + 1);
      else if (e.translationX > 48) goTo(index - 1);
    });

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0F' }}>
      <GestureDetector gesture={swipe}>
        <View style={StyleSheet.absoluteFill}>
          {/* Crossfading photo layer with a slow Ken Burns drift. */}
          <Animated.View
            key={`img-${index}`}
            entering={FadeIn.duration(450)}
            exiting={FadeOut.duration(450)}
            style={StyleSheet.absoluteFill}
          >
            <KenBurnsImage uri={slide.image} />
          </Animated.View>
          <LinearGradient
            colors={['rgba(11,11,15,0.35)', 'rgba(11,11,15,0.45)', '#0B0B0F']}
            locations={[0, 0.5, 0.92]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Copy */}
          <SafeAreaView style={styles.slideBody} pointerEvents="box-none">
            <Animated.View key={`copy-${index}`} entering={FadeInDown.duration(450)} style={{ gap: 12 }}>
              <Text style={{ fontSize: 40 }}>{slide.glyph}</Text>
              <Text variant="largeTitle" color="#fff" style={{ fontSize: 38, lineHeight: 44 }}>
                {t(slide.titleKey)}
              </Text>
              <Text variant="title3" weight="400" color="rgba(255,255,255,0.78)">
                {t(slide.bodyKey)}
              </Text>
            </Animated.View>
          </SafeAreaView>
        </View>
      </GestureDetector>

      {/* Brand whisper */}
      <SafeAreaView style={styles.brand} pointerEvents="none">
        <BrandMark variant="whisper" onPhoto />
      </SafeAreaView>

      {/* Skip */}
      <SafeAreaView style={styles.skip} pointerEvents="box-none">
        {!isLast ? (
          <PressableScale onPress={finish} style={{ padding: 12 }}>
            <Text variant="subhead" color="rgba(255,255,255,0.7)">
              {t('onboarding.skip')}
            </Text>
          </PressableScale>
        ) : null}
      </SafeAreaView>

      {/* Footer: dots + CTA */}
      <SafeAreaView style={styles.footer} edges={['bottom']} pointerEvents="box-none">
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <PressableScale key={i} onPress={() => goTo(i)} hitSlop={10}>
              <View
                style={{
                  width: i === index ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: i === index ? theme.colors.accent : 'rgba(255,255,255,0.3)',
                }}
              />
            </PressableScale>
          ))}
        </View>
        <Button label={isLast ? t('onboarding.getStarted') : t('onboarding.next')} onPress={next} />
        {isLast ? (
          <Animated.View entering={FadeIn.delay(200)}>
            <Text variant="caption" color="rgba(255,255,255,0.5)" align="center">
              {t('welcome.privacy')}
            </Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/** Full-bleed image with a slow, cinematic zoom drift. */
function KenBurnsImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = 1;
    scale.value = withTiming(1.07, { duration: 7000, easing: Easing.out(Easing.quad) });
  }, [uri, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slideBody: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 210 },
  brand: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 14 },
  skip: { position: 'absolute', top: 0, right: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
});
