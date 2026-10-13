import { describe, expect, it } from 'vitest';
import { computeCoverage, type ScheduledTrip } from './coverage';

const trip = (id: string, mode: string, line: string): ScheduledTrip => ({
  id,
  mode,
  line,
  lineName: line,
});

describe('computeCoverage', () => {
  const trips = [
    trip('a', 'TER', 'C6'),
    trip('b', 'TER', 'C6'),
    trip('c', 'TER', 'C16'),
    trip('d', 'TGV', '401D'),
  ];
  const coverage = computeCoverage(trips, new Set(['a', 'c', 'd', 'inconnu']));

  it('compte par mode les trains prévus vus dans le flux', () => {
    expect(coverage.byMode).toEqual({
      TER: { expected: 3, seen: 2, percent: 67 },
      TGV: { expected: 1, seen: 1, percent: 100 },
    });
  });

  it('classe les lignes de la moins couverte à la plus couverte', () => {
    expect(coverage.byLine.map((l) => [l.line, l.percent])).toEqual([
      ['C6', 50],
      ['C16', 100],
      ['401D', 100],
    ]);
  });

  it('renvoie 0 % sans train prévu', () => {
    expect(computeCoverage([], new Set(['a']))).toEqual({ byMode: {}, byLine: [] });
  });
});
