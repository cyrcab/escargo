import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.url(),
    SNCF_GTFS_URL: z.url(),
    /** Dossier des fichiers GTFS téléchargés (gitignoré). */
    DATA_DIR: z.string().default('data'),
  })
  .parse(process.env);
