import { describe, expect, it } from 'vitest';
import { formatGtfsTime, parseGtfsTime } from './time';

describe('parseGtfsTime', () => {
  it('convertit en secondes depuis minuit', () => {
    expect(parseGtfsTime('07:21:00')).toBe(26_460);
  });

  it('accepte les heures après minuit du jour de service', () => {
    expect(parseGtfsTime('24:25:00')).toBe(87_900);
  });

  it('refuse une heure mal formée', () => {
    expect(() => parseGtfsTime('7h21')).toThrow();
  });
});

describe('formatGtfsTime', () => {
  it('est la réciproque de parseGtfsTime', () => {
    expect(formatGtfsTime(parseGtfsTime('24:25:07'))).toBe('24:25:07');
  });
});
