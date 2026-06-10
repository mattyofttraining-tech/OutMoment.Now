import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Avatar, Badge, BrandMark, Button, Card, dialog, EmptyState, IconButton, ProgressRing, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
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

  if (!event || !stats) {
    return (
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Text variant="title1">{t('host.emptyHeader')}</Text>
          <IconButton name="close" surface onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState glyph="📊" title={t('host.emptyTitle')} subtitle={t('host.emptyBody')} />
        </View>
      </Screen>
    );
  }

  const world = getWorld(event.type);
  const isHost = event.hostUid === uid;
  const countdown = getCountdown(event.expiresAt);

  const confirmDelete = () => {
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
          <Text variant="title1">{t('host.title')}</Text>
          <Text variant="footnote" dim>
            {event.title}
          </Text>
        </View>
        <IconButton name="close" surface onPress={() => router.back()} />
      </View>

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

      <Text variant="caption" dim align="center" style={{ marginTop: 20 }}>
        {t('host.vanishesNote')}
      </Text>
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
});
