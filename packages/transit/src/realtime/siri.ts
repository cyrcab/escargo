// Réponse SIRI Lite « estimated-timetable » de PRIM (Île-de-France Mobilités) : tous les
// prochains passages du réseau en un appel. Forme lue d'après la documentation PRIM ;
// à confirmer sur une vraie réponse dès que la clé est disponible.

export interface SiriCall {
  /** `STIF:StopPoint:Q:41087:` : quai, sans correspondance directe avec les stop_id GTFS. */
  stopRef: string | null;
  /** Secondes epoch ; `null` si le passage ne donne pas l'information. */
  aimedArrival: number | null;
  expectedArrival: number | null;
  aimedDeparture: number | null;
  expectedDeparture: number | null;
  cancelled: boolean;
}

export interface SiriJourney {
  /** Ligne au format du GTFS IDFM (`IDFM:C01742`), lue dans `STIF:Line::C01742:`. */
  lineId: string | null;
  /** Numéro du train (124303) ou code de mission (TAXE79), comme `trip_short_name`. */
  trainNumber: string | null;
  cancelled: boolean;
  /** Secondes epoch. */
  recordedAt: number;
  calls: SiriCall[];
}

export interface EstimatedTimetable {
  timestamp: number;
  journeys: SiriJourney[];
}

// SIRI Lite enveloppe les valeurs (`{ "value": "…" }`) et met parfois un objet seul
// là où on attend une liste : on lit les deux formes.
type Json = Record<string, unknown>;
const asObject = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
const text = (v: unknown): string | null => {
  const raw = v && typeof v === 'object' && 'value' in v ? (v as Json).value : v;
  return typeof raw === 'string' && raw !== '' ? raw : null;
};
const time = (v: unknown): number | null => {
  const raw = text(v);
  const ms = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
};
const isCancelled = (status: unknown) => text(status)?.toLowerCase() === 'cancelled';

export function lineIdFromSiri(lineRef: string | null): string | null {
  const code = lineRef && /^STIF:Line::([^:]+):$/.exec(lineRef)?.[1];
  return code ? `IDFM:${code}` : null;
}

function trainNumber(journey: Json): string | null {
  const numbers = asList(asObject(journey.TrainNumbers).TrainNumberRef);
  return (
    text(numbers[0]) ??
    text(asList(journey.VehicleJourneyName)[0]) ??
    text(journey.VehicleJourneyName) ??
    null
  );
}

export function decodeEstimatedTimetable(body: unknown): EstimatedTimetable {
  const delivery = asObject(asObject(asObject(body).Siri).ServiceDelivery);
  const timestamp = time(delivery.ResponseTimestamp) ?? 0;
  const journeys: SiriJourney[] = [];

  for (const timetable of asList(delivery.EstimatedTimetableDelivery)) {
    for (const frame of asList(asObject(timetable).EstimatedJourneyVersionFrame)) {
      for (const raw of asList(asObject(frame).EstimatedVehicleJourney)) {
        const journey = asObject(raw);
        const calls = asList(asObject(journey.EstimatedCalls).EstimatedCall).map((c) => {
          const call = asObject(c);
          return {
            stopRef: text(call.StopPointRef),
            aimedArrival: time(call.AimedArrivalTime),
            expectedArrival: time(call.ExpectedArrivalTime),
            aimedDeparture: time(call.AimedDepartureTime),
            expectedDeparture: time(call.ExpectedDepartureTime),
            cancelled:
              call.Cancellation === true ||
              isCancelled(call.ArrivalStatus) ||
              isCancelled(call.DepartureStatus),
          };
        });
        journeys.push({
          lineId: lineIdFromSiri(text(journey.LineRef)),
          trainNumber: trainNumber(journey),
          cancelled:
            journey.Cancellation === true || (calls.length > 0 && calls.every((c) => c.cancelled)),
          recordedAt: time(journey.RecordedAtTime) ?? timestamp,
          calls,
        });
      }
    }
  }
  return { timestamp, journeys };
}
