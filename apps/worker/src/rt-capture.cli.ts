// Capture d'une journée de la ligne test pour les fixtures de @escargo/transit : horaires
// prévus et dernière lecture temps réel de chaque train. À lancer chaque soir où le worker
// a tourné (le cache garde un train 48 h). Données publiques de trains seulement.
// pnpm --filter @escargo/worker rt:capture [YYYY-MM-DD] [lignes, défaut C6,C16]
import { mkdir, writeFile } from 'node:fs/promises';
import { createDb } from '@escargo/db';
import { Redis } from 'ioredis';
import { env } from './env';
import { findScheduledTrains, readCachedTrips } from './train-lookup';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const date = process.argv[2] ?? today;
const lines = (process.argv[3] ?? 'C6,C16').split(',');
const outDir = new URL('../../../packages/transit/src/__fixtures__/ligne-test/', import.meta.url);

const db = createDb(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL);

await mkdir(outDir, { recursive: true });
for (const line of lines) {
  const trains = await findScheduledTrains(db, date, { line });
  const realtime = await readCachedTrips(
    redis,
    date,
    trains.map((t) => t.tripId),
  );
  const capture = {
    line,
    serviceDate: date,
    trains: trains.map((train, i) => ({ ...train, realtime: realtime[i] ?? null })),
  };
  const file = new URL(`${line}-${date}.json`, outDir);
  await writeFile(file, `${JSON.stringify(capture, null, 2)}\n`);
  const seen = capture.trains.filter((t) => t.realtime).length;
  console.log(`${line} : ${seen}/${trains.length} trains vus en temps réel → ${file.pathname}`);
}

redis.disconnect();
await db.$client.end();
