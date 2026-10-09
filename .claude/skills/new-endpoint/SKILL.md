---
name: new-endpoint
description: Ajoute une route Fastify avec schéma Zod partagé et test. Utiliser pour tout nouvel endpoint de apps/api.
argument-hint: <MÉTHODE> <chemin> <description>
---

Ajoute l'endpoint « $ARGUMENTS » avec l'agent `backend-dev`.

1. Schémas d'entrée et de sortie dans `packages/shared/src/` (exportés depuis l'index), réutilisables par l'appli.
2. Route dans `apps/api/src/routes/<domaine>.ts` (plugin Fastify), enregistrée dans `src/app.ts`.
3. Auth requise sauf raison explicite. Pas de position, pas de gares d'autres utilisateurs en sortie.
4. Si le schéma BDD change : modifie `packages/db/src/schema.ts` puis génère la migration.
5. Test `app.inject` : cas nominal, entrée invalide (400), non authentifié (401).
6. `pnpm typecheck && pnpm test`.
