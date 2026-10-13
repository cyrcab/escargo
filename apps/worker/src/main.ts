// Worker : horaires théoriques SNCF (GTFS, réimport quotidien) et temps réel
// (GTFS-RT national SNCF toutes les 2 minutes ; PRIM pour l'Île-de-France à venir),
// mis en cache par train dans Redis. Le coût ne dépend pas du nombre d'utilisateurs.
import { createDb } from '@escargo/db';
import { Redis } from 'ioredis';
import { env } from './env';
import { importGtfs, isGtfsStale } from './gtfs-import';
import { pollRealtime } from './realtime-poll';

const POLL_INTERVAL_MS = 2 * 60_000;
const GTFS_CHECK_INTERVAL_MS = 3600_000;

const db = createDb(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL);

/** Empêche deux exécutions simultanées d'une même tâche, et journalise ses erreurs. */
function exclusive(name: string, task: () => Promise<void>) {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await task();
    } catch (error) {
      console.error(`[${name}] échec`, error);
    } finally {
      running = false;
    }
  };
}

const refreshGtfs = exclusive('gtfs', async () => {
  if (await isGtfsStale(db)) {
    await importGtfs({ db, url: env.SNCF_GTFS_URL, dataDir: env.DATA_DIR });
  }
});

const poll = exclusive('rt', () => pollRealtime({ redis, url: env.SNCF_GTFS_RT_URL }));

void refreshGtfs();
setInterval(refreshGtfs, GTFS_CHECK_INTERVAL_MS);
void poll();
setInterval(poll, POLL_INTERVAL_MS);
