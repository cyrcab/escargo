import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type createDb, schema } from '@escargo/db';
import type { TrainMode } from '@escargo/shared';
import {
  iterateCsv,
  modeFromStopId,
  ROUTE_COLUMNS,
  SERVICE_DATE_COLUMNS,
  STOP_COLUMNS,
  STOP_TIME_COLUMNS,
  selectRailStops,
  TRIP_COLUMNS,
  toRoute,
  toServiceDate,
  toStop,
  toStopTime,
  toTrip,
} from '@escargo/transit';
import { desc, eq } from 'drizzle-orm';
import { unzipSync } from 'fflate';

type Db = ReturnType<typeof createDb>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

const STALE_AFTER_MS = 24 * 3600_000;
const BATCH_SIZE = 5000;

export interface GtfsImportOptions {
  db: Db;
  url: string;
  dataDir: string;
}

/** Le dernier import (ou la dernière vérification) date de plus de 24 h. */
export async function isGtfsStale(db: Db, now = new Date()): Promise<boolean> {
  const [last] = await db
    .select({ checkedAt: schema.gtfsImports.checkedAt })
    .from(schema.gtfsImports)
    .orderBy(desc(schema.gtfsImports.checkedAt))
    .limit(1);
  return !last || now.getTime() - last.checkedAt.getTime() > STALE_AFTER_MS;
}

/**
 * Télécharge le GTFS SNCF, et s'il a changé depuis le dernier import, remplace
 * les horaires théoriques en base dans une seule transaction (l'API ne voit
 * jamais de tables à moitié remplies). Seuls les trains sont gardés.
 */
export async function importGtfs({ db, url, dataDir }: GtfsImportOptions) {
  const started = Date.now();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GTFS SNCF : HTTP ${response.status}`);
  const zip = new Uint8Array(await response.arrayBuffer());
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, 'sncf-gtfs.zip'), zip);

  const feedHash = createHash('sha256').update(zip).digest('hex');
  const [last] = await db
    .select()
    .from(schema.gtfsImports)
    .orderBy(desc(schema.gtfsImports.importedAt))
    .limit(1);
  if (last?.feedHash === feedHash) {
    await db
      .update(schema.gtfsImports)
      .set({ checkedAt: new Date() })
      .where(eq(schema.gtfsImports.id, last.id));
    console.log('[gtfs] flux inchangé, rien à importer');
    return;
  }

  // Un fichier à la fois : stop_times.txt fait ~80 Mo décompressé.
  const read = (name: string) => {
    const file = unzipSync(zip, { filter: (f) => f.name === name })[name];
    if (!file) throw new Error(`GTFS SNCF : ${name} absent du zip`);
    return file;
  };

  const counts = await db.transaction(async (tx) => {
    await tx.delete(schema.gtfsStopTimes);
    await tx.delete(schema.gtfsTrips);
    await tx.delete(schema.gtfsServiceDates);
    await tx.delete(schema.gtfsRoutes);
    await tx.delete(schema.gtfsStops);

    const stops = selectRailStops([...iterateCsv(read('stops.txt'), STOP_COLUMNS)].map(toStop));
    await insertBatches(tx, schema.gtfsStops, stops);
    const railStopIds = new Set(stops.filter((s) => !s.isStation).map((s) => s.id));

    // Le mode d'un train se déduit de ses points d'arrêt ; un trajet sans arrêt train
    // (car de substitution) disparaît.
    const tripModes = new Map<string, TrainMode>();
    const stopTimes = await insertStream(tx, schema.gtfsStopTimes, function* () {
      for (const row of iterateCsv(read('stop_times.txt'), STOP_TIME_COLUMNS)) {
        if (!railStopIds.has(row.stop_id)) continue;
        const stopTime = toStopTime(row);
        if (!tripModes.has(stopTime.tripId)) {
          const mode = modeFromStopId(stopTime.stopId);
          if (mode) tripModes.set(stopTime.tripId, mode);
        }
        yield stopTime;
      }
    });

    const serviceIds = new Set<string>();
    const routeIds = new Set<string>();
    const trips = await insertStream(tx, schema.gtfsTrips, function* () {
      for (const row of iterateCsv(read('trips.txt'), TRIP_COLUMNS)) {
        const mode = tripModes.get(row.trip_id);
        if (!mode) continue;
        const trip = toTrip(row);
        serviceIds.add(trip.serviceId);
        routeIds.add(trip.routeId);
        yield { ...trip, mode };
      }
    });

    await insertBatches(
      tx,
      schema.gtfsRoutes,
      [...iterateCsv(read('routes.txt'), ROUTE_COLUMNS)]
        .map(toRoute)
        .filter((r) => routeIds.has(r.id)),
    );

    await insertStream(tx, schema.gtfsServiceDates, function* () {
      for (const row of iterateCsv(read('calendar_dates.txt'), SERVICE_DATE_COLUMNS)) {
        const serviceDate = toServiceDate(row);
        if (serviceDate && serviceIds.has(serviceDate.serviceId)) yield serviceDate;
      }
    });

    const [feedInfo] = iterateCsv(read('feed_info.txt'), ['feed_version']);
    const counts = { stops: stops.length, trips, stopTimes };
    await tx.insert(schema.gtfsImports).values({
      source: url,
      feedHash,
      feedVersion: feedInfo?.feed_version ?? null,
      ...counts,
    });
    return counts;
  });

  console.log(
    `[gtfs] importé en ${Math.round((Date.now() - started) / 1000)} s :`,
    `${counts.stops} arrêts, ${counts.trips} trains, ${counts.stopTimes} horaires`,
  );
}

type Table = Parameters<Tx['insert']>[0];

async function insertBatches<T extends Table>(tx: Tx, table: T, rows: T['$inferInsert'][]) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await tx.insert(table).values(rows.slice(i, i + BATCH_SIZE));
  }
}

async function insertStream<T extends Table>(
  tx: Tx,
  table: T,
  rows: () => Generator<T['$inferInsert']>,
): Promise<number> {
  let batch: T['$inferInsert'][] = [];
  let count = 0;
  for (const row of rows()) {
    batch.push(row);
    count++;
    if (batch.length === BATCH_SIZE) {
      await tx.insert(table).values(batch);
      batch = [];
    }
  }
  if (batch.length > 0) await tx.insert(table).values(batch);
  return count;
}
