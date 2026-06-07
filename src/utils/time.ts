/**
 * Time helpers for the 30-day countdown — the emotional pressure of the app.
 */

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface Countdown {
  expired: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  /** 0..1 of the 30-day window remaining. */
  fraction: number;
}

export function getCountdown(expiresAt: number, now = Date.now()): Countdown {
  const totalMs = Math.max(0, expiresAt - now);
  const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
  return {
    expired: totalMs <= 0,
    totalMs,
    days,
    hours,
    minutes,
    fraction: Math.max(0, Math.min(1, totalMs / THIRTY_DAYS_MS)),
  };
}

/** Short human label, e.g. "29 days left", "6 hours left", "Expired". */
export function countdownLabel(c: Countdown): string {
  if (c.expired) return 'Expired';
  if (c.days >= 2) return `${c.days} days left`;
  if (c.days === 1) return '1 day left';
  if (c.hours >= 1) return `${c.hours} ${c.hours === 1 ? 'hour' : 'hours'} left`;
  return `${c.minutes} min left`;
}

/** True once the moment is in its final stretch and saving becomes urgent. */
export function isUrgent(c: Countdown): boolean {
  return !c.expired && c.days <= 3;
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
