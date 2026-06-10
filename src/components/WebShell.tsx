import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandMark } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Desktop-web presentation frame. Phones (and the native app) pass straight
 * through; on a wide browser window the app renders inside a centred,
 * phone-proportioned column over a quiet brand backdrop — so the PWA reads as
 * a designed product on a laptop instead of a phone layout stretched to 1920px.
 *
 * The component tree is identical in both modes (only styles change), so
 * resizing across the breakpoint can never remount the navigator and lose
 * navigation state.
 */

const FRAME_MAX_WIDTH = 480;
const BREAKPOINT = 768;

export function WebShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width >= BREAKPOINT;

  return (
    <View style={framed ? styles.backdrop : styles.fill}>
      {framed ? (
        <LinearGradient
          // Near-black canvas with a faint wash of the brand periwinkle/peach.
          colors={['#0B0B0F', '#101018', 'rgba(113,125,173,0.18)', '#0B0B0F']}
          locations={[0, 0.45, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View
        style={
          framed
            ? [
                styles.frame,
                theme.shadows.xl,
                { backgroundColor: theme.colors.background, borderColor: 'rgba(255,255,255,0.1)' },
              ]
            : styles.fill
        }
      >
        {children}
      </View>

      {framed ? (
        <View style={styles.brand} pointerEvents="none">
          <BrandMark variant="whisper" onPhoto />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignSelf: 'stretch' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME_MAX_WIDTH,
    flex: 1,
    marginVertical: 28,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  brand: { position: 'absolute', bottom: 8, alignSelf: 'center' },
});
