import type { TrainMode } from '@escargo/shared';

/**
 * Dans le GTFS SNCF, le type de service est porté par l'arrêt :
 * `StopPoint:OCETrain TER-87611764`, `StopPoint:OCECar TER-…`, `StopPoint:OCETGV INOUI-…`.
 * Renvoie le mode Escargo, ou `null` pour ce qui n'est pas un train (car, navette, tram-train).
 */
const MODE_BY_STOP_KIND: Record<string, TrainMode> = {
  'Train TER': 'TER',
  Train: 'TER',
  'TGV INOUI': 'TGV',
  OUIGO: 'TGV',
  ICE: 'TGV',
  Lyria: 'TGV',
  INTERCITES: 'INTERCITES',
  'INTERCITES de nuit': 'INTERCITES',
};

export function stopKind(stopId: string): string | null {
  return /^StopPoint:OCE(.+)-\d+$/.exec(stopId)?.[1] ?? null;
}

export function modeFromStopId(stopId: string): TrainMode | null {
  const kind = stopKind(stopId);
  return kind ? (MODE_BY_STOP_KIND[kind] ?? null) : null;
}
