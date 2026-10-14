import type { TrainMode } from '@escargo/shared';
import type { RouteRow } from './parse';

// Dans le GTFS IDFM, les trains (route_type 2) sont classés par ligne : RER A à E,
// Transilien H à V. Les TER qui entrent en Île-de-France y figurent aussi, mais ils
// viennent déjà du GTFS SNCF : ils sont écartés pour ne pas compter un train deux fois.
const RER_LINES = new Set(['A', 'B', 'C', 'D', 'E']);
const TRANSILIEN_LINES = new Set(['H', 'J', 'K', 'L', 'N', 'P', 'R', 'U', 'V']);

/** Mode Escargo d'une ligne du GTFS IDFM, ou `null` si elle n'est pas gardée (bus, métro, TER…). */
export function idfmRouteMode(
  route: Pick<RouteRow, 'route_type' | 'route_short_name'>,
): TrainMode | null {
  if (route.route_type !== '2') return null;
  if (RER_LINES.has(route.route_short_name)) return 'RER';
  if (TRANSILIEN_LINES.has(route.route_short_name)) return 'TRANSILIEN';
  return null;
}
