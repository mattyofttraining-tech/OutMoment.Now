import React from 'react';
import { Dimensions, FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';
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
  const screenW = Dimensions.get('window').width;
  const tile = (screenW - GAP * (COLUMNS - 1)) / COLUMNS;

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
