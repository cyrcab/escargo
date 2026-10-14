import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    SNCF_GTFS_URL: z.url(),
    SNCF_GTFS_RT_URL: z.url(),
    IDFM_GTFS_URL: z.url().default('https://eu.ftp.opendatasoft.com/stif/GTFS/IDFM-gtfs.zip'),
    /** Clé PRIM (prim.iledefrance-mobilites.fr). Absente : pas de temps réel Île-de-France. */
    PRIM_API_KEY: z
      .string()
      .optional()
      .transform((key) => key || undefined),
    /** La clé PRIM part avec chaque appel : seulement vers PRIM, en HTTPS. */
    PRIM_ESTIMATED_TIMETABLE_URL: z
      .url({ protocol: /^https$/, hostname: /^prim\.iledefrance-mobilites\.fr$/ })
      .default('https://prim.iledefrance-mobilites.fr/marketplace/estimated-timetable'),
    /** Dossier des fichiers GTFS téléchargés (gitignoré). */
    DATA_DIR: z.string().default('data'),
  })
  .parse(process.env);
