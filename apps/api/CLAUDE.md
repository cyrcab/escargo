# apps/api

Fastify 5. `src/app.ts` construit l'app (testable via `app.inject`), `src/server.ts` écoute.

- Une route = un plugin Fastify par domaine dans `src/routes/<domaine>.ts`.
- Validation entrée/sortie avec les schémas Zod de `@escargo/shared`.
- Accès BDD via `createDb` de `@escargo/db`. Jamais de SQL brut hors migrations, sauf requêtes de classement justifiées.
- Retards lus dans le cache Redis alimenté par `apps/worker`. L'API n'appelle jamais SNCF/PRIM directement.
- Ne jamais logger de position, de gare liée à un pseudo, ni de token.
- Tests : Vitest + `app.inject`, un fichier `*.test.ts` à côté du code. Chaque route a son test.
- Migrations : modifie `packages/db/src/schema.ts` puis `pnpm --filter @escargo/db db:generate --name <nom>`. Jamais de fichier de `migrations/` écrit à la main.
- Classements : requêtes indexées, pseudo seul en sortie, jamais de gares. Aucune position stockée ni loguée.
