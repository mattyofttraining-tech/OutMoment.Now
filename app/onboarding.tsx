import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Button, PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { EVENT_COVERS, WELCOME_IMAGE } from '@/data/media';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';

const { width } = Dimensions.get('window');

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

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  async function finish() {
    haptics.success();
    await completeOnboarding();
    router.replace('/');
  }

  function next() {
    if (isLast) return finish();
    haptics.selection();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0F' }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => `slide-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient
              colors={['rgba(11,11,15,0.15)', 'rgba(11,11,15,0.55)', '#0B0B0F']}
              locations={[0, 0.5, 0.92]}
              style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.slideBody}>
              <Animated.View entering={FadeIn.duration(500)} style={{ gap: 12 }}>
                <Text style={{ fontSize: 40 }}>{item.glyph}</Text>
                <Text variant="largeTitle" color="#fff" style={{ fontSize: 38, lineHeight: 44 }}>
                  {t(item.titleKey)}
                </Text>
                <Text variant="title3" weight="400" color="rgba(255,255,255,0.78)">
                  {t(item.bodyKey)}
                </Text>
              </Animated.View>
            </SafeAreaView>
          </View>
        )}
      />

      {/* Skip */}
      <SafeAreaView style={styles.skip} pointerEvents="box-none">
        <PressableScale onPress={finish} style={{ padding: 12 }}>
          <Text variant="subhead" color="rgba(255,255,255,0.7)">
            {t('onboarding.skip')}
          </Text>
        </PressableScale>
      </SafeAreaView>

      {/* Footer: dots + CTA */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 22 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === index ? theme.colors.accent : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </View>
        <Button label={isLast ? t('onboarding.getStarted') : t('onboarding.next')} onPress={next} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  slideBody: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 200 },
  skip: { position: 'absolute', top: 0, right: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
});
