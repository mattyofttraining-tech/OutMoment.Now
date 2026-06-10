import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { BrandMark, Button, IconButton, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { normalizeCode } from '@/utils/code';
import { haptics } from '@/utils/haptics';

export default function JoinScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const joinByCode = useAppStore((s) => s.joinByCode);
  const isDemo = useAppStore((s) => s.isDemo);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canJoin = code.trim().length >= 3 && name.trim().length >= 1;

  async function onJoin() {
    if (!canJoin || loading) return;
    setLoading(true);
    setError(null);
    try {
      await joinByCode(normalizeCode(code), name.trim());
      haptics.success();
      router.replace('/(tabs)');
    } catch (e) {
      haptics.warning();
      setError(e instanceof Error ? e.message : t('join.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <BrandMark variant="whisper" />
          <IconButton name="close" onPress={() => router.back()} surface />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.xl }}>
          <View style={{ gap: 6 }}>
            <Text variant="largeTitle">{t('join.title')}</Text>
            <Text variant="callout" dim>
              {t('join.subtitle')}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.md }}>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="SUNSET-2026"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              style={[styles.input, styles.codeInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('join.namePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="words"
              returnKeyType="go"
              onSubmitEditing={onJoin}
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            />
            {error ? (
              <Text variant="footnote" color="danger">
                {error}
              </Text>
            ) : null}
            {isDemo ? (
              <Text variant="caption" dim>
                {t('join.demoNote')}
              </Text>
            ) : null}
          </View>

          <Button label={t('join.join')} onPress={onJoin} disabled={!canJoin} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  input: {
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
  },
  codeInput: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
