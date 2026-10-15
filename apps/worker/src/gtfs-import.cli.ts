// Import manuel d'un GTFS, même s'il n'est pas dû :
// pnpm --filter @escargo/worker gtfs:import [sncf|idfm]
import { createDb } from '@escargo/db';
import { env } from './env';
import { importGtfs } from './gtfs-import';
import { importIdfmGtfs } from './idfm-import';

const feed = process.argv[2] ?? 'sncf';
const db = createDb(env.DATABASE_URL);
if (feed === 'idfm') {
  await importIdfmGtfs({ db, url: env.IDFM_GTFS_URL, dataDir: env.DATA_DIR });
} else if (feed === 'sncf') {
  await importGtfs({ db, url: env.SNCF_GTFS_URL, dataDir: env.DATA_DIR });
} else {
  console.error(`Flux inconnu : ${feed} (sncf ou idfm)`);
  process.exitCode = 1;
}
await db.$client.end();
