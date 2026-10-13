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
