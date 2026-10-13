import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { iterateCsv } from './csv';
import { modeFromStopId } from './mode';
import {
  ROUTE_COLUMNS,
  STOP_COLUMNS,
  STOP_TIME_COLUMNS,
  selectRailStops,
  TRIP_COLUMNS,
  toRoute,
  toServiceDate,
  toStop,
  toStopTime,
  toTrip,
  trainNumberFromTripId,
} from './parse';

// Extrait du GTFS SNCF réel (octobre 2026) : TER 870302 Auch → Toulouse (ligne C6),
// TER 870501 sur la C16, un car TER (P13) et un TGV qui arrive après minuit.
const fixture = <C extends string>(file: string, columns: readonly C[]) => [
  ...iterateCsv(readFileSync(new URL(`./__fixtures__/sncf/${file}`, import.meta.url)), columns),
];

describe('modeFromStopId', () => {
  it.each([
    ['StopPoint:OCETrain TER-87611764', 'TER'],
    ['StopPoint:OCETGV INOUI-87471003', 'TGV'],
    ['StopPoint:OCEOUIGO-87271007', 'TGV'],
    ['StopPoint:OCEINTERCITES de nuit-87611004', 'INTERCITES'],
    ['StopPoint:OCECar TER-87611764', null],
    ['StopPoint:OCETramTrain-87590000', null],
    ['StopArea:OCE87611764', null],
  ])('%s → %s', (stopId, mode) => {
    expect(modeFromStopId(stopId)).toBe(mode);
  });
});

describe('trainNumberFromTripId', () => {
  it('lit le numéro commercial', () => {
    expect(
      trainNumberFromTripId(
        'OCESN870302F1187_F:TER:FR:Line::DDEF5935-0332-4ED5-B499-5C664AF7CF05::87611749:87611004:12:836:20270331',
      ),
    ).toBe('870302');
  });
});

describe('fixture SNCF', () => {
  const stops = fixture('stops.txt', STOP_COLUMNS).map(toStop);
  const trips = fixture('trips.txt', TRIP_COLUMNS).map(toTrip);
  const stopTimes = fixture('stop_times.txt', STOP_TIME_COLUMNS).map(toStopTime);

  it('garde les gares et points d’arrêt train, exclut ceux desservis seulement en car', () => {
    const rail = selectRailStops(stops);
    const ids = rail.map((s) => s.id);
    expect(ids).toContain('StopArea:OCE87611764');
    expect(ids).toContain('StopPoint:OCETrain TER-87611764');
    expect(ids).toContain('StopPoint:OCETrain TER-87353599');
    expect(rail.every((s) => s.isStation || modeFromStopId(s.id) !== null)).toBe(true);
    expect(rail.some((s) => s.id.includes('Car TER'))).toBe(false);
    // Bourg-en-Bresse Gare Routière : desservie seulement en car.
    expect(ids).not.toContain('StopArea:OCE87696013');
  });

  it('lit la gare d’Aubiet avec ses coordonnées et sa zone parente', () => {
    const aubiet = stops.find((s) => s.id === 'StopPoint:OCETrain TER-87611764');
    expect(aubiet).toMatchObject({
      name: 'Aubiet',
      lat: 43.650192,
      lon: 0.789173,
      parentId: 'StopArea:OCE87611764',
      isStation: false,
    });
  });

  it('retrouve le 870302 au départ d’Aubiet à 7 h 21', () => {
    const trip = trips.find((t) => t.trainNumber === '870302');
    const atAubiet = stopTimes.find(
      (st) => st.tripId === trip?.id && st.stopId === 'StopPoint:OCETrain TER-87611764',
    );
    expect(atAubiet?.departureSeconds).toBe(7 * 3600 + 21 * 60);
  });

  it('garde les horaires après minuit au-delà de 24 h', () => {
    expect(stopTimes.some((st) => st.arrivalSeconds >= 24 * 3600)).toBe(true);
  });

  it('lit les lignes', () => {
    expect(fixture('routes.txt', ROUTE_COLUMNS).map(toRoute)).toContainEqual({
      id: 'FR:Line::DDEF5935-0332-4ED5-B499-5C664AF7CF05:',
      shortName: 'C6',
      longName: 'Toulouse Matabiau - Auch',
    });
  });
});

describe('toServiceDate', () => {
  it('formate la date de circulation', () => {
    expect(toServiceDate({ service_id: '000005', date: '20261013', exception_type: '1' })).toEqual({
      serviceId: '000005',
      date: '2026-10-13',
    });
  });

  it('ignore un jour retiré du service', () => {
    expect(
      toServiceDate({ service_id: '000005', date: '20261225', exception_type: '2' }),
    ).toBeNull();
  });
});
