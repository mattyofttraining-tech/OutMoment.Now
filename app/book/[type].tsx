import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Badge, BrandMark, Button, Card, dialog, IconButton, PressableScale, Text } from '@/components/ui';
import { getWorld } from '@/data/eventWorlds';
import { GUEST_TIERS, deviceCurrency, formatPrice, priceFor } from '@/data/pricing';
import type { EventType, GuestTierId, OurEvent } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { savePendingBooking, startCheckout } from '@/services/payments';
import { haptics } from '@/utils/haptics';
import { shareMessage } from '@/utils/share';

export default function BookScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { type } = useLocalSearchParams<{ type: EventType }>();
  const world = getWorld((type ?? 'special') as EventType);

  const createEvent = useAppStore((s) => s.createEvent);
  const setActiveEvent = useAppStore((s) => s.setActiveEvent);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [brief, setBrief] = useState('');
  const [guestTier, setGuestTier] = useState<GuestTierId>('celebration');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<OurEvent | null>(null);

  // Resolved once so the displayed price and the charged price can't diverge.
  const currency = useMemo(deviceCurrency, []);
  const price = priceFor(world.type, guestTier, currency);

  const canBook = title.trim().length >= 2 && (!world.aiPowered || brief.trim().length >= 8);

  async function onBook() {
    if (!canBook || loading) return;
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // The web PWA leaves the page to pay — stash the booking so
        // /checkout-complete can resume it after Stripe redirects back.
        await savePendingBooking({
          type: world.type,
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          brief: world.aiPowered ? brief.trim() : undefined,
          guestTier,
        });
      }
      const checkout = await startCheckout(world.type, title.trim(), guestTier, currency);
      if (checkout.status === 'redirecting') return; // page is navigating to Stripe
      if (checkout.status === 'cancelled') {
        setLoading(false);
        return;
      }
      const event = await createEvent({
        type: world.type,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        hostName: 'You',
        startsAt: Date.now(),
        aiBrief: world.aiPowered ? brief.trim() : undefined,
        guestTier,
        checkoutSessionId: checkout.status === 'paid' ? checkout.sessionId : undefined,
      });
      haptics.success();
      setCreated(event);
    } catch (e) {
      console.warn('[book] booking failed:', e);
      haptics.warning();
      setLoading(false);
    }
  }

  // ── Success / code reveal ──────────────────────────────────────────────
  if (created) {
    return (
      <View style={{ flex: 1, backgroundColor: world.gradient[0] }}>
        <Image source={{ uri: world.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.3)', world.gradient[0]]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', padding: 24 }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <BrandMark variant="whisper" onPhoto />
            <IconButton name="close" color="#fff" surface onPress={() => router.dismissAll()} />
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
              onPress={async () => {
                const result = await shareMessage(
                  t('common.shareMessage', { title: created.title, code: created.code }),
                );
                if (result === 'copied') {
                  haptics.success();
                  dialog.alert(t('common.copiedTitle'), t('common.copiedBody'), t('common.ok'));
                }
              }}
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
                router.dismissAll();
                router.replace('/(tabs)');
              }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Booking form ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton name="chevron-down" onPress={() => router.back()} surface />
        </View>

        <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 18 }}>
          <View style={[styles.banner, { borderRadius: theme.radius.xxl }]}>
            <Image source={{ uri: world.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['transparent', world.gradient[0]]} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 18 }}>
              <Text style={{ fontSize: 32 }}>{world.glyph}</Text>
              <Text variant="title1" color="#fff">
                {t(`worlds.${world.type}.name`)}
              </Text>
              <Text variant="subhead" color="rgba(255,255,255,0.8)">
                {t(`worlds.${world.type}.desc`)}
              </Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Field label={t('book.eventName')}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={t(placeholderTitleKey(world.type))}
                placeholderTextColor={theme.colors.textTertiary}
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              />
            </Field>

            <Field label={t('book.detailLabel')} hint={t('book.detailHint')}>
              <TextInput
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder={t('book.phDetail')}
                placeholderTextColor={theme.colors.textTertiary}
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              />
            </Field>

            {world.aiPowered ? (
              <Field label={t('book.describeLabel')} hint={t('book.describeHint')}>
                <TextInput
                  value={brief}
                  onChangeText={setBrief}
                  placeholder={t('book.phBrief')}
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                />
              </Field>
            ) : (
              <Card>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
                  <Text variant="footnote" dim style={{ flex: 1 }}>
                    {world.defaultQuests.length} {t('book.questsIncluded')}
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Guest-size tier — pricing scales with the event */}
          <View style={{ gap: 10 }}>
            <View>
              <Text variant="subhead">{t('book.howBig')}</Text>
              <Text variant="caption" dim>
                {t('book.pickSize')}
              </Text>
            </View>
            {GUEST_TIERS.map((tier) => {
              const selected = tier.id === guestTier;
              return (
                <PressableScale
                  key={tier.id}
                  activeScale={0.99}
                  haptic
                  onPress={() => setGuestTier(tier.id)}
                >
                  <Card
                    padded={false}
                    style={{
                      padding: theme.spacing.md,
                      borderWidth: 1.5,
                      borderColor: selected ? world.accent : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: selected ? world.accent : theme.colors.border,
                          backgroundColor: selected ? world.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text variant="headline">{t(`tiers.${tier.id}.label`)}</Text>
                          {tier.popular ? <Badge label={t('book.mostLoved')} /> : null}
                        </View>
                        <Text variant="footnote" dim>
                          {t(`tiers.${tier.id}.blurb`)}
                        </Text>
                      </View>
                      <Text variant="title3">{formatPrice(priceFor(world.type, tier.id, currency), currency, locale)}</Text>
                    </View>
                  </Card>
                </PressableScale>
              );
            })}
          </View>
        </Animated.ScrollView>

        <Animated.View entering={FadeInDown} style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" dim>
              {t('book.oneTime')} · {t('book.vatIncluded')}
            </Text>
            <Text variant="title2">{formatPrice(price, currency, locale)}</Text>
          </View>
          <Button label={t('book.book')} fullWidth={false} loading={loading} disabled={!canBook} onPress={onBook} style={{ minWidth: 160 }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="subhead">{label}</Text>
      {children}
      {hint ? (
        <Text variant="caption" dim>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function placeholderTitleKey(type: EventType): string {
  switch (type) {
    case 'marriage':
      return 'book.phMarriage';
    case 'confirmation':
      return 'book.phConfirmation';
    case 'baptism':
      return 'book.phBaptism';
    case 'birthday':
      return 'book.phBirthday';
    default:
      return 'book.phSpecial';
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, paddingTop: 6 },
  banner: { height: 200, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#111' },
  input: { minHeight: 54, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
