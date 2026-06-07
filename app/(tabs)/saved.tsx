import React from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { EmptyState, PressableScale, Text } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { haptics } from '@/utils/haptics';

const COLUMNS = 3;
const GAP = 3;

export default function SavedScreen() {
  const theme = useTheme();
  const saved = useAppStore((s) => s.saved);
  const unsave = useAppStore((s) => s.unsave);

  const tile = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS;
  const exportedCount = saved.filter((s) => s.exportedToDevice).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text variant="largeTitle">Saved</Text>
          <Text variant="footnote" dim>
            {saved.length === 0
              ? 'Your keepers live here — forever.'
              : `${saved.length} kept forever${exportedCount ? ` · ${exportedCount} in your camera roll` : ''}`}
          </Text>
        </View>

        <FlatList
          data={saved}
          keyExtractor={(s) => s.photoId}
          numColumns={COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: 80 }}>
              <EmptyState
                glyph="🤍"
                title="Nothing saved yet"
                subtitle="Open the Save swipe and keep the photos that matter. Everything you keep here is permanent."
              />
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
