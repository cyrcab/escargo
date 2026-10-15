import { describe, expect, it } from 'vitest';
import type { StopRealtime, TripRealtime } from './decode';
import { mergeTripRealtime } from './merge';

const stop = (stopId: string, arrivalDelay: number): StopRealtime => ({
  stopId,
  arrivalTime: 1000 + arrivalDelay,
  arrivalDelay,
  departureTime: null,
  departureDelay: null,
  skipped: false,
});

const read = (
  updatedAt: number,
  stops: StopRealtime[],
  status: TripRealtime['status'] = 'scheduled',
) => ({
  tripId: 'T1',
  serviceDate: '2026-10-13',
  status,
  source: 'SNCF_GTFS_RT' as const,
  updatedAt,
  stops,
});

describe('mergeTripRealtime', () => {
  it('prend la première lecture telle quelle', () => {
    const next = read(10, [stop('A', 0)]);
    expect(mergeTripRealtime(null, next)).toBe(next);
  });

  it('garde les arrêts déjà passés que le flux a retirés', () => {
    const merged = mergeTripRealtime(
      read(10, [stop('Aubiet', 300), stop('Colomiers', 300)]),
      read(20, [stop('Colomiers', 600), stop('Toulouse', 600)]),
    );
    expect(merged.stops.map((s) => [s.stopId, s.arrivalDelay])).toEqual([
      ['Aubiet', 300],
      ['Colomiers', 600],
      ['Toulouse', 600],
    ]);
    expect(merged.updatedAt).toBe(20);
  });

  it('ignore une lecture plus ancienne que le cache', () => {
    const cached = read(20, [stop('A', 600)]);
    expect(mergeTripRealtime(cached, read(10, [stop('A', 0)]))).toBe(cached);
  });

  it('suit le dernier statut du train', () => {
    expect(mergeTripRealtime(read(10, []), read(20, [], 'cancelled')).status).toBe('cancelled');
  });
});
