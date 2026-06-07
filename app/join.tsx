import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Button, IconButton, Screen, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { normalizeCode } from '@/utils/code';
import { haptics } from '@/utils/haptics';

export default function JoinScreen() {
  const theme = useTheme();
  const router = useRouter();
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
      setError(e instanceof Error ? e.message : 'That code didn’t work. Check it and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton name="close" onPress={() => router.back()} surface />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.xl }}>
          <View style={{ gap: 6 }}>
            <Text variant="largeTitle">Join your event</Text>
            <Text variant="callout" dim>
              Enter the code your host shared with you. It unlocks one private event — nothing else.
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
              placeholder="Your name"
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
                Demo mode — any code drops you into a showcase wedding.
              </Text>
            ) : null}
          </View>

          <Button label="Join the moment" onPress={onJoin} disabled={!canJoin} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 4 },
  input: {
    height: 60,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 18,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
