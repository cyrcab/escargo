import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { iterateCsv } from '../gtfs/csv';
import { STOP_TIME_COLUMNS, toStopTime } from '../gtfs/parse';
import { type CandidateTrip, candidateServiceDates, matchJourney } from './match';
import { decodeEstimatedTimetable } from './siri';

const feed = decodeEstimatedTimetable(
  JSON.parse(
    readFileSync(new URL('./__fixtures__/prim-estimated-timetable.json', import.meta.url), 'utf8'),
  ),
);
// Horaires réels des deux trains, tirés de l'extrait du GTFS IDFM.
const stopTimes = [
  ...iterateCsv(
    readFileSync(new URL('../gtfs/__fixtures__/idfm/stop_times.txt', import.meta.url)),
    STOP_TIME_COLUMNS,
  ),
].map(toStopTime);
const candidate = (tripId: string, serviceDate: string): CandidateTrip => ({
  tripId,
  serviceDate,
  stopTimes: stopTimes.filter((st) => st.tripId === tripId),
});
const H = 'IDFM:TN:SNCF:c080967a-8571-4c6d-96f2-f56ce1feba41';
const A = 'IDFM:TN:SNCF:95f6b8c2-35c4-4901-a1ed-11fa1e9b969d';
const [h124303, taxe79] = feed.journeys as [(typeof feed.journeys)[0], (typeof feed.journeys)[0]];

describe('candidateServiceDates', () => {
  it('cherche le jour du premier passage, puis la veille', () => {
    expect(candidateServiceDates(h124303)).toEqual(['2026-10-19', '2026-10-18']);
  });
});

describe('matchJourney', () => {
  it('relie chaque passage à son arrêt GTFS par l’heure prévue, avec le retard', () => {
    const trip = matchJourney(h124303, [candidate(H, '2026-10-19')]);
    expect(trip).toMatchObject({
      tripId: H,
      serviceDate: '2026-10-19',
      status: 'scheduled',
      source: 'PRIM',
    });
    expect(trip?.stops.map((s) => s.stopId)).toEqual([
      'IDFM:monomodalStopPlace:462394',
      'IDFM:monomodalStopPlace:412743',
      'IDFM:monomodalStopPlace:43078',
    ]);
    expect(trip?.stops[2]).toMatchObject({
      arrivalTime: Date.parse('2026-10-19T06:13:20+02:00') / 1000,
      arrivalDelay: 8 * 60,
      skipped: false,
    });
  });

  it('écarte la veille, où les heures ne correspondent pas', () => {
    const trip = matchJourney(h124303, [candidate(H, '2026-10-18'), candidate(H, '2026-10-19')]);
    expect(trip?.serviceDate).toBe('2026-10-19');
  });

  it('marque un train supprimé', () => {
    const trip = matchJourney(taxe79, [candidate(A, '2026-10-19')]);
    expect(trip?.status).toBe('cancelled');
    expect(trip?.stops.every((s) => s.skipped)).toBe(true);
    expect(trip?.stops[1]).toMatchObject({ arrivalTime: null, arrivalDelay: null });
  });

  it('ne renvoie rien sans train correspondant', () => {
    expect(matchJourney(h124303, [])).toBeNull();
    expect(matchJourney(h124303, [candidate(A, '2026-10-19')])).toBeNull();
  });

  it('ne choisit pas entre deux trains qui correspondent tous les deux', () => {
    const twin = { ...candidate(H, '2026-10-19'), tripId: 'IDFM:TN:SNCF:jumeau' };
    expect(matchJourney(h124303, [candidate(H, '2026-10-19'), twin])).toBeNull();
  });
});
