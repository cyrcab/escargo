import { modeFromStopId } from './mode';
import { parseGtfsTime } from './time';

export const STOP_COLUMNS = [
  'stop_id',
  'stop_name',
  'stop_lat',
  'stop_lon',
  'location_type',
  'parent_station',
] as const;
export const ROUTE_COLUMNS = [
  'route_id',
  'route_short_name',
  'route_long_name',
  'route_type',
] as const;
export const TRIP_COLUMNS = [
  'route_id',
  'service_id',
  'trip_id',
  'trip_headsign',
  'trip_short_name',
] as const;
export const STOP_TIME_COLUMNS = [
  'trip_id',
  'arrival_time',
  'departure_time',
  'stop_id',
  'stop_sequence',
] as const;
export const SERVICE_DATE_COLUMNS = ['service_id', 'date', 'exception_type'] as const;

type Row<C extends readonly string[]> = Record<C[number], string>;
export type StopRow = Row<typeof STOP_COLUMNS>;
export type RouteRow = Row<typeof ROUTE_COLUMNS>;
export type TripRow = Row<typeof TRIP_COLUMNS>;
export type StopTimeRow = Row<typeof STOP_TIME_COLUMNS>;
export type ServiceDateRow = Row<typeof SERVICE_DATE_COLUMNS>;

export interface GtfsStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Zone d'arrêt (gare) qui regroupe les points d'arrêt, `null` pour la gare elle-même. */
  parentId: string | null;
  isStation: boolean;
}

export interface GtfsRoute {
  id: string;
  shortName: string;
  longName: string;
}

export interface GtfsTrip {
  id: string;
  routeId: string;
  serviceId: string;
  /**
   * Numéro du train : `trip_short_name` quand le GTFS le donne (IDFM : 124303, ou TAXE79
   * sur le RER), sinon lu dans le trip_id SNCF (870302).
   */
  trainNumber: string | null;
  headsign: string | null;
}

export interface GtfsStopTime {
  tripId: string;
  stopSequence: number;
  stopId: string;
  arrivalSeconds: number;
  departureSeconds: number;
}

export interface GtfsServiceDate {
  serviceId: string;
  /** `YYYY-MM-DD` */
  date: string;
}

export function toStop(row: StopRow): GtfsStop {
  return {
    id: row.stop_id,
    name: row.stop_name,
    lat: Number(row.stop_lat),
    lon: Number(row.stop_lon),
    parentId: row.parent_station || null,
    isStation: row.location_type === '1',
  };
}

export function toRoute(row: RouteRow): GtfsRoute {
  return { id: row.route_id, shortName: row.route_short_name, longName: row.route_long_name };
}

export function trainNumberFromTripId(tripId: string): string | null {
  return /^OCESN(\d+)F/.exec(tripId)?.[1] ?? null;
}

export function toTrip(row: TripRow): GtfsTrip {
  return {
    id: row.trip_id,
    routeId: row.route_id,
    serviceId: row.service_id,
    trainNumber: row.trip_short_name || trainNumberFromTripId(row.trip_id),
    headsign: row.trip_headsign || null,
  };
}

export function toStopTime(row: StopTimeRow): GtfsStopTime {
  return {
    tripId: row.trip_id,
    stopSequence: Number(row.stop_sequence),
    stopId: row.stop_id,
    arrivalSeconds: parseGtfsTime(row.arrival_time),
    departureSeconds: parseGtfsTime(row.departure_time),
  };
}

/** exception_type 1 = le service circule ce jour-là ; 2 = supprimé ce jour-là. */
export function toServiceDate(row: ServiceDateRow): GtfsServiceDate | null {
  if (row.exception_type !== '1') return null;
  const d = row.date;
  return { serviceId: row.service_id, date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` };
}

/**
 * Garde les points d'arrêt desservis en train et les gares qui en contiennent au moins un.
 * Une gare desservie seulement par car ne sert pas à Escargo.
 */
export function selectRailStops(stops: GtfsStop[]): GtfsStop[] {
  const railPoints = stops.filter((s) => !s.isStation && modeFromStopId(s.id) !== null);
  const stations = new Set(railPoints.map((s) => s.parentId));
  return stops.filter((s) => (s.isStation ? stations.has(s.id) : modeFromStopId(s.id) !== null));
}

/** Garde les points d'arrêt desservis par les trains retenus, et les gares qui les regroupent. */
export function selectUsedStops(stops: GtfsStop[], usedStopIds: ReadonlySet<string>): GtfsStop[] {
  const stations = new Set(
    stops.filter((s) => !s.isStation && usedStopIds.has(s.id)).map((s) => s.parentId),
  );
  return stops.filter((s) => (s.isStation ? stations.has(s.id) : usedStopIds.has(s.id)));
}
