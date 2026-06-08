import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, StyleSheet, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Badge, Button, Card, IconButton, Text } from '@/components/ui';
import { getWorld } from '@/data/eventWorlds';
import { GUEST_TIERS, formatPrice, perGuestLabel, priceFor } from '@/data/pricing';
import type { EventType, GuestTierId, OurEvent } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { startCheckout } from '@/services/payments';
import { haptics } from '@/utils/haptics';
import { PressableScale } from '@/components/ui';

export default function BookScreen() {
  const theme = useTheme();
  const router = useRouter();
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

  const price = priceFor(world.type, guestTier);

  const canBook = title.trim().length >= 2 && (!world.aiPowered || brief.trim().length >= 8);

  async function onBook() {
    if (!canBook || loading) return;
    setLoading(true);
    try {
      const checkout = await startCheckout(world.type, title.trim(), guestTier);
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
      });
      haptics.success();
      setCreated(event);
    } catch {
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
          <View style={{ alignItems: 'flex-end' }}>
            <IconButton name="close" color="#fff" surface onPress={() => router.dismissAll()} />
          </View>

          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 56 }}>{world.glyph}</Text>
            <Text variant="title1" color="#fff" align="center">
              {created.title} is ready
            </Text>
            <Text variant="callout" color="rgba(255,255,255,0.8)" align="center">
              Share this code with your guests. They enter it to join — nothing else needed.
            </Text>

            <View style={styles.codeBox}>
              <Text variant="largeTitle" color="#fff" style={{ letterSpacing: 4 }}>
                {created.code}
              </Text>
            </View>
            <Badge label="Expires in 30 days" bg="rgba(255,255,255,0.16)" color="#fff" />
          </Animated.View>

          <View style={{ gap: 12 }}>
            <Button
              label="Share code"
              icon={<Ionicons name="share-outline" size={20} color={theme.colors.onAccent} />}
              onPress={() =>
                Share.share({
                  message: `Join our OurMoment event "${created.title}" — enter code ${created.code} in the app to add your photos.`,
                })
              }
            />
            <Button
              label="Copy code"
              variant="secondary"
              onPress={async () => {
                await Clipboard.setStringAsync(created.code);
                haptics.success();
              }}
            />
            <Button
              label="Go to event"
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
                {world.name}
              </Text>
              <Text variant="subhead" color="rgba(255,255,255,0.8)">
                {world.description}
              </Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Field label="Event name">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={placeholderTitle(world.type)}
                placeholderTextColor={theme.colors.textTertiary}
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              />
            </Field>

            <Field label="A little detail (optional)" hint="Place, people, or a date — shown on the cover.">
              <TextInput
                value={subtitle}
                onChangeText={setSubtitle}
                placeholder="Skagen · Midsummer"
                placeholderTextColor={theme.colors.textTertiary}
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
              />
            </Field>

            {world.aiPowered ? (
              <Field label="Describe your party" hint="Our AI turns this into a custom set of photo quests.">
                <TextInput
                  value={brief}
                  onChangeText={setBrief}
                  placeholder="A surprise 60th birthday on the beach for my dad, who loves sailing and his grandkids…"
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
                    Comes with {world.defaultQuests.length} hand-crafted photo quests for {world.name.toLowerCase()}.
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Guest-size tier — pricing scales with the event */}
          <View style={{ gap: 10 }}>
            <View>
              <Text variant="subhead">How big is the celebration?</Text>
              <Text variant="caption" dim>
                Pick the size that fits. You can always start small.
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
                          <Text variant="headline">{tier.label}</Text>
                          {tier.popular ? <Badge label="Most loved" /> : null}
                        </View>
                        <Text variant="footnote" dim>
                          {tier.blurb}
                        </Text>
                      </View>
                      <Text variant="title3">{formatPrice(priceFor(world.type, tier.id))}</Text>
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
              One-time · {perGuestLabel(world.type, guestTier)}
            </Text>
            <Text variant="title2">{formatPrice(price)}</Text>
          </View>
          <Button label="Book & get code" fullWidth={false} loading={loading} disabled={!canBook} onPress={onBook} style={{ minWidth: 160 }} />
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

function placeholderTitle(type: EventType): string {
  switch (type) {
    case 'marriage':
      return 'Anna & Jonas';
    case 'confirmation':
      return 'Emma’s Confirmation';
    case 'baptism':
      return 'Baby Liam’s Baptism';
    case 'birthday':
      return 'Dad’s 60th';
    default:
      return 'Our Reunion';
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, paddingTop: 6 },
  banner: { height: 200, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#111' },
  input: { minHeight: 54, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17 },
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
