import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { create } from 'zustand';
import { useTheme } from '@/theme';
import { Text } from './Text';

/**
 * Cross-platform alert/confirm dialog. React Native's `Alert.alert` is a no-op
 * on react-native-web, which silently killed every confirm flow in the PWA
 * (export, delete event, leave event). This renders the same Apple-style
 * dialog on every platform, so the app and the PWA behave identically.
 */

export interface DialogAction {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogRequest {
  title: string;
  message?: string;
  actions: DialogAction[];
}

interface DialogState {
  current: DialogRequest | null;
  show: (req: DialogRequest) => void;
  dismiss: () => void;
}

const useDialogStore = create<DialogState>((set) => ({
  current: null,
  show: (req) => set({ current: req }),
  dismiss: () => set({ current: null }),
}));

/** Imperative API — mirror of Alert.alert that works everywhere. */
export const dialog = {
  show(title: string, message: string | undefined, actions: DialogAction[]) {
    useDialogStore.getState().show({ title, message, actions });
  },
  /** Single-button notice. */
  alert(title: string, message: string | undefined, okLabel: string) {
    useDialogStore.getState().show({ title, message, actions: [{ label: okLabel }] });
  },
  dismiss() {
    useDialogStore.getState().dismiss();
  },
};

/** Mount once near the root (inside ThemeProvider). */
export function AppDialogHost() {
  const theme = useTheme();
  const current = useDialogStore((s) => s.current);
  const dismiss = useDialogStore((s) => s.dismiss);

  if (!current) return null;

  const handle = (action: DialogAction) => {
    dismiss();
    action.onPress?.();
  };

  const cancel = current.actions.find((a) => a.style === 'cancel');

  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss}>
      <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => (cancel ? handle(cancel) : dismiss())}
          accessibilityLabel="Dismiss dialog"
        />
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(260)}
          style={[
            styles.card,
            theme.shadows.xl,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.body}>
            <Text variant="headline" align="center">
              {current.title}
            </Text>
            {current.message ? (
              <Text variant="footnote" dim align="center" style={{ marginTop: 6 }}>
                {current.message}
              </Text>
            ) : null}
          </View>

          {current.actions.map((action, i) => (
            <Pressable
              key={`${action.label}-${i}`}
              onPress={() => handle(action)}
              style={({ pressed }) => [
                styles.action,
                { borderTopColor: theme.colors.border },
                pressed ? { backgroundColor: theme.colors.surface } : null,
              ]}
            >
              <Text
                variant="body"
                align="center"
                weight={action.style === 'cancel' ? '400' : '600'}
                color={action.style === 'destructive' ? 'danger' : 'accent'}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  body: { paddingHorizontal: 20, paddingVertical: 20 },
  action: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
