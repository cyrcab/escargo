// Import manuel du GTFS SNCF, même si le dernier date de moins de 24 h :
// pnpm --filter @escargo/worker gtfs:import
import { createDb } from '@escargo/db';
import { env } from './env';
import { importGtfs } from './gtfs-import';

const db = createDb(env.DATABASE_URL);
await importGtfs({ db, url: env.SNCF_GTFS_URL, dataDir: env.DATA_DIR });
await db.$client.end();
