import { type DataSource, DELAY_THRESHOLD_MINUTES } from '@escargo/shared';
import { computeCountedDelay } from './delay';
import { serviceDaySeconds } from './gtfs/time';
import type { TripRealtime } from './realtime/decode';

/**
 * `on_time` : à l'heure ou en avance. `below_threshold` : en retard, sous le seuil.
 * `cancelled` : train supprimé ou qui ne s'arrête plus à la gare de descente.
 * `unverified` : pas de lecture temps réel pour cette gare, rien n'est compté.
 */
export type TrainDelayStatus =
  | 'on_time'
  | 'below_threshold'
  | 'delayed'
  | 'cancelled'
  | 'unverified';

/** Un train pris, tel que prévu au GTFS, avec sa dernière lecture temps réel. */
export interface TrainAtStop {
  /** `YYYY-MM-DD` */
  serviceDate: string;
  /** Arrivée prévue à la gare de descente, secondes depuis le début du jour de service. */
  scheduledArrivalSeconds: number;
  /** Lecture en cache, `null` si le train n'est jamais apparu dans le flux. */
  realtime: TripRealtime | null;
}

export interface TrainDelayInput extends TrainAtStop {
  /** Gare de descente (`stop_id` du flux qui couvre le train). */
  alightingStopId: string;
  /** Train suivant pris jusqu'à la même gare, si celui-ci est supprimé. */
  nextTrain?: TrainAtStop | null;
}

export interface TrainDelay {
  status: TrainDelayStatus;
  /** Retard compté, 0 sous le seuil ou sans vérification. */
  delayMinutes: number;
  /** Secondes epoch. */
  scheduledArrival: number;
  /** Arrivée réelle à la gare (celle du train suivant si supprimé), secondes epoch. */
  actualArrival: number | null;
  cancelled: boolean;
  /** Seuls les retards vérifiés comptent dans les titres et classements. */
  verified: boolean;
  source: DataSource | null;
}

/** Heure GTFS d'un jour de service → secondes epoch. */
const toEpoch = (serviceDate: string, seconds: number) =>
  seconds - serviceDaySeconds(0, serviceDate);

/**
 * Arrivée réelle à la gare d'après la lecture temps réel, ou `null` si la lecture ne dit
 * rien de cette gare. Un arrêt absent du flux n'est jamais supposé « à l'heure ».
 */
function actualArrivalAt(train: TrainAtStop, stopId: string): number | null {
  const stop = train.realtime?.stops.find((s) => s.stopId === stopId);
  if (!stop || stop.skipped) return null;
  if (stop.arrivalTime !== null) return stop.arrivalTime;
  if (stop.arrivalDelay !== null) {
    return toEpoch(train.serviceDate, train.scheduledArrivalSeconds) + stop.arrivalDelay;
  }
  return null;
}

const isCancelledAt = (train: TrainAtStop, stopId: string) =>
  train.realtime?.status === 'cancelled' ||
  train.realtime?.stops.some((s) => s.stopId === stopId && s.skipped) === true;

/**
 * Retard d'un train à la gare de descente : arrivée réelle − arrivée prévue GTFS, compté
 * à partir du seuil. Train supprimé : l'arrivée réelle est celle du train suivant pris.
 */
export function computeTrainDelay(input: TrainDelayInput): TrainDelay {
  const scheduledArrival = toEpoch(input.serviceDate, input.scheduledArrivalSeconds);
  const unverified = (cancelled: boolean): TrainDelay => ({
    status: cancelled ? 'cancelled' : 'unverified',
    delayMinutes: 0,
    scheduledArrival,
    actualArrival: null,
    cancelled,
    verified: false,
    source: null,
  });

  if (isCancelledAt(input, input.alightingStopId)) {
    const next = input.nextTrain;
    const actualArrival =
      next && !isCancelledAt(next, input.alightingStopId)
        ? actualArrivalAt(next, input.alightingStopId)
        : null;
    // Train suivant inconnu, sans lecture ou supprimé aussi : la suppression est notée,
    // le retard pas compté.
    if (!next?.realtime || actualArrival === null) return unverified(true);
    return {
      status: 'cancelled',
      delayMinutes: computeCountedDelay(
        new Date(scheduledArrival * 1000),
        new Date(actualArrival * 1000),
      ),
      scheduledArrival,
      actualArrival,
      cancelled: true,
      verified: true,
      source: next.realtime.source,
    };
  }

  const actualArrival = actualArrivalAt(input, input.alightingStopId);
  if (!input.realtime || actualArrival === null) return unverified(false);

  const lateMinutes = Math.floor((actualArrival - scheduledArrival) / 60);
  return {
    status:
      lateMinutes <= 0
        ? 'on_time'
        : lateMinutes < DELAY_THRESHOLD_MINUTES
          ? 'below_threshold'
          : 'delayed',
    delayMinutes: computeCountedDelay(
      new Date(scheduledArrival * 1000),
      new Date(actualArrival * 1000),
    ),
    scheduledArrival,
    actualArrival,
    cancelled: false,
    verified: true,
    source: input.realtime.source,
  };
}
