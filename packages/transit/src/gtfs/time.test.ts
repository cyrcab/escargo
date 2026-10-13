import { describe, expect, it } from 'vitest';
import { formatGtfsTime, parseGtfsTime, serviceDaySeconds } from './time';

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

describe('serviceDaySeconds', () => {
  const epoch = (iso: string) => Date.parse(iso) / 1000;

  it("ramène un instant à l'heure GTFS du jour de service", () => {
    expect(serviceDaySeconds(epoch('2026-10-13T07:21:00+02:00'), '2026-10-13')).toBe(
      parseGtfsTime('07:21:00'),
    );
  });

  it('compte après minuit dans le jour de service de la veille', () => {
    expect(serviceDaySeconds(epoch('2026-10-14T00:25:00+02:00'), '2026-10-13')).toBe(
      parseGtfsTime('24:25:00'),
    );
  });

  it("reste juste le jour du passage à l'heure d'hiver", () => {
    expect(serviceDaySeconds(epoch('2026-10-25T07:00:00+01:00'), '2026-10-25')).toBe(
      parseGtfsTime('07:00:00'),
    );
  });
});
