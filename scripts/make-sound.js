#!/usr/bin/env node
/**
 * Generates assets/sounds/quest-complete.wav — the celebration chime played
 * with the confetti when a quest is completed. Pure synthesis (no samples):
 * a bright C-major bell arpeggio (C5 E5 G5 C6) with harmonics and a soft
 * exponential decay, mixed with a faint sparkle layer. Re-run any time:
 *
 *   node scripts/make-sound.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const DURATION = 1.15; // seconds
const N = Math.floor(SAMPLE_RATE * DURATION);

const NOTES = [
  { freq: 523.25, at: 0.0 }, // C5
  { freq: 659.25, at: 0.09 }, // E5
  { freq: 783.99, at: 0.18 }, // G5
  { freq: 1046.5, at: 0.27 }, // C6
];

const samples = new Float64Array(N);

for (const { freq, at } of NOTES) {
  const start = Math.floor(at * SAMPLE_RATE);
  for (let i = start; i < N; i++) {
    const t = (i - start) / SAMPLE_RATE;
    // Bell voice: fundamental + 2 soft harmonics, exponential decay.
    const env = Math.exp(-4.2 * t) * Math.min(1, t / 0.012); // fast attack, long tail
    const v =
      Math.sin(2 * Math.PI * freq * t) * 0.55 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.18 * Math.exp(-6 * t) +
      Math.sin(2 * Math.PI * freq * 3.01 * t) * 0.07 * Math.exp(-9 * t);
    samples[i] += v * env * 0.22;
  }
}

// Sparkle layer: tiny high glints scattered through the first 700 ms.
for (let g = 0; g < 10; g++) {
  const at = 0.12 + (g / 10) * 0.6;
  const freq = 2093 + (g % 3) * 523;
  const start = Math.floor(at * SAMPLE_RATE);
  for (let i = start; i < Math.min(N, start + SAMPLE_RATE * 0.12); i++) {
    const t = (i - start) / SAMPLE_RATE;
    samples[i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-30 * t) * 0.035;
  }
}

// Normalise to a comfortable peak well below clipping.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(samples[i]));
const gain = peak > 0 ? 0.82 / peak : 1;

const pcm = Buffer.alloc(N * 2);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * gain)) * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'quest-complete.wav');
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`Wrote ${out} (${((header.length + pcm.length) / 1024).toFixed(1)} kB)`);
