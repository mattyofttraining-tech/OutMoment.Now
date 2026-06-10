import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeControls, type ColorScheme } from '@/theme';
import { BrandMark, Card, IconButton, PressableScale, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { SUPPORTED_LOCALES } from '@/i18n';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setSchemeOverride, schemeOverride } = useThemeControls();
  const { t, locale } = useTranslation();

  const displayName = useAppStore((s) => s.displayName);
  const setDisplayName = useAppStore((s) => s.setDisplayName);
  const setLocale = useAppStore((s) => s.setLocale);
  const isDemo = useAppStore((s) => s.isDemo);

  const [name, setName] = useState(displayName);

  const appearance: { key: ColorScheme | 'system'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: t('settings.system'), icon: 'phone-portrait-outline' },
    { key: 'light', label: t('settings.light'), icon: 'sunny-outline' },
    { key: 'dark', label: t('settings.dark'), icon: 'moon-outline' },
  ];
  const current = schemeOverride ?? 'system';

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <Text variant="title1">{t('settings.title')}</Text>
        <IconButton name="close" surface onPress={() => router.back()} />
      </View>

      <Text variant="overline" dim style={styles.section}>
        {t('settings.yourName')}
      </Text>
      <Card>
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
      </Card>
      <Text variant="caption" dim style={{ marginTop: 6 }}>
        {t('settings.nameHint')}
      </Text>

      <Text variant="overline" dim style={styles.section}>
        {t('settings.appearance')}
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
        {t('settings.language')}
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {SUPPORTED_LOCALES.map((l, i) => {
          const selected = l.code === locale;
          return (
            <PressableScale
              key={l.code}
              activeScale={0.99}
              onPress={() => setLocale(l.code)}
              style={[styles.rowItem, i < SUPPORTED_LOCALES.length - 1 ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth } : null]}
            >
              <Text variant="body">{l.flag}</Text>
              <Text variant="body" style={{ flex: 1 }}>
                {l.label}
              </Text>
              {selected ? <Ionicons name="checkmark" size={20} color={theme.colors.accent} /> : null}
            </PressableScale>
          );
        })}
      </Card>

      <Text variant="overline" dim style={styles.section}>
        {t('settings.howItWorks')}
      </Text>
      <Card>
        <InfoLine icon="lock-closed-outline" text={t('settings.infoClosed')} />
        <InfoLine icon="timer-outline" text={t('settings.infoPurge')} />
        <InfoLine icon="heart-outline" text={t('settings.infoSaved')} last />
      </Card>

      <Text variant="overline" dim style={styles.section}>
        {t('settings.about')}
      </Text>
      <Card>
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
      </Card>

      <View style={{ alignItems: 'center', paddingVertical: 24, gap: 14 }}>
        <Text variant="caption" dim align="center">
          {t('settings.footer')}
        </Text>
        <BrandMark variant="whisper" />
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
