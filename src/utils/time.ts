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

/** i18n key + count for the countdown label; render with t(key, { count }). */
export function countdownParts(c: Countdown): { key: string; count: number } {
  if (c.expired) return { key: 'countdown.passed', count: 0 };
  if (c.days >= 2) return { key: 'countdown.expiresDays', count: c.days };
  if (c.days === 1) return { key: 'countdown.expiresDay', count: 1 };
  if (c.hours >= 1) return { key: 'countdown.expiresHours', count: c.hours };
  return { key: 'countdown.expiresMins', count: c.minutes };
}

/** True once the moment is in its final stretch and saving becomes urgent. */
export function isUrgent(c: Countdown): boolean {
  return !c.expired && c.days <= 3;
}

/** i18n key + count for "x ago" labels; render with t(key, { count }). */
export function relativeTimeParts(ts: number, now = Date.now()): { key: string; count: number } {
  const diff = now - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return { key: 'time.justNow', count: 0 };
  if (m < 60) return { key: 'time.minutesAgo', count: m };
  const h = Math.floor(m / 60);
  if (h < 24) return { key: 'time.hoursAgo', count: h };
  return { key: 'time.daysAgo', count: Math.floor(h / 24) };
}
