import { serviceDaySeconds } from '../gtfs/time';
import type { TripRealtime } from './decode';
import type { SiriJourney } from './siri';

export interface ScheduledStopTime {
  stopId: string;
  arrivalSeconds: number;
  departureSeconds: number;
}

/** Train du GTFS qui porte le même numéro, un jour de service donné. */
export interface CandidateTrip {
  tripId: string;
  /** `YYYY-MM-DD` */
  serviceDate: string;
  stopTimes: ScheduledStopTime[];
}

/** Écart toléré entre l'heure prévue SIRI et celle du GTFS (même source de planification). */
const TOLERANCE_SECONDS = 30;

const parisDate = (epochSeconds: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(
    new Date(epochSeconds * 1000),
  );

/**
 * Jours de service où chercher le train : celui de son premier passage prévu, et la veille
 * pour un train parti avant minuit (le GTFS le note alors `24:10:00`).
 */
export function candidateServiceDates(journey: SiriJourney): string[] {
  const first = journey.calls
    .map((c) => c.aimedDeparture ?? c.aimedArrival)
    .find((t): t is number => t !== null);
  if (first === undefined) return [];
  return [parisDate(first), parisDate(first - 86_400)];
}

/** Arrêt du GTFS dont l'heure prévue correspond à celle du passage SIRI. */
function scheduledStop(
  candidate: CandidateTrip,
  call: SiriJourney['calls'][number],
): ScheduledStopTime | undefined {
  const near = (epoch: number | null, seconds: number) =>
    epoch !== null &&
    Math.abs(serviceDaySeconds(epoch, candidate.serviceDate) - seconds) <= TOLERANCE_SECONDS;
  return candidate.stopTimes.find(
    (st) =>
      near(call.aimedArrival, st.arrivalSeconds) || near(call.aimedDeparture, st.departureSeconds),
  );
}

/**
 * Rapproche un train SIRI d'un train du GTFS IDFM et le traduit en lecture temps réel.
 * Les quais SIRI n'ont pas d'équivalent direct dans le GTFS : chaque passage est relié à
 * l'arrêt dont l'heure prévue est la même. Sans correspondance unique, rien n'est renvoyé :
 * mieux vaut un retard non vérifié qu'un retard attribué au mauvais train.
 */
export function matchJourney(
  journey: SiriJourney,
  candidates: CandidateTrip[],
): TripRealtime | null {
  const scored = candidates
    .map((candidate) => {
      const stops = journey.calls.flatMap((call) => {
        const scheduled = scheduledStop(candidate, call);
        if (!scheduled) return [];
        // Arrêt supprimé : aucune heure, pour ne jamais compter un passage « à l'heure ».
        const arrivalTime = call.cancelled ? null : (call.expectedArrival ?? call.aimedArrival);
        const departureTime = call.cancelled
          ? null
          : (call.expectedDeparture ?? call.aimedDeparture);
        return [
          {
            stopId: scheduled.stopId,
            arrivalTime,
            arrivalDelay:
              arrivalTime !== null && call.aimedArrival !== null
                ? arrivalTime - call.aimedArrival
                : null,
            departureTime,
            departureDelay:
              departureTime !== null && call.aimedDeparture !== null
                ? departureTime - call.aimedDeparture
                : null,
            skipped: call.cancelled,
          },
        ];
      });
      return { candidate, stops };
    })
    .filter(({ stops }) => stops.length > 0);

  if (scored.length !== 1) return null;
  const [{ candidate, stops }] = scored as [(typeof scored)[number]];
  return {
    tripId: candidate.tripId,
    serviceDate: candidate.serviceDate,
    status: journey.cancelled ? 'cancelled' : 'scheduled',
    source: 'PRIM',
    updatedAt: journey.recordedAt,
    stops,
  };
}
