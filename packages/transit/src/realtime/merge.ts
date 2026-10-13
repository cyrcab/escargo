import type { TripRealtime } from './decode';

/**
 * Fusionne une nouvelle lecture d'un train avec celle déjà en cache.
 * Le flux retire souvent les arrêts déjà passés, puis le train entier une fois arrivé :
 * on garde donc la dernière valeur connue de chaque arrêt absent de la nouvelle lecture.
 * Une lecture plus ancienne que le cache ne l'écrase pas.
 */
export function mergeTripRealtime(cached: TripRealtime | null, next: TripRealtime): TripRealtime {
  if (!cached) return next;
  if (next.updatedAt < cached.updatedAt) return cached;

  const stops = new Map(cached.stops.map((stop) => [stop.stopId, stop]));
  for (const stop of next.stops) stops.set(stop.stopId, stop);

  return { ...next, stops: [...stops.values()] };
}
