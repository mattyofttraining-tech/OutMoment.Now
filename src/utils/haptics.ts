import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Thin, crash-safe wrapper around expo-haptics. Haptics are a no-op on web and
 * silently ignore failures (e.g. simulators) so call sites stay clean.
 *
 * We only fire haptics on moments that *matter*: joining, completing a quest,
 * and saving a photo — never as decoration.
 */
const enabled = Platform.OS !== 'web';

export const haptics = {
  light() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  heavy() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },
  soft() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  },
  success() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  selection() {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
};
