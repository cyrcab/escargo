// Worker : horaires théoriques SNCF (GTFS, réimport quotidien) et temps réel
// (GTFS-RT national SNCF toutes les 2 minutes, PRIM pour l'Île-de-France),
// mis en cache par train dans Redis. Le coût ne dépend pas du nombre d'utilisateurs.
import { createDb } from '@escargo/db';
import { env } from './env';
import { importGtfs, isGtfsStale } from './gtfs-import';

const POLL_INTERVAL_MS = 2 * 60_000;
const GTFS_CHECK_INTERVAL_MS = 3600_000;

const db = createDb(env.DATABASE_URL);

let gtfsRunning = false;
async function refreshGtfs() {
  if (gtfsRunning) return;
  gtfsRunning = true;
  try {
    if (await isGtfsStale(db)) {
      await importGtfs({ db, url: env.SNCF_GTFS_URL, dataDir: env.DATA_DIR });
    }
  } catch (error) {
    console.error('[gtfs] import échoué', error);
  } finally {
    gtfsRunning = false;
  }
}

async function poll() {
  // TODO(#3) : ingestion GTFS-RT SNCF + PRIM, cache Redis par trip_id.
  console.log(`[worker] poll ${new Date().toISOString()}`);
}

void refreshGtfs();
setInterval(refreshGtfs, GTFS_CHECK_INTERVAL_MS);
await poll();
setInterval(poll, POLL_INTERVAL_MS);
