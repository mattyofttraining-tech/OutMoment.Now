import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, EmptyState, IconButton, Text } from '@/components/ui';
import { CountdownBadge } from '@/components/CountdownBadge';
import { PhotoGrid } from '@/features/gallery/PhotoGrid';
import { useAppStore } from '@/store/useAppStore';
import type { Photo } from '@/types';
import { exportPhotoToLibrary } from '@/services/media';
import { haptics } from '@/utils/haptics';

export default function GalleryScreen() {
  const theme = useTheme();
  const router = useRouter();

  const activeEventId = useAppStore((s) => s.activeEventId);
  const myEvents = useAppStore((s) => s.myEvents);
  const photosByEvent = useAppStore((s) => s.photosByEvent);
  const savedIds = useAppStore((s) => s.savedIds);
  const save = useAppStore((s) => s.save);
  const unsave = useAppStore((s) => s.unsave);
  const subscribeToPhotos = useAppStore((s) => s.subscribeToPhotos);

  const event = useMemo(() => myEvents.find((e) => e.id === activeEventId), [myEvents, activeEventId]);
  const photos = activeEventId ? photosByEvent[activeEventId] ?? [] : [];
  const [viewer, setViewer] = useState<Photo | null>(null);

  useEffect(() => {
    if (!activeEventId) return;
    return subscribeToPhotos(activeEventId);
  }, [activeEventId, subscribeToPhotos]);

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
        <EmptyState glyph="🖼️" title="No gallery yet" subtitle="Join or host an event to see the shared photos here." />
      </SafeAreaView>
    );
  }

  const isSaved = viewer ? savedIds.has(viewer.id) : false;

  async function toggleSave(photo: Photo) {
    if (savedIds.has(photo.id)) {
      await unsave(photo.id);
      haptics.soft();
    } else {
      const exported = await exportPhotoToLibrary(photo.url);
      await save(photo, exported);
      haptics.success();
    }
  }

  const header = (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="largeTitle">{event.title}</Text>
          <Text variant="footnote" dim>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · everyone’s view
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <CountdownBadge expiresAt={event.expiresAt} />
        <View style={{ flex: 1 }} />
        <Button label="Save photos" size="sm" fullWidth={false} icon={<Ionicons name="albums-outline" size={16} color={theme.colors.onAccent} />} onPress={() => router.push('/swipe')} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <PhotoGrid
          photos={photos}
          savedIds={savedIds}
          onPressPhoto={(p) => setViewer(p)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState glyph="📸" title="Be the first" subtitle="The gallery fills up as the day unfolds. Tap Capture and start the story." />
          }
        />
      </SafeAreaView>

      {/* Lightweight full-screen viewer */}
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        {viewer ? (
          <View style={styles.viewer}>
            <Image source={{ uri: viewer.url }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.viewerTop} pointerEvents="none" />
            <SafeAreaView style={styles.viewerChrome} edges={['top', 'bottom']}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                <IconButton name="close" color="#fff" surface onPress={() => setViewer(null)} />
                <IconButton
                  name={isSaved ? 'heart' : 'heart-outline'}
                  color={isSaved ? theme.colors.keep : '#fff'}
                  surface
                  onPress={() => toggleSave(viewer)}
                />
              </View>
              <View style={{ alignItems: 'center', paddingBottom: 16 }}>
                <Text variant="subhead" color="#fff">
                  {viewer.uploaderName}
                </Text>
                {viewer.caption ? (
                  <Text variant="caption" color="rgba(255,255,255,0.7)">
                    {viewer.caption}
                  </Text>
                ) : null}
              </View>
            </SafeAreaView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  viewerChrome: { flex: 1, justifyContent: 'space-between' },
});
