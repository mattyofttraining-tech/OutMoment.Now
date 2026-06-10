import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Quest } from '@/types';
import { useTheme } from '@/theme';
import { Card, PressableScale, Text } from '@/components/ui';
import { useTranslation } from '@/i18n/useTranslation';
import { localizeQuest } from '@/i18n/questTranslations';

export interface QuestCardProps {
  quest: Quest;
  completedByMe: boolean;
  onPress?: () => void;
}

/** A single photo prompt. A gentle nudge, never a chore. */
export function QuestCard({ quest: rawQuest, completedByMe, onPress }: QuestCardProps) {
  const theme = useTheme();
  const { locale } = useTranslation();
  const quest = localizeQuest(rawQuest, locale);
  return (
    <PressableScale onPress={onPress} activeScale={0.98} haptic style={{ marginBottom: theme.spacing.sm }}>
      <Card padded={false} style={{ padding: theme.spacing.md, opacity: completedByMe ? 0.7 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: theme.radius.md,
              backgroundColor: completedByMe ? theme.colors.accentSoft : theme.colors.surfaceElevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>{quest.icon}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text variant="headline">{quest.title}</Text>
            <Text variant="footnote" dim numberOfLines={1}>
              {quest.prompt}
            </Text>
          </View>

          {completedByMe ? (
            <Ionicons name="checkmark-circle" size={26} color={theme.colors.success} />
          ) : (
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: theme.colors.border,
              }}
            />
          )}
        </View>
      </Card>
    </PressableScale>
  );
}
