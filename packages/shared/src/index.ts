import { z } from 'zod';
import { MascotRecipe, TitleCategory } from './mascot';

export * from './mascot';

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

/** Valeur de `rule` d'un titre dont la condition machine reste à écrire : jamais seedé en base. */
export const RULE_TODO = 'TODO';

/** Une entrée de content/titles/*.yaml. */
export const TitleEntry = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id en kebab-case'),
    name: z.string().min(1),
    description: z.string().min(1),
    rarity: Rarity,
    category: TitleCategory,
    rule: z.string().min(1),
    season: z.string().nullable().default(null),
    /** Données à brancher avant que le titre soit déblocable (API météo, amis hors MVP). */
    requires: z.array(z.enum(['meteo', 'amis'])).default([]),
    recipe: MascotRecipe,
  })
  .strict();
export type TitleEntry = z.infer<typeof TitleEntry>;
export type TitleEntryInput = z.input<typeof TitleEntry>;
