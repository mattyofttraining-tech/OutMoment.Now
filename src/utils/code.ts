import type { EventType } from '@/types';

/**
 * Human-friendly join codes: an evocative word + four digits, e.g. "SUNSET-4827".
 * Easy to read aloud at a party, hard enough to not collide casually. The real
 * uniqueness guarantee lives server-side (the createEvent Cloud Function
 * retries on collision); this is the generator both sides share.
 */

const WORDS: Record<EventType, string[]> = {
  marriage: ['SUNSET', 'FOREVER', 'VOWS', 'GOLDEN', 'EVERAFTER', 'LINEN'],
  confirmation: ['GRACE', 'MILESTONE', 'CANDLE', 'PROMISE', 'HARBOR'],
  baptism: ['DOVE', 'STILLWATER', 'DAWN', 'CRADLE', 'WILLOW'],
  birthday: ['CONFETTI', 'SPARK', 'WISH', 'PARADE', 'NEON', 'CITRUS'],
  special: ['MOMENT', 'AURORA', 'EMBER', 'COMPASS', 'LANTERN', 'TIDE'],
};

export function makeJoinCode(type: EventType): string {
  const words = WORDS[type];
  const word = words[Math.floor(Math.random() * words.length)] ?? 'MOMENT';
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${digits}`;
}

/** Normalise user input for comparison: trim, upper-case, collapse spaces. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
