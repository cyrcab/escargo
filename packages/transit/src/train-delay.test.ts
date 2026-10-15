import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseGtfsTime } from './gtfs/time';
import type { TripRealtime } from './realtime/decode';
import { decodeTripUpdates } from './realtime/decode';
import { computeTrainDelay } from './train-delay';

const COLOMIERS = 'StopPoint:OCETrain TER-87611467';
const MATABIAU = 'StopPoint:OCETrain TER-87611004';
const date = '2026-10-13';
const at = (hhmm: string) => Date.parse(`${date}T${hhmm}:00+02:00`) / 1000;

// Flux GTFS-RT SNCF réel du 13/10/2026 à 18 h 09, ligne C6. Les heures prévues sont celles
// du flux (heure réelle − retard annoncé).
const feed = decodeTripUpdates(
  readFileSync(new URL('./realtime/__fixtures__/sncf-trip-updates.pb', import.meta.url)),
);
const real = (number: string) => {
  const trip = feed.trips.find((t) => t.tripId.startsWith(`OCESN${number}`));
  if (!trip) throw new Error(`Train ${number} absent du flux`);
  return trip;
};

describe('computeTrainDelay sur le flux réel de la ligne C6', () => {
  it('compte 5 min pile pour le 870314 à Matabiau', () => {
    const delay = computeTrainDelay({
      serviceDate: date,
      scheduledArrivalSeconds: parseGtfsTime('18:36:00'),
      alightingStopId: MATABIAU,
      realtime: real('870314'),
    });
    expect(delay).toEqual({
      status: 'delayed',
      delayMinutes: 5,
      scheduledArrival: at('18:36'),
      actualArrival: at('18:41'),
      cancelled: false,
      verified: true,
      source: 'SNCF_GTFS_RT',
    });
  });

  it('compte 60 min pour le 870315 à Colomiers', () => {
    const delay = computeTrainDelay({
      serviceDate: date,
      scheduledArrivalSeconds: parseGtfsTime('17:44:00'),
      alightingStopId: COLOMIERS,
      realtime: real('870315'),
    });
    expect(delay).toMatchObject({ status: 'delayed', delayMinutes: 60, verified: true });
  });

  it('870411 supprimé : compte jusqu’à l’arrivée réelle du 870315 à Colomiers', () => {
    const delay = computeTrainDelay({
      serviceDate: date,
      scheduledArrivalSeconds: parseGtfsTime('17:16:00'),
      alightingStopId: COLOMIERS,
      realtime: real('870411'),
      nextTrain: {
        serviceDate: date,
        scheduledArrivalSeconds: parseGtfsTime('17:44:00'),
        realtime: real('870315'),
      },
    });
    expect(delay).toEqual({
      status: 'cancelled',
      delayMinutes: 88,
      scheduledArrival: at('17:16'),
      actualArrival: at('18:44'),
      cancelled: true,
      verified: true,
      source: 'SNCF_GTFS_RT',
    });
  });

  it('870411 supprimé sans train suivant : suppression notée, rien de compté', () => {
    const delay = computeTrainDelay({
      serviceDate: date,
      scheduledArrivalSeconds: parseGtfsTime('17:16:00'),
      alightingStopId: COLOMIERS,
      realtime: real('870411'),
    });
    expect(delay).toMatchObject({
      status: 'cancelled',
      delayMinutes: 0,
      cancelled: true,
      verified: false,
    });
  });
});

// Lectures écrites à la main sur l'horaire réel du 870302 (GTFS SNCF), arrivée 08:14
// à Colomiers, en attendant une capture réelle de ces cas.
const reading = (stop: Partial<TripRealtime['stops'][number]>): TripRealtime => ({
  tripId: 'OCESN870302F1187',
  serviceDate: date,
  status: 'scheduled',
  source: 'SNCF_GTFS_RT',
  updatedAt: at('08:20'),
  stops: [
    {
      stopId: COLOMIERS,
      arrivalTime: null,
      arrivalDelay: null,
      departureTime: null,
      departureDelay: null,
      skipped: false,
      ...stop,
    },
  ],
});
const train870302 = (realtime: TripRealtime | null) =>
  computeTrainDelay({
    serviceDate: date,
    scheduledArrivalSeconds: parseGtfsTime('08:14:00'),
    alightingStopId: COLOMIERS,
    realtime,
  });

describe('computeTrainDelay, cas limites', () => {
  it('à l’heure', () => {
    expect(train870302(reading({ arrivalTime: at('08:14'), arrivalDelay: 0 }))).toMatchObject({
      status: 'on_time',
      delayMinutes: 0,
      verified: true,
    });
  });

  it('en avance : à l’heure', () => {
    expect(train870302(reading({ arrivalTime: at('08:13') }))).toMatchObject({
      status: 'on_time',
      delayMinutes: 0,
    });
  });

  it('4 min 59 de retard : sous le seuil, rien de compté', () => {
    expect(train870302(reading({ arrivalTime: at('08:18') + 59 }))).toMatchObject({
      status: 'below_threshold',
      delayMinutes: 0,
      verified: true,
    });
  });

  it('lit le retard seul quand le flux ne donne pas l’heure', () => {
    expect(train870302(reading({ arrivalDelay: 420 }))).toMatchObject({
      status: 'delayed',
      delayMinutes: 7,
      actualArrival: at('08:21'),
    });
  });

  it('train absent du flux : non vérifié', () => {
    expect(train870302(null)).toMatchObject({
      status: 'unverified',
      delayMinutes: 0,
      verified: false,
      source: null,
    });
  });

  it('gare absente de la lecture : non vérifié, jamais « à l’heure »', () => {
    const realtime = { ...reading({}), stops: [] };
    expect(train870302(realtime)).toMatchObject({ status: 'unverified', verified: false });
  });

  it('arrêt sauté à la gare de descente : traité comme une suppression', () => {
    expect(train870302(reading({ skipped: true, arrivalTime: at('08:14') }))).toMatchObject({
      status: 'cancelled',
      cancelled: true,
      verified: false,
    });
  });

  it('train suivant supprimé lui aussi : rien de compté', () => {
    const cancelled = { ...reading({ arrivalTime: at('09:14') }), status: 'cancelled' as const };
    expect(
      computeTrainDelay({
        serviceDate: date,
        scheduledArrivalSeconds: parseGtfsTime('08:14:00'),
        alightingStopId: COLOMIERS,
        realtime: cancelled,
        nextTrain: {
          serviceDate: date,
          scheduledArrivalSeconds: parseGtfsTime('09:14:00'),
          realtime: cancelled,
        },
      }),
    ).toMatchObject({ status: 'cancelled', delayMinutes: 0, verified: false });
  });
});
