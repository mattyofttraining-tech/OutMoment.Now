import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Button, IconButton, PressableScale, Text } from '@/components/ui';
import { Confetti } from '@/components/Confetti';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { haptics } from '@/utils/haptics';
import { sound } from '@/utils/sound';
import { localizeQuest } from '@/i18n/questTranslations';

export default function CaptureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { questId } = useLocalSearchParams<{ questId?: string }>();
  // Nudge the back button below Apple's Dynamic Island / curved bezel so it's
  // comfortably within thumb reach (the safe-area inset alone isn't enough).
  const backOffset = Dimensions.get('window').height * 0.075;
  // Lift the bottom controls (gallery / shutter / flip) up off the very edge.
  const buttonLift = Dimensions.get('window').height * 0.05;

  const activeEventId = useAppStore((s) => s.activeEventId);
  const questsByEvent = useAppStore((s) => s.questsByEvent);
  const capture = useAppStore((s) => s.capture);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Full-screen modal has no swipe-to-dismiss, so the X is the only way out.
  // router.back() no-ops when there's no history — fall back to the event home
  // so the close button can never become a dead end.
  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const [facing, setFacing] = useState<CameraType>('back');
  const [busy, setBusy] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  // The frozen still shown over the live camera once a shot is taken, so users
  // get instant visual confirmation and know they can stop holding still.
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const quest = useMemo(() => {
    if (!activeEventId || !questId) return undefined;
    const found = (questsByEvent[activeEventId] ?? []).find((q) => q.id === questId);
    return found ? localizeQuest(found, locale) : undefined;
  }, [activeEventId, questId, questsByEvent, locale]);

  const handleUpload = useCallback(
    async (uri: string) => {
      if (!activeEventId) return;
      setCapturedUri(uri); // freeze the frame immediately as visual confirmation
      setBusy(true);
      try {
        await capture(activeEventId, uri, questId ?? null);
        if (quest) {
          // Quest complete — the full celebration: haptic, chime, confetti.
          haptics.success();
          sound.celebrate();
        } else {
          haptics.medium();
        }
        setJustCaptured(true);
        // Give the quest celebration room to land; plain captures stay snappy.
        setTimeout(
          () => {
            setJustCaptured(false);
            dismiss();
          },
          quest ? 1500 : 850,
        );
      } catch (e) {
        console.warn('[capture] upload failed', e);
        haptics.warning();
        setCapturedUri(null); // drop the freeze so the live camera resumes for a retry
        setBusy(false);
      }
    },
    [activeEventId, capture, questId, quest, dismiss],
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
            {t('capture.permTitle')}
          </Text>
          <Text variant="callout" color="rgba(255,255,255,0.7)" align="center">
            {t('capture.permBody')}
          </Text>
          <Button label={t('capture.allow')} onPress={requestPermission} />
          <Button label={t('capture.later')} variant="ghost" onPress={dismiss} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.black}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Frozen still over the live feed: instant confirmation, and it tells the
          user they no longer need to hold the camera steady. */}
      {capturedUri ? (
        <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}

      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.bottomGradient} pointerEvents="none" />

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ transform: [{ translateY: backOffset }] }}>
            <IconButton
              name="arrow-back"
              color="#fff"
              size={28}
              style={styles.backButton}
              hitSlop={16}
              onPress={dismiss}
            />
          </View>
          {quest ? (
            <View style={styles.questChip}>
              <Text variant="caption" color="#fff">
                {quest.icon} {quest.title}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {/* Spacer to keep the quest chip centered (flip moved to the shutter row). */}
          <View style={{ width: 48 }} />
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

        {/* Shutter row — gallery (left) and camera-flip (right) flank the shutter
            so both are within easy thumb reach at the bottom of the screen. */}
        <View style={[styles.shutterRow, { marginBottom: buttonLift }]}>
          <IconButton name="images" color="#fff" surface size={26} onPress={pickFromLibrary} />
          <PressableScale onPress={takePhoto} disabled={busy} activeScale={0.92} style={styles.shutterOuter}>
            <View style={styles.shutterInner}>{busy ? <ActivityIndicator color="#000" /> : null}</View>
          </PressableScale>
          <IconButton
            name="camera-reverse"
            color="#fff"
            surface
            size={26}
            hitSlop={12}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          />
        </View>
      </SafeAreaView>

      {/* Capture confirmation flash */}
      {justCaptured ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(300)} style={styles.confirm}>
          {quest ? <Confetti count={44} /> : null}
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.success} />
          <Text variant="title3" color="#fff" style={{ marginTop: 8 }}>
            {quest ? t('capture.questComplete') : t('capture.added')}
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
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12 },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
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
