import { type TripRealtime, tripKey } from '@escargo/transit';
import { sql } from 'drizzle-orm';
import type { Redis } from 'ioredis';
import type { Db } from './gtfs-store';

export interface ScheduledStop {
  stopId: string;
  stopName: string;
  arrivalSeconds: number;
  departureSeconds: number;
}

export interface ScheduledTrain {
  tripId: string;
  trainNumber: string | null;
  mode: string;
  line: string;
  lineName: string;
  stops: ScheduledStop[];
}

/** Trains du GTFS qui roulent le jour de service `date`, filtrés par trip_id, numéro ou ligne. */
export async function findScheduledTrains(
  db: Db,
  date: string,
  filter: { train: string } | { line: string },
): Promise<ScheduledTrain[]> {
  const where =
    'train' in filter
      ? sql`(t.id = ${filter.train} or t.train_number = ${filter.train})`
      : sql`r.short_name = ${filter.line}`;
  const rows = await db.execute<{
    tripId: string;
    trainNumber: string | null;
    mode: string;
    line: string;
    lineName: string;
    stopId: string;
    stopName: string;
    arrivalSeconds: number;
    departureSeconds: number;
  }>(sql`
    select t.id as "tripId", t.train_number as "trainNumber", t.mode,
      r.short_name as line, r.long_name as "lineName",
      st.stop_id as "stopId", s.name as "stopName",
      st.arrival_seconds as "arrivalSeconds", st.departure_seconds as "departureSeconds"
    from gtfs_trips t
    join gtfs_service_dates d on d.feed = t.feed and d.service_id = t.service_id and d.date = ${date}
    join gtfs_routes r on r.feed = t.feed and r.id = t.route_id
    join gtfs_stop_times st on st.trip_id = t.id
    join gtfs_stops s on s.id = st.stop_id
    where ${where}
    order by t.id, st.stop_sequence
  `);

  const trains = new Map<string, ScheduledTrain>();
  for (const { stopId, stopName, arrivalSeconds, departureSeconds, ...trip } of rows) {
    const train = trains.get(trip.tripId) ?? { ...trip, stops: [] };
    train.stops.push({ stopId, stopName, arrivalSeconds, departureSeconds });
    trains.set(trip.tripId, train);
  }
  return [...trains.values()].sort(
    (a, b) => (a.stops[0]?.departureSeconds ?? 0) - (b.stops[0]?.departureSeconds ?? 0),
  );
}

/** Dernières lectures temps réel en cache (SNCF ou PRIM), `null` si le train n'y est pas. */
export async function readCachedTrips(
  redis: Redis,
  date: string,
  tripIds: string[],
): Promise<(TripRealtime | null)[]> {
  if (tripIds.length === 0) return [];
  const values = await redis.mget(tripIds.map((id) => tripKey(date, id)));
  return values.map((value) => (value ? (JSON.parse(value) as TripRealtime) : null));
}
