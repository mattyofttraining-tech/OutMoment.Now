import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeControls, type ColorScheme } from '@/theme';
import { Card, IconButton, PressableScale, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setSchemeOverride, schemeOverride } = useThemeControls();

  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const isDemo = useAppStore((s) => s.isDemo);

  const [name, setName] = useState(displayName);

  const appearance: { key: ColorScheme | 'system'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];
  const current = schemeOverride ?? 'system';

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Text variant="title1">Profile</Text>
        <IconButton name="close" surface onPress={() => router.back()} />
      </View>

      <Text variant="overline" dim style={styles.section}>
        Your name
      </Text>
      <Card>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => setDisplayName(name.trim() || 'You')}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textTertiary}
          style={{ fontSize: 17, color: theme.colors.text }}
        />
      </Card>
      <Text variant="caption" dim style={{ marginTop: 6 }}>
        Shown next to the photos you contribute.
      </Text>

      <Text variant="overline" dim style={styles.section}>
        Appearance
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {appearance.map((opt, i) => {
          const selected = current === opt.key;
          return (
            <PressableScale
              key={opt.key}
              activeScale={0.99}
              onPress={() => setSchemeOverride(opt.key === 'system' ? null : (opt.key as ColorScheme))}
              style={[styles.rowItem, i < appearance.length - 1 ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null]}
            >
              <Ionicons name={opt.icon} size={20} color={theme.colors.text} />
              <Text variant="body" style={{ flex: 1 }}>
                {opt.label}
              </Text>
              {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </PressableScale>
          );
        })}
      </Card>

      <Text variant="overline" dim style={styles.section}>
        How OurMoment works
      </Text>
      <Card>
        <InfoLine icon="lock-closed-outline" text="Every event is a closed group. No public feed, no discovery." />
        <InfoLine icon="timer-outline" text="30 days after it’s created, the whole event is permanently deleted." />
        <InfoLine icon="heart-outline" text="Anything you save is yours forever — saved privately, just for you." last />
      </Card>

      <Text variant="overline" dim style={styles.section}>
        About
      </Text>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="body" dim>
            Version
          </Text>
          <Text variant="body">1.0.0</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text variant="body" dim>
            Mode
          </Text>
          <Text variant="body">{isDemo ? 'Demo' : 'Live'}</Text>
        </View>
      </Card>

      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text variant="caption" dim align="center">
          The 30-day wipe is also your right to be forgotten. Privacy, by design.
        </Text>
      </View>
    </Screen>
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

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingBottom: 8 },
  section: { marginTop: 24, marginBottom: 8 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
});
