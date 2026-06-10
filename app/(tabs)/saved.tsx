import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/theme';
import { BrandMark, dialog, EmptyState, IconButton, PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';
import { exportPhotosAsZip } from '@/utils/webExport';

const COLUMNS = 3;
const GAP = 3;

export default function SavedScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const saved = useAppStore((s) => s.saved);
  const unsave = useAppStore((s) => s.unsave);

  // Measure the list, don't trust the window: on desktop web the app renders
  // inside a centred frame much narrower than the window.
  const [gridWidth, setGridWidth] = useState(0);
  const tile = gridWidth > 0 ? (gridWidth - GAP * (COLUMNS - 1)) / COLUMNS : 0;

  const exportedCount = saved.filter((s) => s.exportedToDevice).length;
  const [exporting, setExporting] = useState(false);

  async function exportAllNative() {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      dialog.alert(t('saved.permTitle'), t('saved.permBody'), t('common.ok'));
      return;
    }
    setExporting(true);
    let ok = 0;
    for (const item of saved) {
      try {
        const target = `${FileSystem.cacheDirectory}om_${item.photoId}.jpg`;
        const { uri } = await FileSystem.downloadAsync(item.url, target);
        await MediaLibrary.saveToLibraryAsync(uri);
        ok++;
      } catch (e) {
        console.warn('[export] failed', item.photoId, e);
      }
    }
    setExporting(false);
    if (ok > 0) haptics.success();
    else haptics.warning();
    dialog.alert(t('saved.doneTitle'), `${ok} / ${saved.length} ${t('saved.doneToRoll')}`, t('common.ok'));
  }

  async function exportAllWeb() {
    setExporting(true);
    try {
      const { ok, failed } = await exportPhotosAsZip(
        saved.map((s) => ({ name: `ourmoment-${s.photoId}`, url: s.url })),
      );
      if (ok > 0) {
        dialog.alert(
          t('saved.doneTitle'),
          failed > 0 ? `${ok} / ${saved.length} ${t('saved.doneToZip')}` : t('saved.zipReady'),
          t('common.ok'),
        );
      } else {
        dialog.alert(t('saved.exportFailedTitle'), t('saved.exportFailedBody'), t('common.ok'));
      }
    } catch (e) {
      console.warn('[export] zip failed', e);
      dialog.alert(t('saved.exportFailedTitle'), t('saved.exportFailedBody'), t('common.ok'));
    } finally {
      setExporting(false);
    }
  }

  function onExportPress() {
    if (saved.length === 0 || exporting) return;
    const isWeb = Platform.OS === 'web';
    dialog.show(t('saved.exportTitle'), isWeb ? t('saved.exportPromptWeb') : t('saved.exportPrompt'), [
      { label: t('saved.cancel'), style: 'cancel' },
      { label: isWeb ? t('saved.downloadZip') : t('saved.saveToRoll'), onPress: isWeb ? exportAllWeb : exportAllNative },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="largeTitle">{t('saved.title')}</Text>
            <Text variant="footnote" dim>
              {saved.length === 0
                ? t('saved.emptyHint')
                : `${saved.length} ${t('saved.keptForever')}${exportedCount ? ` · ${exportedCount} ${t('saved.inCameraRoll')}` : ''}`}
            </Text>
          </View>
          {saved.length > 0 ? (
            exporting ? (
              <ActivityIndicator color={theme.colors.accent} style={{ width: 44 }} />
            ) : (
              <IconButton name="download-outline" surface onPress={onExportPress} />
            )
          ) : null}
        </View>

        <FlatList
          data={saved}
          keyExtractor={(s) => s.photoId}
          numColumns={COLUMNS}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          contentContainerStyle={{ paddingBottom: 110, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: 80 }}>
              <EmptyState glyph="🤍" title={t('saved.emptyTitle')} subtitle={t('saved.emptyBody')} />
            </View>
          }
          ListFooterComponent={
            saved.length > 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 22 }}>
                <BrandMark variant="whisper" />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <PressableScale
              activeScale={0.96}
              haptic
              onLongPress={() => {
                haptics.warning();
                unsave(item.photoId);
              }}
              style={{
                width: tile,
                height: tile,
                marginRight: (index + 1) % COLUMNS === 0 ? 0 : GAP,
                marginBottom: GAP,
              }}
            >
              <Image
                source={{ uri: item.url }}
                style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface }]}
                contentFit="cover"
                transition={150}
                recyclingKey={item.photoId}
              />
              {item.exportedToDevice ? (
                <View style={styles.badge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              ) : null}
            </PressableScale>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
