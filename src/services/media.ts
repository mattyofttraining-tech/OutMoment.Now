import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
// SDK 54 introduced a new expo-file-system API; we use the stable legacy
// download/cache helpers here.
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Camera-roll export for saved moments. When a guest keeps a photo we also try
 * to write it to their device library so it truly survives the 30-day purge.
 *
 * Crash-safe: returns `false` (rather than throwing) when permission is denied,
 * on web, or in any environment where the library isn't available, so the
 * in-app Saved album always works even if the export doesn't.
 */
export async function exportPhotoToLibrary(url: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (!granted) return false;

    let localUri = url;
    if (!url.startsWith('file://') && !url.startsWith('content://')) {
      // Remote URL — download to cache first.
      const target = `${FileSystem.cacheDirectory}ourmoment_${Date.now()}.jpg`;
      const { uri } = await FileSystem.downloadAsync(url, target);
      localUri = uri;
    }
    await MediaLibrary.saveToLibraryAsync(localUri);
    return true;
  } catch {
    return false;
  }
}

export async function ensureLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}
