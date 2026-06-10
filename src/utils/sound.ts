import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/**
 * One-shot celebration sounds, crash-safe like `haptics`. Players are created
 * lazily and reused; every call is wrapped so a missing audio backend (old
 * browser, stripped simulator) can never take a feature down with it.
 *
 * iOS silent-mode is respected on purpose — a wedding guest's phone must never
 * chime from their pocket.
 */

const QUEST_COMPLETE = require('../../assets/sounds/quest-complete.wav');

let questPlayer: AudioPlayer | null = null;

export const sound = {
  /** The confetti chime: quest completed, save session finished. */
  celebrate() {
    try {
      if (!questPlayer) questPlayer = createAudioPlayer(QUEST_COMPLETE);
      questPlayer.seekTo(0);
      questPlayer.play();
    } catch (e) {
      console.warn('[sound] celebrate failed', e);
      questPlayer = null; // recreate on next attempt
    }
  },
};
