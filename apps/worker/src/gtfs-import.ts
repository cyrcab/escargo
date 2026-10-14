import { readFile } from 'node:fs/promises';
import { schema } from '@escargo/db';
import type { GtfsFeed, TrainMode } from '@escargo/shared';
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
import { unzipSync } from 'fflate';
import {
  clearFeed,
  type Db,
  download,
  insertBatches,
  insertStream,
  lastImport,
  markIfUnchanged,
} from './gtfs-store';

const STALE_AFTER_MS = 24 * 3600_000;
const FEED: GtfsFeed = 'SNCF';

export interface GtfsImportOptions {
  db: Db;
  url: string;
  dataDir: string;
}

/** Le dernier import SNCF (ou la dernière vérification) date de plus de 24 h. */
export async function isGtfsStale(db: Db, now = new Date()): Promise<boolean> {
  const last = await lastImport(db, FEED);
  return !last || now.getTime() - last.checkedAt.getTime() > STALE_AFTER_MS;
}

/**
 * Télécharge le GTFS SNCF, et s'il a changé depuis le dernier import, remplace
 * ses horaires théoriques en base dans une seule transaction (l'API ne voit
 * jamais de tables à moitié remplies). Seuls les trains sont gardés.
 */
export async function importGtfs({ db, url, dataDir }: GtfsImportOptions) {
  const started = Date.now();
  const { path, feedHash } = await download(url, dataDir, 'sncf-gtfs.zip', 'GTFS SNCF');
  if (await markIfUnchanged(db, FEED, feedHash)) return;
  const zip = new Uint8Array(await readFile(path));

  // Un fichier à la fois : stop_times.txt fait ~80 Mo décompressé.
  const read = (name: string) => {
    const file = unzipSync(zip, { filter: (f) => f.name === name })[name];
    if (!file) throw new Error(`GTFS SNCF : ${name} absent du zip`);
    return file;
  };

  const counts = await db.transaction(async (tx) => {
    await clearFeed(tx, FEED);

    const stops = selectRailStops([...iterateCsv(read('stops.txt'), STOP_COLUMNS)].map(toStop));
    await insertBatches(
      tx,
      schema.gtfsStops,
      stops.map((s) => ({ ...s, feed: FEED })),
    );
    const railStopIds = new Set(stops.filter((s) => !s.isStation).map((s) => s.id));

    // Le mode d'un train se déduit de ses points d'arrêt ; un trajet sans arrêt train
    // (car de substitution) disparaît.
    const tripModes = new Map<string, TrainMode>();
    const stopTimes = await insertStream(
      tx,
      schema.gtfsStopTimes,
      (function* () {
        for (const row of iterateCsv(read('stop_times.txt'), STOP_TIME_COLUMNS)) {
          if (!railStopIds.has(row.stop_id)) continue;
          const stopTime = toStopTime(row);
          if (!tripModes.has(stopTime.tripId)) {
            const mode = modeFromStopId(stopTime.stopId);
            if (mode) tripModes.set(stopTime.tripId, mode);
          }
          yield { ...stopTime, feed: FEED };
        }
      })(),
    );

    const serviceIds = new Set<string>();
    const routeIds = new Set<string>();
    const trips = await insertStream(
      tx,
      schema.gtfsTrips,
      (function* () {
        for (const row of iterateCsv(read('trips.txt'), TRIP_COLUMNS)) {
          const mode = tripModes.get(row.trip_id);
          if (!mode) continue;
          const trip = toTrip(row);
          serviceIds.add(trip.serviceId);
          routeIds.add(trip.routeId);
          yield { ...trip, mode, feed: FEED };
        }
      })(),
    );

    await insertBatches(
      tx,
      schema.gtfsRoutes,
      [...iterateCsv(read('routes.txt'), ROUTE_COLUMNS)]
        .map(toRoute)
        .filter((r) => routeIds.has(r.id))
        .map((r) => ({ ...r, feed: FEED })),
    );

    await insertStream(
      tx,
      schema.gtfsServiceDates,
      (function* () {
        for (const row of iterateCsv(read('calendar_dates.txt'), SERVICE_DATE_COLUMNS)) {
          const serviceDate = toServiceDate(row);
          if (serviceDate && serviceIds.has(serviceDate.serviceId)) {
            yield { ...serviceDate, feed: FEED };
          }
        }
      })(),
    );

    const [feedInfo] = iterateCsv(read('feed_info.txt'), ['feed_version']);
    const counts = { stops: stops.length, trips, stopTimes };
    await tx.insert(schema.gtfsImports).values({
      feed: FEED,
      source: url,
      feedHash,
      feedVersion: feedInfo?.feed_version ?? null,
      ...counts,
    });
    return counts;
  });

  console.log(
    `[gtfs SNCF] importé en ${Math.round((Date.now() - started) / 1000)} s :`,
    `${counts.stops} arrêts, ${counts.trips} trains, ${counts.stopTimes} horaires`,
  );
}
