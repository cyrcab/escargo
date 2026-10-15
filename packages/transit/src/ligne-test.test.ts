import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TripRealtime } from './realtime/decode';
import { computeTrainDelay, type TrainDelayStatus } from './train-delay';

// Captures réelles de la ligne test (C6, C16), une par jour, produites par
// `pnpm --filter @escargo/worker rt:capture`. Données publiques de trains seulement.
interface Capture {
  line: string;
  serviceDate: string;
  trains: {
    tripId: string;
    trainNumber: string | null;
    stops: { stopId: string; arrivalSeconds: number }[];
    realtime: TripRealtime | null;
  }[];
}

const dir = new URL('./__fixtures__/ligne-test/', import.meta.url);
const captures: Capture[] = (() => {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Capture);
  } catch {
    return [];
  }
})();

/** Retard au terminus de chaque train de la capture, train suivant de la ligne si supprimé. */
function terminusDelays(capture: Capture) {
  return capture.trains.flatMap((train) => {
    const terminus = train.stops.at(-1);
    if (!terminus) return [];
    const next = capture.trains
      .flatMap((other) => {
        const stop = other.stops.find((s) => s.stopId === terminus.stopId);
        return stop && stop.arrivalSeconds > terminus.arrivalSeconds && other !== train
          ? [{ other, stop }]
          : [];
      })
      .sort((a, b) => a.stop.arrivalSeconds - b.stop.arrivalSeconds)[0];
    const delay = computeTrainDelay({
      serviceDate: capture.serviceDate,
      scheduledArrivalSeconds: terminus.arrivalSeconds,
      alightingStopId: terminus.stopId,
      realtime: train.realtime,
      nextTrain: next
        ? {
            serviceDate: capture.serviceDate,
            scheduledArrivalSeconds: next.stop.arrivalSeconds,
            realtime: next.other.realtime,
          }
        : null,
    });
    return [{ train, terminus, delay }];
  });
}

describe.skipIf(captures.length === 0)('ligne test, captures réelles', () => {
  const all = captures.flatMap(terminusDelays);

  it('chaque retard vérifié correspond au retard annoncé par le flux', () => {
    for (const { train, terminus, delay } of all) {
      if (delay.cancelled || !delay.verified) continue;
      const stop = train.realtime?.stops.find((s) => s.stopId === terminus.stopId);
      // Un écart trahit un horaire GTFS différent de celui du flux (mauvais trip_id).
      if (stop?.arrivalDelay != null && delay.actualArrival !== null) {
        expect(Math.abs(delay.actualArrival - delay.scheduledArrival - stop.arrivalDelay)).toBe(0);
      }
    }
  });

  it('couvre les cas : à l’heure, sous le seuil, au-dessus, supprimé + train suivant', () => {
    const seen = new Set<TrainDelayStatus | 'cancelled_verified'>(
      all.map(({ delay }) =>
        delay.cancelled && delay.verified ? 'cancelled_verified' : delay.status,
      ),
    );
    expect([...seen]).toEqual(
      expect.arrayContaining(['on_time', 'below_threshold', 'delayed', 'cancelled_verified']),
    );
  });
});
