import { z } from 'zod';

/** En dessous de ce seuil, un retard n'est pas compté (définition ponctualité IDFM). */
export const DELAY_THRESHOLD_MINUTES = 5;

export const TrainMode = z.enum(['TER', 'INTERCITES', 'TGV', 'TRANSILIEN', 'RER']);
export type TrainMode = z.infer<typeof TrainMode>;

export const DataSource = z.enum(['SNCF_GTFS_RT', 'PRIM', 'NAVITIA', 'MANUAL']);
export type DataSource = z.infer<typeof DataSource>;

/** Horaires théoriques : GTFS national SNCF, ou GTFS Île-de-France Mobilités (RER, Transilien). */
export const GtfsFeed = z.enum(['SNCF', 'IDFM']);
export type GtfsFeed = z.infer<typeof GtfsFeed>;

export const Rarity = z.enum(['common', 'rare', 'legendary']);
export type Rarity = z.infer<typeof Rarity>;

/** Ce que l'appli envoie au serveur : jamais de coordonnées GPS. */
export const TripInput = z.object({
  tripId: z.string().min(1),
  serviceDate: z.iso.date(),
  departureStopId: z.string().min(1),
  arrivalStopId: z.string().min(1),
  detectedAtStation: z.boolean(),
});
export type TripInput = z.infer<typeof TripInput>;

export const Trip = TripInput.extend({
  id: z.uuid(),
  mode: TrainMode,
  lineId: z.string(),
  scheduledArrival: z.iso.datetime(),
  actualArrival: z.iso.datetime().nullable(),
  delayMinutes: z.number().int().nonnegative(),
  cancelled: z.boolean(),
  verified: z.boolean(),
  source: DataSource,
});
export type Trip = z.infer<typeof Trip>;
