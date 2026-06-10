import React, { useState } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Photo } from '@/types';
import { useTheme } from '@/theme';
import { PressableScale } from '@/components/ui';

const COLUMNS = 3;
const GAP = 3;

export interface PhotoGridProps {
  photos: Photo[];
  savedIds: Set<string>;
  onPressPhoto: (photo: Photo, index: number) => void;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function PhotoGrid({
  photos,
  savedIds,
  onPressPhoto,
  ListHeaderComponent,
  ListEmptyComponent,
}: PhotoGridProps) {
  const theme = useTheme();
  // Measure the list, don't trust the window: on desktop web the app renders
  // inside a centred frame much narrower than the window.
  const [gridWidth, setGridWidth] = useState(0);
  const tile = gridWidth > 0 ? (gridWidth - GAP * (COLUMNS - 1)) / COLUMNS : 0;

  const renderItem: ListRenderItem<Photo> = ({ item, index }) => (
    <PressableScale
      activeScale={0.97}
      onPress={() => onPressPhoto(item, index)}
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
        transition={180}
        recyclingKey={item.id}
      />
      {savedIds.has(item.id) ? (
        <View style={styles.savedBadge}>
          <Ionicons name="heart" size={13} color="#fff" />
        </View>
      ) : null}
    </PressableScale>
  );

  return (
    <FlatList
      data={photos}
      keyExtractor={(p) => p.id}
      renderItem={renderItem}
      numColumns={COLUMNS}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ paddingBottom: 120 }}
    />
  );
}

const styles = StyleSheet.create({
  savedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
