import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeControls, type ColorScheme } from '@/theme';
import { Avatar, Badge, BrandMark, Button, Card, dialog, EmptyState, IconButton, PressableScale, ProgressRing, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { SUPPORTED_LOCALES } from '@/i18n';
import { getWorld } from '@/data/eventWorlds';
import { getCountdown } from '@/utils/time';
import { haptics } from '@/utils/haptics';
import { shareMessage } from '@/utils/share';

export default function HostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, locale } = useTranslation();

  const uid = useAppStore((s) => s.uid);
  const activeEventId = useAppStore((s) => s.activeEventId);
  const myEvents = useAppStore((s) => s.myEvents);
  const membersByEvent = useAppStore((s) => s.membersByEvent);
  const questsByEvent = useAppStore((s) => s.questsByEvent);
  const photosByEvent = useAppStore((s) => s.photosByEvent);
  const loadEventDetail = useAppStore((s) => s.loadEventDetail);
  const subscribeToPhotos = useAppStore((s) => s.subscribeToPhotos);
  const deleteEvent = useAppStore((s) => s.deleteEvent);

  useEffect(() => {
    if (!activeEventId) return;
    loadEventDetail(activeEventId).catch(() => {});
    return subscribeToPhotos(activeEventId);
  }, [activeEventId, loadEventDetail, subscribeToPhotos]);

  const event = useMemo(() => myEvents.find((e) => e.id === activeEventId), [myEvents, activeEventId]);

  const stats = useMemo(() => {
    if (!event) return null;
    const members = membersByEvent[event.id] ?? [];
    const quests = questsByEvent[event.id] ?? [];
    const photos = photosByEvent[event.id] ?? [];

    const questsDone = quests.filter((q) => q.completedBy.length > 0).length;

    // Top contributors by photo count.
    const counts = new Map<string, number>();
    for (const p of photos) counts.set(p.uploaderUid, (counts.get(p.uploaderUid) ?? 0) + 1);
    const nameFor = (id: string) => members.find((m) => m.uid === id)?.displayName ?? t('common.guest');
    const colorFor = (id: string) => members.find((m) => m.uid === id)?.avatarColor;
    const leaders = [...counts.entries()]
      .map(([id, n]) => ({ id, name: nameFor(id), color: colorFor(id), count: n }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recent = [...members].sort((a, b) => b.joinedAt - a.joinedAt).slice(0, 6);

    return {
      members: members.length || event.memberCount,
      photos: photos.length || event.photoCount,
      quests: quests.length,
      questsDone,
      questPct: quests.length ? questsDone / quests.length : 0,
      leaders,
      recent,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` is stable per locale
  }, [event, membersByEvent, questsByEvent, photosByEvent, locale]);

  const world = event ? getWorld(event.type) : null;
  const isHost = !!event && event.hostUid === uid;
  const countdown = event ? getCountdown(event.expiresAt) : null;

  const confirmDelete = () => {
    if (!event) return;
    dialog.show(t('host.deleteTitle'), t('host.deleteBody'), [
      { label: t('host.cancel'), style: 'cancel' },
      {
        label: t('host.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            haptics.warning();
            await deleteEvent(event.id);
            router.dismissAll();
            router.replace('/(tabs)');
          } catch (e) {
            console.warn('[host] delete failed', e);
            dialog.alert(t('host.deleteFailed'), t('host.tryAgain'), t('common.ok'));
          }
        },
      },
    ]);
  };

  const onShare = async () => {
    if (!event) return;
    const result = await shareMessage(t('common.shareMessage', { title: event.title, code: event.code }));
    if (result === 'copied') {
      haptics.success();
      dialog.alert(t('common.copiedTitle'), t('common.copiedBody'), t('common.ok'));
    }
  };

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text variant="title1">{event ? t('host.title') : t('settings.title')}</Text>
          {event ? (
            <Text variant="footnote" dim>
              {event.title}
            </Text>
          ) : null}
        </View>
        <IconButton name="close" surface onPress={() => router.back()} />
      </View>

      {event && stats && world && countdown ? (
        <>
          {/* Share code */}
          <Card elevated style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text variant="overline" dim>
                  {t('host.inviteCode')}
                </Text>
                <Text variant="title2" weight="700" style={{ letterSpacing: 2, color: world.accent }}>
                  {event.code}
                </Text>
              </View>
              {isHost ? <Badge label={t('host.hosting')} icon="⭐" /> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                label={t('host.share')}
                size="md"
                icon={<Ionicons name="share-outline" size={18} color={theme.colors.onAccent} />}
                onPress={onShare}
                style={{ flex: 1 }}
              />
              <Button
                label={t('host.copy')}
                size="md"
                variant="secondary"
                onPress={async () => {
                  await Clipboard.setStringAsync(event.code);
                  haptics.success();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          {/* Stat tiles */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <StatTile label={t('host.guests')} value={String(stats.members)} icon="people" />
            <StatTile label={t('host.photos')} value={String(stats.photos)} icon="image" />
            <StatTile label={t('host.daysLeft')} value={String(countdown.days)} icon="time" tint={countdown.days <= 3 ? theme.colors.danger : undefined} />
          </View>

          {/* Quest completion */}
          <Card style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing progress={stats.questPct} size={62} label={`${Math.round(stats.questPct * 100)}%`} color={world.accent} />
              <View style={{ flex: 1 }}>
                <Text variant="headline">{t('host.questsCaptured')}</Text>
                <Text variant="footnote" dim>
                  {stats.questsDone} / {stats.quests} {t('host.promptsWithPhoto')}
                </Text>
              </View>
            </View>
          </Card>

          {/* Leaderboard */}
          <Text variant="overline" dim style={styles.section}>
            {t('host.topContributors')}
          </Text>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {stats.leaders.length === 0 ? (
              <View style={{ padding: 20 }}>
                <Text variant="footnote" dim align="center">
                  {t('host.noPhotosYet')}
                </Text>
              </View>
            ) : (
              stats.leaders.map((l, i) => (
                <View
                  key={l.id}
                  style={[
                    styles.row,
                    i < stats.leaders.length - 1 ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null,
                  ]}
                >
                  <Text variant="subhead" dim style={{ width: 22 }}>
                    {i + 1}
                  </Text>
                  <Avatar name={l.name} color={l.color} size={34} />
                  <Text variant="body" style={{ flex: 1 }}>
                    {l.name}
                    {l.id === uid ? ` (${t('host.you')})` : ''}
                  </Text>
                  <Text variant="headline" color={world.accent}>
                    {l.count}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* Recent joins */}
          <Text variant="overline" dim style={styles.section}>
            {t('host.whosHere')}
          </Text>
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {stats.recent.map((m) => (
                <View key={m.uid} style={{ alignItems: 'center', width: 56, gap: 4 }}>
                  <Avatar name={m.displayName} color={m.avatarColor} size={44} />
                  <Text variant="caption" numberOfLines={1} dim>
                    {m.uid === uid ? t('host.youShort') : m.displayName}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : (
        <View style={{ marginTop: 8 }}>
          <EmptyState glyph="📊" title={t('host.emptyTitle')} subtitle={t('host.emptyBody')} />
        </View>
      )}

      {/* Profile — compact card, expands in place */}
      {event ? (
        <Text variant="overline" dim style={styles.section}>
          {t('settings.title')}
        </Text>
      ) : null}
      <ProfileCard />

      {event ? (
        <Text variant="caption" dim align="center" style={{ marginTop: 20 }}>
          {t('host.vanishesNote')}
        </Text>
      ) : null}
      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <BrandMark variant="whisper" />
      </View>

      {isHost ? (
        <Button
          label={t('host.deleteEvent')}
          variant="ghost"
          icon={<Ionicons name="trash-outline" size={18} color={theme.colors.danger} />}
          onPress={confirmDelete}
          style={{ marginTop: 12 }}
        />
      ) : null}
    </Screen>
  );
}

function ProfileCard() {
  const theme = useTheme();
  const { setSchemeOverride, schemeOverride } = useThemeControls();
  const { t, locale } = useTranslation();

  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const setLocale = useAppStore((s) => s.setLocale);
  const isDemo = useAppStore((s) => s.isDemo);

  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(displayName);

  const appearance: { key: ColorScheme | 'system'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: t('settings.system'), icon: 'phone-portrait-outline' },
    { key: 'light', label: t('settings.light'), icon: 'sunny-outline' },
    { key: 'dark', label: t('settings.dark'), icon: 'moon-outline' },
  ];
  const current = schemeOverride ?? 'system';
  const appearanceLabel = appearance.find((a) => a.key === current)?.label ?? t('settings.system');
  const currentLocale = SUPPORTED_LOCALES.find((l) => l.code === locale);

  return (
    <Card padded={false} style={{ overflow: 'hidden', marginTop: 8 }}>
      {/* Collapsed summary row — always visible, toggles the editor */}
      <PressableScale
        activeScale={0.99}
        onPress={() => {
          if (expanded) setDisplayName(name.trim() || 'You');
          setExpanded((v) => !v);
        }}
        style={styles.profileSummary}
      >
        <Avatar name={displayName} size={44} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">{displayName}</Text>
          <Text variant="footnote" dim>
            {appearanceLabel} · {currentLocale ? `${currentLocale.flag} ${currentLocale.label}` : locale}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.textSecondary} />
      </PressableScale>

      {expanded ? (
        <View style={{ borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth, padding: 16, paddingTop: 4 }}>
          <Text variant="overline" dim style={styles.profileSection}>
            {t('settings.yourName')}
          </Text>
          <View style={[styles.inputWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              // onEndEditing doesn't fire reliably on react-native-web — commit on
              // blur too so the PWA saves the name just like the app.
              onEndEditing={() => setDisplayName(name.trim() || 'You')}
              onBlur={() => setDisplayName(name.trim() || 'You')}
              placeholder={t('settings.yourName')}
              placeholderTextColor={theme.colors.textTertiary}
              style={{ fontSize: 17, fontFamily: 'Inter_400Regular', color: theme.colors.text }}
            />
          </View>
          <Text variant="caption" dim style={{ marginTop: 6 }}>
            {t('settings.nameHint')}
          </Text>

          <Text variant="overline" dim style={styles.profileSection}>
            {t('settings.appearance')}
          </Text>
          {appearance.map((opt) => {
            const selected = current === opt.key;
            return (
              <PressableScale
                key={opt.key}
                activeScale={0.99}
                onPress={() => setSchemeOverride(opt.key === 'system' ? null : (opt.key as ColorScheme))}
                style={styles.rowItem}
              >
                <Ionicons name={opt.icon} size={20} color={theme.colors.text} />
                <Text variant="body" style={{ flex: 1 }}>
                  {opt.label}
                </Text>
                {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
              </PressableScale>
            );
          })}

          <Text variant="overline" dim style={styles.profileSection}>
            {t('settings.language')}
          </Text>
          {SUPPORTED_LOCALES.map((l) => {
            const selected = l.code === locale;
            return (
              <PressableScale key={l.code} activeScale={0.99} onPress={() => setLocale(l.code)} style={styles.rowItem}>
                <Text variant="body">{l.flag}</Text>
                <Text variant="body" style={{ flex: 1 }}>
                  {l.label}
                </Text>
                {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
              </PressableScale>
            );
          })}

          <Text variant="overline" dim style={styles.profileSection}>
            {t('settings.howItWorks')}
          </Text>
          <InfoLine icon="lock-closed-outline" text={t('settings.infoClosed')} />
          <InfoLine icon="timer-outline" text={t('settings.infoPurge')} />
          <InfoLine icon="heart-outline" text={t('settings.infoSaved')} last />

          <Text variant="overline" dim style={styles.profileSection}>
            {t('settings.about')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="body" dim>
              {t('settings.version')}
            </Text>
            <Text variant="body">1.0.0</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text variant="body" dim>
              {t('settings.mode')}
            </Text>
            <Text variant="body">{isDemo ? t('settings.modeDemo') : t('settings.modeLive')}</Text>
          </View>

          <Text variant="caption" dim align="center" style={{ marginTop: 18 }}>
            {t('settings.footer')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function InfoLine({ icon, text, last }: { icon: keyof typeof Ionicons.glyphMap; text: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: last ? 0 : 12 }}>
      <Ionicons name={icon} size={20} color={theme.colors.accent} />
      <Text variant="footnote" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function StatTile({ label, value, icon, tint }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tint?: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg }}>
      <Ionicons name={icon} size={20} color={tint ?? theme.colors.textSecondary} />
      <Text variant="title1" weight="700" style={{ marginTop: 4, color: tint }}>
        {value}
      </Text>
      <Text variant="caption" dim>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 8 },
  section: { marginTop: 22, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  profileSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  profileSection: { marginTop: 20, marginBottom: 8 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  inputWrap: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
});
