import { DELAY_THRESHOLD_MINUTES } from '@escargo/shared';

/**
 * Retard compté = arrivée réelle à la gare de descente − arrivée prévue au GTFS,
 * arrondi à la minute inférieure. Sous le seuil, rien n'est compté.
 * Pour un train supprimé, `actualArrival` est l'arrivée réelle du train suivant pris.
 */
export function computeCountedDelay(scheduledArrival: Date, actualArrival: Date): number {
  const minutes = Math.floor((actualArrival.getTime() - scheduledArrival.getTime()) / 60_000);
  return minutes >= DELAY_THRESHOLD_MINUTES ? minutes : 0;
}
