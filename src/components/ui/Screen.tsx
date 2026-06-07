import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  background?: string;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

/**
 * Standard screen container: safe-area aware, themed background, optional
 * scrolling. Keeps every screen's chrome consistent.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  background,
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useTheme();
  const bg = background ?? theme.colors.background;
  const pad = padded ? { paddingHorizontal: theme.spacing.lg } : null;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[pad, { paddingBottom: theme.spacing.huge }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: bg }, style]}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
