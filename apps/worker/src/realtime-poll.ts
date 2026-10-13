import { decodeTripUpdates, mergeTripRealtime, type TripRealtime } from '@escargo/transit';
import type { Redis } from 'ioredis';
import { FEED_KEY, pollsKey, seenKey, TRIP_TTL_SECONDS, tripKey } from './realtime-keys';

export interface RealtimePollOptions {
  redis: Redis;
  url: string;
}

/**
 * Lit le flux GTFS-RT SNCF et met à jour le cache Redis de chaque train présent,
 * fusionné avec l'état précédent pour garder les arrêts que le flux a déjà retirés.
 * Ne fait rien si le flux n'a pas changé depuis le dernier relevé.
 */
export async function pollRealtime({ redis, url }: RealtimePollOptions) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GTFS-RT SNCF : HTTP ${response.status}`);
  const feed = decodeTripUpdates(new Uint8Array(await response.arrayBuffer()));

  const lastTimestamp = Number(await redis.hget(FEED_KEY, 'timestamp'));
  if (feed.timestamp <= lastTimestamp) {
    console.log('[rt] flux inchangé');
    return;
  }

  const keys = feed.trips.map((trip) => tripKey(trip.serviceDate, trip.tripId));
  const cached = keys.length > 0 ? await redis.mget(keys) : [];

  const write = redis.pipeline();
  const dates = new Set<string>();
  feed.trips.forEach((trip, i) => {
    const previous = cached[i] ? (JSON.parse(cached[i]) as TripRealtime) : null;
    const merged = mergeTripRealtime(previous, trip);
    write.set(
      tripKey(trip.serviceDate, trip.tripId),
      JSON.stringify(merged),
      'EX',
      TRIP_TTL_SECONDS,
    );
    write.sadd(seenKey(trip.serviceDate), trip.tripId);
    dates.add(trip.serviceDate);
  });
  for (const date of dates) {
    write.expire(seenKey(date), 7 * 24 * 3600);
    write.hsetnx(pollsKey(date), 'first', feed.timestamp);
    write.hset(pollsKey(date), 'last', feed.timestamp);
    write.expire(pollsKey(date), 7 * 24 * 3600);
  }
  const cancelled = feed.trips.filter((t) => t.status === 'cancelled').length;
  write.hset(FEED_KEY, {
    timestamp: feed.timestamp,
    trips: feed.trips.length,
    cancelled,
    polledAt: Math.floor(Date.now() / 1000),
  });
  const results = await write.exec();
  const failed = results?.find(([error]) => error);
  if (failed) throw failed[0];

  console.log(`[rt] ${feed.trips.length} trains en cache, dont ${cancelled} supprimés`);
}
