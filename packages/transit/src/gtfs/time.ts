/**
 * Heure GTFS `HH:MM:SS` → secondes depuis minuit du jour de service.
 * Peut dépasser 24 h : un train parti à 23 h 50 arrive à `24:25:00`.
 */
export function parseGtfsTime(value: string): number {
  const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(value.trim());
  if (!match) throw new Error(`Heure GTFS invalide : "${value}"`);
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function formatGtfsTime(seconds: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

/** Décalage du fuseau par rapport à UTC, en millisecondes, à un instant donné. */
function timeZoneOffsetMs(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epochMs));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * Instant (secondes epoch) → secondes depuis le début du jour de service `YYYY-MM-DD`,
 * comparable aux heures GTFS. Le GTFS mesure depuis « midi moins 12 h », ce qui reste
 * juste les jours de changement d'heure.
 */
export function serviceDaySeconds(
  epochSeconds: number,
  serviceDate: string,
  timeZone = 'Europe/Paris',
): number {
  const [y, m, d] = serviceDate.split('-').map(Number) as [number, number, number];
  const noonGuess = Date.UTC(y, m - 1, d, 12);
  const noon = noonGuess - timeZoneOffsetMs(noonGuess, timeZone);
  return epochSeconds - (noon / 1000 - 12 * 3600);
}
