import { schema } from '@escargo/db';
import {
  type CandidateTrip,
  candidateServiceDates,
  decodeEstimatedTimetable,
  matchJourney,
  PRIM_DAILY_CALL_BUDGET,
  PRIM_FEED_KEY,
  primCallsKey,
  quotaDay,
  type TripRealtime,
  withinQuota,
} from '@escargo/transit';
import { eq, sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import type { Db } from './gtfs-store';
import { writeTrips } from './realtime-cache';

export interface PrimPollOptions {
  db: Db;
  redis: Redis;
  url: string;
  apiKey: string;
}

/**
 * Relève tous les prochains passages d'Île-de-France en un seul appel PRIM
 * (estimated-timetable), garde les RER et Transilien, rapproche chaque train de
 * son trip_id GTFS IDFM et met le cache Redis à jour. Un appel toutes les 2 minutes,
 * quel que soit le nombre d'utilisateurs, plafonné par un compteur journalier.
 */
export async function pollPrim({ db, redis, url, apiKey }: PrimPollOptions) {
  const callsKey = primCallsKey(quotaDay(new Date()));
  // Compté avant l'appel : un échec réseau consomme aussi le budget, par prudence.
  // Compteur et expiration ensemble, pour qu'un arrêt du worker ne laisse pas une clé éternelle.
  const [[error, count] = []] =
    (await redis
      .multi()
      .incr(callsKey)
      .expire(callsKey, 2 * 24 * 3600, 'NX')
      .exec()) ?? [];
  if (error) throw error;
  const callNumber = Number(count);
  if (!withinQuota(callNumber)) {
    if (callNumber === PRIM_DAILY_CALL_BUDGET + 1) {
      console.warn(`[prim] budget de ${PRIM_DAILY_CALL_BUDGET} appels atteint, reprise demain`);
    }
    return;
  }

  const response = await fetch(url, {
    headers: { apikey: apiKey, accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`PRIM estimated-timetable : HTTP ${response.status}`);
  const feed = decodeEstimatedTimetable(await response.json());

  const lines = new Set(
    (
      await db
        .select({ id: schema.gtfsRoutes.id })
        .from(schema.gtfsRoutes)
        .where(eq(schema.gtfsRoutes.feed, 'IDFM'))
    ).map((r) => r.id),
  );
  // Sans numéro de train (courses RATP), le rapprochement n'est pas fiable : écarté pour l'instant.
  const journeys = feed.journeys.filter(
    (j) => j.lineId && lines.has(j.lineId) && j.trainNumber && j.calls.length > 0,
  );

  const candidates = await loadCandidates(
    db,
    [...new Set(journeys.map((j) => j.trainNumber as string))],
    [...new Set(journeys.flatMap(candidateServiceDates))],
  );
  const trips: TripRealtime[] = [];
  for (const journey of journeys) {
    const dates = new Set(candidateServiceDates(journey));
    const trip = matchJourney(
      journey,
      (candidates.get(journey.trainNumber as string) ?? []).filter((c) => dates.has(c.serviceDate)),
    );
    if (trip) trips.push(trip);
  }

  const timestamp = feed.timestamp || Math.floor(Date.now() / 1000);
  const cancelled = trips.filter((t) => t.status === 'cancelled').length;
  await writeTrips(redis, trips, timestamp, (write) =>
    write.hset(PRIM_FEED_KEY, {
      timestamp,
      journeys: journeys.length,
      trips: trips.length,
      cancelled,
      calls: callNumber,
      polledAt: Math.floor(Date.now() / 1000),
    }),
  );

  console.log(
    `[prim] ${trips.length}/${journeys.length} trains RER et Transilien rapprochés,`,
    `dont ${cancelled} supprimés (appel ${callNumber}/${PRIM_DAILY_CALL_BUDGET})`,
  );
}

/** Trains du GTFS IDFM portant ces numéros, ces jours-là, avec leurs horaires. */
async function loadCandidates(
  db: Db,
  trainNumbers: string[],
  dates: string[],
): Promise<Map<string, CandidateTrip[]>> {
  const byNumber = new Map<string, CandidateTrip[]>();
  if (trainNumbers.length === 0 || dates.length === 0) return byNumber;

  const rows = await db.execute<{
    tripId: string;
    trainNumber: string;
    date: string;
    stopId: string;
    arrivalSeconds: number;
    departureSeconds: number;
  }>(sql`
    select t.id as "tripId", t.train_number as "trainNumber", d.date::text as date,
      st.stop_id as "stopId", st.arrival_seconds as "arrivalSeconds",
      st.departure_seconds as "departureSeconds"
    from gtfs_trips t
    join gtfs_service_dates d on d.feed = t.feed and d.service_id = t.service_id
    join gtfs_stop_times st on st.trip_id = t.id
    where t.feed = 'IDFM'
      and t.train_number in ${trainNumbers}
      and d.date in ${dates}
    order by t.id, d.date, st.stop_sequence
  `);

  const byKey = new Map<string, CandidateTrip>();
  for (const row of rows) {
    const key = `${row.tripId} ${row.date}`;
    let candidate = byKey.get(key);
    if (!candidate) {
      candidate = { tripId: row.tripId, serviceDate: row.date, stopTimes: [] };
      byKey.set(key, candidate);
      byNumber.set(row.trainNumber, [...(byNumber.get(row.trainNumber) ?? []), candidate]);
    }
    candidate.stopTimes.push(row);
  }
  return byNumber;
}
