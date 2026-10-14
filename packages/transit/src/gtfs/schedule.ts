import { serviceDaySeconds } from './time';

const parisDate = (epochSeconds: number, offsetDays = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(
    new Date((epochSeconds + offsetDays * 86_400) * 1000),
  );

/**
 * Dernier créneau d'import (heure de Paris `HH:MM`) déjà passé à l'instant `now`,
 * en secondes epoch. Cherche aujourd'hui puis hier.
 */
export function lastSlotBefore(now: Date, slots: readonly string[]): number {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const slotSeconds = slots
    .map((slot) => {
      const [h, m] = slot.split(':').map(Number) as [number, number];
      return h * 3600 + m * 60;
    })
    .sort((a, b) => b - a);

  for (const offset of [0, -1]) {
    const date = parisDate(nowSeconds, offset);
    const dayStart = nowSeconds - serviceDaySeconds(nowSeconds, date);
    for (const slot of slotSeconds) {
      if (dayStart + slot <= nowSeconds) return dayStart + slot;
    }
  }
  throw new Error('Aucun créneau d’import défini');
}

/** Un import est dû si aucune vérification n'a eu lieu depuis le dernier créneau passé. */
export function isImportDue(
  lastCheckedAt: Date | null,
  now: Date,
  slots: readonly string[],
): boolean {
  return !lastCheckedAt || lastCheckedAt.getTime() / 1000 < lastSlotBefore(now, slots);
}
