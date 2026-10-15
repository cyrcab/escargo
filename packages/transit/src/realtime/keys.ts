// Clés Redis du cache temps réel : écrites par le worker, lues par l'API.

/** Dernier état connu d'un train : JSON `TripRealtime`. */
export const tripKey = (serviceDate: string, tripId: string) => `rt:trip:${serviceDate}:${tripId}`;

/** Ensemble des trip_id vus dans le flux pour une date de service. */
export const seenKey = (serviceDate: string) => `rt:seen:${serviceDate}`;

/** Hash `first` / `last` : premier et dernier relevé du flux (secondes epoch) pour une date. */
export const pollsKey = (serviceDate: string) => `rt:polls:${serviceDate}`;

/** Hash : horodatage et compteurs du dernier flux lu. */
export const FEED_KEY = 'rt:feed';

/** Couvre un train qui roule après minuit et le temps de valider le trajet ensuite. */
export const TRIP_TTL_SECONDS = 48 * 3600;

/** Hash : horodatage et compteurs du dernier relevé PRIM (Île-de-France). */
export const PRIM_FEED_KEY = 'rt:feed:prim';

/** Compteur des appels PRIM d'un jour (heure de Paris), pour tenir le quota journalier. */
export const primCallsKey = (date: string) => `prim:calls:${date}`;
