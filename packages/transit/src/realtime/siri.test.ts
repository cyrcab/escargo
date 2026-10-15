import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeEstimatedTimetable, lineIdFromSiri } from './siri';

// Réponse écrite à la main d'après la documentation PRIM, en attendant une vraie réponse
// (clé PRIM) : Transilien H 124303 en retard de 8 min, RER A TAXE79 supprimé, un RER A
// RATP sans numéro de train et un bus.
const feed = decodeEstimatedTimetable(
  JSON.parse(
    readFileSync(new URL('./__fixtures__/prim-estimated-timetable.json', import.meta.url), 'utf8'),
  ),
);
const epoch = (iso: string) => Date.parse(iso) / 1000;

describe('decodeEstimatedTimetable', () => {
  it("lit l'horodatage et tous les trains", () => {
    expect(feed.timestamp).toBe(epoch('2026-10-19T04:10:05Z'));
    expect(feed.journeys).toHaveLength(4);
  });

  it('lit la ligne, le numéro du train et les heures prévues et estimées', () => {
    const [h] = feed.journeys;
    expect(h).toMatchObject({ lineId: 'IDFM:C01737', trainNumber: '124303', cancelled: false });
    expect(h?.calls[1]).toMatchObject({
      aimedArrival: epoch('2026-10-19T06:01:40+02:00'),
      expectedArrival: epoch('2026-10-19T06:09:40+02:00'),
      cancelled: false,
    });
    expect(h?.calls[0]?.aimedArrival).toBeNull();
  });

  it('prend le code de mission quand il n’y a pas de numéro de train', () => {
    expect(feed.journeys[1]?.trainNumber).toBe('TAXE79');
  });

  it('détecte un train supprimé à tous ses arrêts', () => {
    expect(feed.journeys[1]?.cancelled).toBe(true);
  });

  it('accepte un passage seul au lieu d’une liste, et un train sans numéro', () => {
    expect(feed.journeys[2]).toMatchObject({ trainNumber: null, cancelled: false });
    expect(feed.journeys[2]?.calls).toHaveLength(1);
  });

  it('ne plante pas sur une réponse vide ou inattendue', () => {
    expect(decodeEstimatedTimetable({})).toEqual({ timestamp: 0, journeys: [] });
    expect(decodeEstimatedTimetable(null)).toEqual({ timestamp: 0, journeys: [] });
  });
});

describe('lineIdFromSiri', () => {
  it('traduit la ligne SIRI en route_id du GTFS IDFM', () => {
    expect(lineIdFromSiri('STIF:Line::C01742:')).toBe('IDFM:C01742');
    expect(lineIdFromSiri('autre')).toBeNull();
    expect(lineIdFromSiri(null)).toBeNull();
  });
});
