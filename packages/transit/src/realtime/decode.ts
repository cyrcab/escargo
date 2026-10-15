import type { DataSource } from '@escargo/shared';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

/** `cancelled` : train supprimé. `added` : train absent des horaires théoriques. */
export type TripStatus = 'scheduled' | 'added' | 'cancelled';

export interface StopRealtime {
  stopId: string;
  /** Heures réelles ou prévues à jour, en secondes epoch (UTC). */
  arrivalTime: number | null;
  arrivalDelay: number | null;
  departureTime: number | null;
  departureDelay: number | null;
  /** Le train ne marque pas cet arrêt. */
  skipped: boolean;
}

export interface TripRealtime {
  tripId: string;
  /** `YYYY-MM-DD` */
  serviceDate: string;
  status: TripStatus;
  /** Flux temps réel d'où vient la lecture. */
  source: DataSource;
  /** Horodatage de la mise à jour, secondes epoch. */
  updatedAt: number;
  stops: StopRealtime[];
}

export interface TripUpdatesFeed {
  timestamp: number;
  trips: TripRealtime[];
}

// Forme de `FeedMessage.toObject` avec `longs: Number, enums: String` :
// seuls les champs présents dans le flux sont renseignés.
interface StopTimeEventObject {
  time?: number;
  delay?: number;
}
interface StopTimeUpdateObject {
  stopId?: string;
  arrival?: StopTimeEventObject;
  departure?: StopTimeEventObject;
  scheduleRelationship?: string;
}
interface TripUpdateObject {
  trip?: { tripId?: string; startDate?: string; scheduleRelationship?: string };
  stopTimeUpdate?: StopTimeUpdateObject[];
  timestamp?: number;
}
interface FeedObject {
  header?: { timestamp?: number };
  entity?: { isDeleted?: boolean; tripUpdate?: TripUpdateObject }[];
}

const STATUS: Record<string, TripStatus> = {
  SCHEDULED: 'scheduled',
  ADDED: 'added',
  CANCELED: 'cancelled',
};

/**
 * Décode le flux GTFS-RT « trip updates ». Les trains sans trip_id ni date de service,
 * et les statuts non gérés (REPLACEMENT, DELETED…), sont ignorés.
 */
export function decodeTripUpdates(bytes: Uint8Array): TripUpdatesFeed {
  const feed = FeedMessage.toObject(FeedMessage.decode(bytes), {
    longs: Number,
    enums: String,
  }) as FeedObject;
  const timestamp = feed.header?.timestamp ?? 0;
  const trips: TripRealtime[] = [];

  for (const entity of feed.entity ?? []) {
    const update = entity.tripUpdate;
    const tripId = update?.trip?.tripId;
    const startDate = update?.trip?.startDate;
    const status = STATUS[update?.trip?.scheduleRelationship ?? 'SCHEDULED'];
    if (entity.isDeleted || !update || !tripId || !startDate || !status) continue;

    trips.push({
      tripId,
      serviceDate: `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`,
      status,
      source: 'SNCF_GTFS_RT',
      updatedAt: update.timestamp ?? timestamp,
      stops: (update.stopTimeUpdate ?? [])
        .filter((stop): stop is StopTimeUpdateObject & { stopId: string } => !!stop.stopId)
        .map((stop) => ({
          stopId: stop.stopId,
          arrivalTime: stop.arrival?.time ?? null,
          arrivalDelay: stop.arrival?.delay ?? null,
          departureTime: stop.departure?.time ?? null,
          departureDelay: stop.departure?.delay ?? null,
          skipped: stop.scheduleRelationship === 'SKIPPED',
        })),
    });
  }
  return { timestamp, trips };
}
