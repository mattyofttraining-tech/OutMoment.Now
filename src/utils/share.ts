import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * Share an invite message on any platform. Native uses the system share sheet.
 * On web, `navigator.share` only exists on mobile browsers — desktop falls back
 * to copying the message to the clipboard.
 *
 * Returns 'shared' | 'copied' | 'dismissed' so callers can confirm the right
 * thing to the user.
 */
export async function shareMessage(message: string): Promise<'shared' | 'copied' | 'dismissed'> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && 'share' in nav && typeof nav.share === 'function') {
      try {
        await nav.share({ text: message });
        return 'shared';
      } catch {
        return 'dismissed'; // user closed the sheet
      }
    }
    await Clipboard.setStringAsync(message);
    return 'copied';
  }

  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    return 'dismissed';
  }
}
