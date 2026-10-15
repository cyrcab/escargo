// Diagnostic d'un train : horaires prévus (GTFS), lectures temps réel (cache Redis et flux
// SNCF en direct) et retard compté à chaque gare. Utilisé par le skill /check-train.
// pnpm --filter @escargo/worker check-train <n° de train | trip_id> [YYYY-MM-DD]
import { createDb } from '@escargo/db';
import {
  computeTrainDelay,
  decodeTripUpdates,
  formatGtfsTime,
  mergeTripRealtime,
  type TripRealtime,
} from '@escargo/transit';
import { Redis } from 'ioredis';
import { env } from './env';
import { findScheduledTrains, readCachedTrips, type ScheduledTrain } from './train-lookup';

const [train, dateArg] = process.argv.slice(2);
if (!train) {
  console.error('Usage : check-train <n° de train | trip_id> [YYYY-MM-DD]');
  process.exit(1);
}
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const date = dateArg ?? today;

const db = createDb(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL);

/** Lecture du flux SNCF en direct, pour voir un train même si le worker ne tourne pas. */
async function liveTrips(): Promise<Map<string, TripRealtime> | null> {
  try {
    const response = await fetch(env.SNCF_GTFS_RT_URL, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = decodeTripUpdates(new Uint8Array(await response.arrayBuffer()));
    return new Map(feed.trips.map((t) => [`${t.serviceDate} ${t.tripId}`, t]));
  } catch (error) {
    console.warn(`Flux SNCF en direct illisible : ${(error as Error).message}`);
    return null;
  }
}

const hhmm = (epoch: number | null) =>
  epoch === null
    ? '  —  '
    : new Date(epoch * 1000).toLocaleTimeString('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
      });

/** Premier train de la même ligne qui arrive à la gare après l'heure prévue, sans être supprimé. */
function nextTrainAt(
  candidates: { train: ScheduledTrain; realtime: TripRealtime | null }[],
  stopId: string,
  afterSeconds: number,
) {
  return candidates
    .flatMap(({ train, realtime }) => {
      const stop = train.stops.find((s) => s.stopId === stopId);
      if (!stop || stop.arrivalSeconds <= afterSeconds || realtime?.status === 'cancelled') {
        return [];
      }
      return [{ train, realtime, stop }];
    })
    .sort((a, b) => a.stop.arrivalSeconds - b.stop.arrivalSeconds)[0];
}

const trains = await findScheduledTrains(db, date, { train });
if (trains.length === 0) {
  console.log(`Aucun train « ${train} » ne roule le ${date} dans le GTFS importé.`);
} else {
  const live = await liveTrips();
  const cached = await readCachedTrips(
    redis,
    date,
    trains.map((t) => t.tripId),
  );

  for (const [i, scheduled] of trains.entries()) {
    const fromCache = cached[i] ?? null;
    const fromLive = live?.get(`${date} ${scheduled.tripId}`) ?? null;
    const realtime = fromLive ? mergeTripRealtime(fromCache, fromLive) : fromCache;

    console.log(
      `\n${scheduled.mode} ${scheduled.trainNumber ?? '?'} · ${scheduled.line} (${scheduled.lineName}) · ${date}`,
    );
    console.log(`trip_id ${scheduled.tripId}`);
    console.log(
      `Cache : ${fromCache ? `oui (${fromCache.source}, mis à jour par la source à ${hhmm(fromCache.updatedAt)})` : 'non'}` +
        ` · Flux en direct : ${live === null ? 'indisponible' : fromLive ? 'oui' : 'absent'}` +
        ` · Statut : ${realtime?.status ?? 'inconnu'}`,
    );

    // Train suivant de la ligne, au cas où celui-ci est supprimé.
    const lineTrains =
      realtime?.status === 'cancelled' || realtime?.stops.some((s) => s.skipped)
        ? await findScheduledTrains(db, date, { routeId: scheduled.routeId })
        : [];
    const lineRealtime = await readCachedTrips(
      redis,
      date,
      lineTrains.map((t) => t.tripId),
    );
    const lineCandidates = lineTrains.map((train, j) => ({
      train,
      realtime: live?.get(`${date} ${train.tripId}`) ?? lineRealtime[j] ?? null,
    }));

    console.log('\n  Gare                              Prévu  Réel   Compté  Statut');
    for (const stop of scheduled.stops.slice(1)) {
      const next = nextTrainAt(lineCandidates, stop.stopId, stop.arrivalSeconds);
      const delay = computeTrainDelay({
        serviceDate: date,
        scheduledArrivalSeconds: stop.arrivalSeconds,
        alightingStopId: stop.stopId,
        realtime,
        nextTrain: next
          ? {
              serviceDate: date,
              scheduledArrivalSeconds: next.stop.arrivalSeconds,
              realtime: next.realtime,
            }
          : null,
      });
      const via = delay.cancelled && next ? ` (train suivant ${next.train.trainNumber})` : '';
      console.log(
        `  ${stop.stopName.slice(0, 32).padEnd(32)}  ${formatGtfsTime(stop.arrivalSeconds).slice(0, 5)}  ` +
          `${hhmm(delay.actualArrival)}  ${String(delay.delayMinutes).padStart(3)} min  ${delay.status}${via}`,
      );
    }
  }
}

redis.disconnect();
await db.$client.end();
