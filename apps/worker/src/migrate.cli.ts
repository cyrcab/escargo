// Applique les migrations Drizzle (packages/db/migrations). En prod, lancé avant le worker et l'API
// par le service `migrate` de infra/docker-compose.prod.yml.
import { createDb } from '@escargo/db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { z } from 'zod';

const env = z
  .object({
    DATABASE_URL: z.url(),
    MIGRATIONS_DIR: z
      .string()
      .default(new URL('../../../packages/db/migrations', import.meta.url).pathname),
  })
  .parse(process.env);

const db = createDb(env.DATABASE_URL);
await migrate(db, { migrationsFolder: env.MIGRATIONS_DIR });
console.log('[migrate] base à jour');
await db.$client.end();
