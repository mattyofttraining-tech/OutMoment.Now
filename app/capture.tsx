import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, IconButton, PressableScale, Text } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { useAppStore } from '@/store/useAppStore';
import { haptics } from '@/utils/haptics';

export default function CaptureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { questId } = useLocalSearchParams<{ questId?: string }>();

  const activeEventId = useAppStore((s) => s.activeEventId);
  const questsByEvent = useAppStore((s) => s.questsByEvent);
  const capture = useAppStore((s) => s.capture);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);

  const quest = useMemo(() => {
    if (!activeEventId || !questId) return undefined;
    return (questsByEvent[activeEventId] ?? []).find((q) => q.id === questId);
  }, [activeEventId, questId, questsByEvent]);

  const handleUpload = useCallback(
    async (uri: string) => {
      if (!activeEventId) return;
      setBusy(true);
      try {
        await capture(activeEventId, uri, questId ?? null);
        if (quest) haptics.success();
        else haptics.medium();
        setJustCaptured(true);
        setTimeout(() => {
          setJustCaptured(false);
          router.back();
        }, 850);
      } catch {
        haptics.warning();
        setBusy(false);
      }
    },
    [activeEventId, capture, questId, quest, router],
  );

  const takePhoto = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    haptics.light();
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (photo?.uri) await handleUpload(photo.uri);
  }, [busy, handleUpload]);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) await handleUpload(result.assets[0].uri);
  }, [handleUpload]);

  if (!permission) {
    return <View style={styles.black} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.black, { justifyContent: 'center', padding: 24 }]}>
        <View style={{ gap: 16, alignItems: 'center' }}>
          <Ionicons name="camera" size={48} color="#fff" />
          <Text variant="title2" color="#fff" align="center">
            Capture the moment
          </Text>
          <Text variant="callout" color="rgba(255,255,255,0.7)" align="center">
            OurMoment needs the camera so you can add to your event’s shared photos.
          </Text>
          <Button label="Allow camera" onPress={requestPermission} />
          <Button label="Maybe later" variant="ghost" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.bottomGradient} pointerEvents="none" />

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <IconButton name="close" color="#fff" surface onPress={() => router.back()} />
          {quest ? (
            <View style={styles.questChip}>
              <Text variant="caption" color="#fff">
                {quest.icon} {quest.title}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <IconButton name="camera-reverse" color="#fff" surface onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
        </View>

        {quest ? (
          <View style={styles.prompt}>
            <Text variant="title3" color="#fff" align="center">
              {quest.prompt}
            </Text>
          </View>
        ) : (
          <View />
        )}

        {/* Shutter row */}
        <View style={styles.shutterRow}>
          <IconButton name="images" color="#fff" surface size={26} onPress={pickFromLibrary} />
          <PressableScale onPress={takePhoto} disabled={busy} activeScale={0.92} style={styles.shutterOuter}>
            <View style={styles.shutterInner}>{busy ? <ActivityIndicator color="#000" /> : null}</View>
          </PressableScale>
          <View style={{ width: 46 }} />
        </View>
      </SafeAreaView>

      {/* Capture confirmation flash */}
      {justCaptured ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(300)} style={styles.confirm}>
          {quest ? <Confetti /> : null}
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.success} />
          <Text variant="title3" color="#fff" style={{ marginTop: 8 }}>
            {quest ? 'Quest complete!' : 'Added to the moment'}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  chrome: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 },
  questChip: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  prompt: { paddingHorizontal: 32, alignItems: 'center' },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, paddingBottom: 12 },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterTap: { width: 64, height: 64, borderRadius: 32 },
  confirm: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
});
