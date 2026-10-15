import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CALENDAR_COLUMNS, expandCalendar } from './calendar';
import { iterateCsv, iterateCsvAsync } from './csv';
import { idfmRouteMode } from './idfm';
import {
  ROUTE_COLUMNS,
  SERVICE_DATE_COLUMNS,
  STOP_COLUMNS,
  STOP_TIME_COLUMNS,
  selectUsedStops,
  TRIP_COLUMNS,
  toStop,
  toStopTime,
  toTrip,
} from './parse';

// Extrait du GTFS IDFM réel (14/10/2026) : Transilien H 124303 Gare du Nord → Persan-Beaumont,
// RER A TAXE79, une ligne TER et une ligne de bus, plus un arrêt de métro (Bastille) jamais desservi.
const file = (name: string) =>
  readFileSync(new URL(`./__fixtures__/idfm/${name}`, import.meta.url));
const fixture = <C extends string>(name: string, columns: readonly C[]) => [
  ...iterateCsv(file(name), columns),
];

describe('idfmRouteMode', () => {
  const routes = fixture('routes.txt', ROUTE_COLUMNS);
  const mode = (shortName: string) => {
    const route = routes.find((r) => r.route_short_name === shortName);
    if (!route) throw new Error(`Ligne ${shortName} absente de l'extrait`);
    return idfmRouteMode(route);
  };

  it('classe le RER et le Transilien', () => {
    expect(mode('A')).toBe('RER');
    expect(mode('H')).toBe('TRANSILIEN');
  });

  it('écarte les TER, déjà dans le GTFS SNCF, et les bus', () => {
    expect(mode('TER')).toBeNull();
    expect(mode('4244')).toBeNull();
    expect(idfmRouteMode({ route_type: '3', route_short_name: 'A' })).toBeNull();
  });
});

describe('trips IDFM', () => {
  it('prend le numéro du train dans trip_short_name', () => {
    const trips = fixture('trips.txt', TRIP_COLUMNS).map(toTrip);
    expect(trips.map((t) => t.trainNumber)).toEqual(['124303', 'TAXE79']);
  });
});

describe('expandCalendar', () => {
  const dates = expandCalendar(
    fixture('calendar.txt', CALENDAR_COLUMNS),
    fixture('calendar_dates.txt', SERVICE_DATE_COLUMNS),
  );
  const of = (serviceId: string) =>
    dates.filter((d) => d.serviceId === serviceId).map((d) => d.date);

  it('déplie les jours de semaine entre les deux dates', () => {
    expect(of('IDFM:TN:00bc46e9-420a-3e8c-99f7-100f9a83b0b2')).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]);
  });

  it('retire un jour supprimé par calendar_dates (11 novembre)', () => {
    const h = of('IDFM:TN:0022f58d-1161-31b5-b866-4ff4712fe4fc');
    expect(h).toContain('2026-11-10');
    expect(h).not.toContain('2026-11-11');
    expect(h).not.toContain('2026-10-24');
  });

  it('ajoute un jour hors calendrier', () => {
    const added = expandCalendar([], [{ service_id: 'X', date: '20261225', exception_type: '1' }]);
    expect(added).toEqual([{ serviceId: 'X', date: '2026-12-25' }]);
  });
});

describe('selectUsedStops', () => {
  it('garde les points desservis et leur gare, pas le reste', () => {
    const stops = fixture('stops.txt', STOP_COLUMNS).map(toStop);
    const used = new Set(fixture('stop_times.txt', STOP_TIME_COLUMNS).map((r) => r.stop_id));
    const kept = selectUsedStops(stops, used);
    expect(kept.find((s) => s.id === 'IDFM:monomodalStopPlace:462394')?.name).toBe('Gare du Nord');
    expect(kept.find((s) => s.id === 'IDFM:71410')?.isStation).toBe(true);
    expect(kept.some((s) => s.id === 'IDFM:463562')).toBe(false);
  });
});

describe('iterateCsvAsync', () => {
  it('lit un fichier découpé en morceaux arbitraires comme en une fois', async () => {
    const bytes = file('stop_times.txt');
    async function* chunks() {
      for (let i = 0; i < bytes.length; i += 7) yield bytes.subarray(i, i + 7);
    }
    const rows = [];
    for await (const row of iterateCsvAsync(chunks(), STOP_TIME_COLUMNS))
      rows.push(toStopTime(row));
    expect(rows).toEqual(fixture('stop_times.txt', STOP_TIME_COLUMNS).map(toStopTime));
    expect(rows[0]).toMatchObject({ stopSequence: 1, departureSeconds: 5 * 3600 + 56 * 60 + 30 });
  });
});
