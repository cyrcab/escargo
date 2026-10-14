import {
  mergeTripRealtime,
  pollsKey,
  seenKey,
  TRIP_TTL_SECONDS,
  type TripRealtime,
  tripKey,
} from '@escargo/transit';
import type { ChainableCommander, Redis } from 'ioredis';

/**
 * Met à jour le cache Redis de chaque train lu, fusionné avec l'état précédent pour
 * garder les arrêts que le flux a déjà retirés. `extra` ajoute des écritures à la même
 * transmission (compteurs du flux).
 */
export async function writeTrips(
  redis: Redis,
  trips: TripRealtime[],
  feedTimestamp: number,
  extra: (write: ChainableCommander) => void,
) {
  const keys = trips.map((trip) => tripKey(trip.serviceDate, trip.tripId));
  const cached = keys.length > 0 ? await redis.mget(keys) : [];

  const write = redis.pipeline();
  const dates = new Set<string>();
  trips.forEach((trip, i) => {
    const merged = mergeTripRealtime(parseCached(cached[i]), trip);
    write.set(keys[i] as string, JSON.stringify(merged), 'EX', TRIP_TTL_SECONDS);
    write.sadd(seenKey(trip.serviceDate), trip.tripId);
    dates.add(trip.serviceDate);
  });
  for (const date of dates) {
    write.expire(seenKey(date), 7 * 24 * 3600);
    write.hsetnx(pollsKey(date), 'first', feedTimestamp);
    write.hset(pollsKey(date), 'last', feedTimestamp);
    write.expire(pollsKey(date), 7 * 24 * 3600);
  }
  extra(write);
  const results = await write.exec();
  const failed = results?.find(([error]) => error);
  if (failed) throw failed[0];
}

/** Une entrée illisible (forme changée après un déploiement) est simplement réécrite. */
function parseCached(value: string | null | undefined): TripRealtime | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as TripRealtime;
  } catch {
    return null;
  }
}
