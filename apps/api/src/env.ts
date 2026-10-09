import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    API_PORT: z.coerce.number().default(3000),
  })
  .parse(process.env);
