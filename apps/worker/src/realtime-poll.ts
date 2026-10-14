import { decodeTripUpdates, FEED_KEY } from '@escargo/transit';
import type { Redis } from 'ioredis';
import { writeTrips } from './realtime-cache';

export interface RealtimePollOptions {
  redis: Redis;
  url: string;
}

/**
 * Lit le flux GTFS-RT SNCF et met à jour le cache Redis de chaque train présent.
 * Ne fait rien si le flux n'a pas changé depuis le dernier relevé.
 */
export async function pollRealtime({ redis, url }: RealtimePollOptions) {
  // Sans timeout, un flux bloqué garderait le verrou du poll pour toujours.
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`GTFS-RT SNCF : HTTP ${response.status}`);
  const feed = decodeTripUpdates(new Uint8Array(await response.arrayBuffer()));

  // Sans horodatage, impossible de savoir si le flux a changé : mieux vaut une erreur visible.
  if (!feed.timestamp) throw new Error('GTFS-RT SNCF : flux sans horodatage');

  const lastTimestamp = Number(await redis.hget(FEED_KEY, 'timestamp'));
  // Égalité seulement : si le fournisseur repart en arrière, on continue à lire le flux
  // (la fusion par train ignore déjà les lectures plus anciennes que le cache).
  if (feed.timestamp === lastTimestamp) {
    console.log('[rt] flux inchangé');
    return;
  }

  const cancelled = feed.trips.filter((t) => t.status === 'cancelled').length;
  await writeTrips(redis, feed.trips, feed.timestamp, (write) =>
    write.hset(FEED_KEY, {
      timestamp: feed.timestamp,
      trips: feed.trips.length,
      cancelled,
      polledAt: Math.floor(Date.now() / 1000),
    }),
  );

  console.log(`[rt] ${feed.trips.length} trains en cache, dont ${cancelled} supprimés`);
}
