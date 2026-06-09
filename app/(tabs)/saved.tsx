import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '@/theme';
import { EmptyState, IconButton, PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';

const COLUMNS = 3;
const GAP = 3;

export default function SavedScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const saved = useAppStore((s) => s.saved);
  const unsave = useAppStore((s) => s.unsave);

  const tile = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS;
  const exportedCount = saved.filter((s) => s.exportedToDevice).length;
  const [exporting, setExporting] = useState(false);

  async function exportAll() {
    if (saved.length === 0 || exporting) return;
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('saved.permTitle'), t('saved.permBody'));
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
    Alert.alert(t('saved.doneTitle'), `${ok} / ${saved.length} ${t('saved.doneToRoll')}`);
  }

  function onExportPress() {
    Alert.alert(t('saved.exportTitle'), t('saved.exportPrompt'), [
      { text: t('saved.cancel'), style: 'cancel' },
      { text: t('saved.saveToRoll'), onPress: exportAll },
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
          contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: 80 }}>
              <EmptyState glyph="🤍" title={t('saved.emptyTitle')} subtitle={t('saved.emptyBody')} />
            </View>
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
