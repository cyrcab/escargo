// Worker : horaires théoriques (GTFS SNCF chaque jour, GTFS IDFM trois fois par jour)
// et temps réel (GTFS-RT national SNCF et PRIM pour l'Île-de-France, toutes les 2 minutes),
// mis en cache par train dans Redis. Le coût ne dépend pas du nombre d'utilisateurs.
import { createDb } from '@escargo/db';
import { Redis } from 'ioredis';
import { env } from './env';
import { importGtfs, isGtfsStale } from './gtfs-import';
import { importIdfmGtfs, isIdfmImportDue } from './idfm-import';
import { pollPrim } from './prim-poll';
import { pollRealtime } from './realtime-poll';

const POLL_INTERVAL_MS = 2 * 60_000;
const GTFS_CHECK_INTERVAL_MS = 15 * 60_000;

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

// Les deux imports partagent un verrou : deux transactions de plusieurs minutes en même
// temps ralentiraient la base sans rien gagner. Un échec SNCF ne bloque pas l'import IDFM.
const refreshGtfs = exclusive('gtfs', async () => {
  try {
    if (await isGtfsStale(db)) {
      await importGtfs({ db, url: env.SNCF_GTFS_URL, dataDir: env.DATA_DIR });
    }
  } catch (error) {
    console.error('[gtfs] échec import SNCF', error);
  }
  if (await isIdfmImportDue(db)) {
    await importIdfmGtfs({ db, url: env.IDFM_GTFS_URL, dataDir: env.DATA_DIR });
  }
});

const poll = exclusive('rt', () => pollRealtime({ redis, url: env.SNCF_GTFS_RT_URL }));

void refreshGtfs();
setInterval(refreshGtfs, GTFS_CHECK_INTERVAL_MS);
void poll();
setInterval(poll, POLL_INTERVAL_MS);

const { PRIM_API_KEY } = env;
if (PRIM_API_KEY) {
  const pollIdf = exclusive('prim', () =>
    pollPrim({ db, redis, url: env.PRIM_ESTIMATED_TIMETABLE_URL, apiKey: PRIM_API_KEY }),
  );
  void pollIdf();
  setInterval(pollIdf, POLL_INTERVAL_MS);
} else {
  console.warn('[prim] PRIM_API_KEY absente : pas de temps réel RER et Transilien');
}
