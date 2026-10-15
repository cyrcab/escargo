import { schema } from '@escargo/db';
import type { GtfsFeed, TrainMode } from '@escargo/shared';
import {
  CALENDAR_COLUMNS,
  expandCalendar,
  idfmRouteMode,
  isImportDue,
  iterateCsv,
  iterateCsvAsync,
  ROUTE_COLUMNS,
  SERVICE_DATE_COLUMNS,
  STOP_COLUMNS,
  STOP_TIME_COLUMNS,
  selectUsedStops,
  TRIP_COLUMNS,
  toRoute,
  toStop,
  toStopTime,
  toTrip,
} from '@escargo/transit';
import {
  clearFeed,
  type Db,
  download,
  insertBatches,
  insertStream,
  lastImport,
  markIfUnchanged,
} from './gtfs-store';
import { readZipEntry, readZipFile } from './zip-stream';

const FEED: GtfsFeed = 'IDFM';

/**
 * IDFM publie son GTFS vers 8 h, 13 h et 17 h : on le relit une demi-heure après,
 * soit trois imports par jour au plus.
 */
export const IDFM_IMPORT_SLOTS = ['08:30', '13:30', '17:30'] as const;

export async function isIdfmImportDue(db: Db, now = new Date()): Promise<boolean> {
  const last = await lastImport(db, FEED);
  return isImportDue(last?.checkedAt ?? null, now, IDFM_IMPORT_SLOTS);
}

export interface IdfmImportOptions {
  db: Db;
  url: string;
  dataDir: string;
}

/**
 * Télécharge le GTFS Île-de-France Mobilités (tous modes, ~150 Mo, 1 Go de stop_times)
 * et n'en garde que les RER et Transilien, remplacés en une transaction.
 * Les gros fichiers sont lus en flux, directement depuis le zip sur disque.
 */
export async function importIdfmGtfs({ db, url, dataDir }: IdfmImportOptions) {
  const started = Date.now();
  const { path, feedHash } = await download(url, dataDir, 'idfm-gtfs.zip', 'GTFS IDFM');
  if (await markIfUnchanged(db, FEED, feedHash)) return;
  const small = async <C extends string>(name: string, columns: readonly C[]) => [
    ...iterateCsv(await readZipFile(path, name), columns),
  ];

  const routes = (await small('routes.txt', ROUTE_COLUMNS)).flatMap((row) => {
    const mode = idfmRouteMode(row);
    return mode ? [{ route: toRoute(row), mode }] : [];
  });
  const routeModes = new Map<string, TrainMode>(routes.map((r) => [r.route.id, r.mode]));

  const tripIds = new Set<string>();
  const serviceIds = new Set<string>();
  const trips: (typeof schema.gtfsTrips.$inferInsert)[] = [];
  for await (const row of iterateCsvAsync(readZipEntry(path, 'trips.txt'), TRIP_COLUMNS)) {
    const mode = routeModes.get(row.route_id);
    if (!mode) continue;
    const trip = toTrip(row);
    tripIds.add(trip.id);
    serviceIds.add(trip.serviceId);
    trips.push({ ...trip, mode, feed: FEED });
  }

  const serviceDates = expandCalendar(
    await small('calendar.txt', CALENDAR_COLUMNS),
    await small('calendar_dates.txt', SERVICE_DATE_COLUMNS),
  ).filter((d) => serviceIds.has(d.serviceId));
  const allStops = (await small('stops.txt', STOP_COLUMNS)).map(toStop);

  const counts = await db.transaction(async (tx) => {
    await clearFeed(tx, FEED);
    await insertBatches(
      tx,
      schema.gtfsRoutes,
      routes.map((r) => ({ ...r.route, feed: FEED })),
    );
    await insertBatches(tx, schema.gtfsTrips, trips);
    await insertBatches(
      tx,
      schema.gtfsServiceDates,
      serviceDates.map((d) => ({ ...d, feed: FEED })),
    );

    const usedStopIds = new Set<string>();
    const stopTimes = await insertStream(
      tx,
      schema.gtfsStopTimes,
      (async function* () {
        for await (const row of iterateCsvAsync(
          readZipEntry(path, 'stop_times.txt'),
          STOP_TIME_COLUMNS,
        )) {
          if (!tripIds.has(row.trip_id)) continue;
          usedStopIds.add(row.stop_id);
          yield { ...toStopTime(row), feed: FEED };
        }
      })(),
    );

    const stops = selectUsedStops(allStops, usedStopIds);
    await insertBatches(
      tx,
      schema.gtfsStops,
      stops.map((s) => ({ ...s, feed: FEED })),
    );

    const counts = { stops: stops.length, trips: trips.length, stopTimes };
    await tx.insert(schema.gtfsImports).values({
      feed: FEED,
      source: url,
      feedHash,
      feedVersion: null,
      ...counts,
    });
    return counts;
  });

  console.log(
    `[gtfs IDFM] importé en ${Math.round((Date.now() - started) / 1000)} s :`,
    `${counts.stops} arrêts, ${counts.trips} trains, ${counts.stopTimes} horaires`,
  );
}
