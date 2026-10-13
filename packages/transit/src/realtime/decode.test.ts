import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeTripUpdates } from './decode';

// Extrait réencodé du flux GTFS-RT SNCF du 13/10/2026 à 18 h 09 : TER 870314 et 870315
// (ligne C6), 870411 supprimé, un train ajouté et un train avec un arrêt sauté.
const feed = decodeTripUpdates(
  readFileSync(new URL('./__fixtures__/sncf-trip-updates.pb', import.meta.url)),
);
const trip = (number: string) => feed.trips.find((t) => t.tripId.startsWith(`OCESN${number}`));

describe('decodeTripUpdates', () => {
  it("lit l'horodatage du flux et tous les trains", () => {
    expect(feed.timestamp).toBe(1_791_907_747);
    expect(feed.trips).toHaveLength(5);
  });

  it('lit le retard de 60 min du 870315 à Colomiers, avec la date de service', () => {
    const t = trip('870315');
    expect(t).toMatchObject({ serviceDate: '2026-10-13', status: 'scheduled' });
    const colomiers = t?.stops.find((s) => s.stopId === 'StopPoint:OCETrain TER-87611467');
    expect(colomiers?.arrivalDelay).toBe(3600);
    // 18 h 44 heure de Paris.
    expect(colomiers?.arrivalTime).toBe(Date.parse('2026-10-13T18:44:00+02:00') / 1000);
  });

  it("n'invente pas d'arrivée au terminus de départ", () => {
    const first = trip('870315')?.stops[0];
    expect(first).toMatchObject({ arrivalTime: null, arrivalDelay: null, departureDelay: 3600 });
  });

  it('détecte un train supprimé', () => {
    expect(trip('870411')?.status).toBe('cancelled');
  });

  it('détecte un train ajouté', () => {
    expect(feed.trips.filter((t) => t.status === 'added')).toHaveLength(1);
  });

  it('détecte un arrêt sauté', () => {
    expect(feed.trips.some((t) => t.status === 'scheduled' && t.stops.some((s) => s.skipped))).toBe(
      true,
    );
  });
});
