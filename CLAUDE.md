# Escargo

Appli mobile qui compte le temps perdu à cause des retards de train sur l'année et en fait un jeu (titres, badges, classements, bilan annuel partageable). MVP pour tester le buzz. Cahier des charges : `docs/cahier-des-charges.md`.

## Carte du repo

- `apps/mobile` : Expo Router (iOS + Android), React Native, Reanimated
- `apps/api` : Fastify, auth Apple/Google, trajets, classements, titres
- `apps/worker` : ingestion GTFS + polling temps réel SNCF (2 min) / PRIM, cache Redis par train
- `packages/shared` : types + schémas Zod partagés appli ↔ backend
- `packages/transit` : clients GTFS/GTFS-RT/PRIM/Navitia, calcul du retard (fonctions pures)
- `packages/gamification` : paliers, titres, badges, anti-triche (fonctions pures)
- `packages/db` : schéma Drizzle + migrations Postgres
- `packages/design-tokens` : tokens du design system Escargo
- `content/titles` : catalogue de titres (YAML relu à la main, seedé en base)
- `infra` : docker compose dev, Dockerfile prod (hébergeur UE non choisi)
- `docs/adr` : décisions d'architecture

## Commandes

```bash
pnpm install
pnpm infra:up                        # Postgres + Redis locaux
pnpm dev                             # tout en parallèle (turbo)
pnpm --filter @escargo/api dev       # un seul paquet
pnpm typecheck && pnpm test          # avant de déclarer une tâche finie
pnpm format                          # Biome (lint + format)
pnpm --filter @escargo/db db:generate --name <nom>   # nouvelle migration
```

Les packages internes s'importent en source TS (`exports: ./src/index.ts`), sans build.
Mobile : toujours `npx expo install <pkg>` dans `apps/mobile`, jamais `pnpm add`.

## Règles non négociables

- **Vie privée** : aucune coordonnée GPS ne quitte le téléphone. Le serveur reçoit seulement train, gares, horaires, retard. Classements = pseudo seul, jamais les gares.
- **Retard** = arrivée réelle à la gare de descente − arrivée prévue GTFS. Compté seulement à partir de 5 min (`DELAY_THRESHOLD_MINUTES`). Seuls les retards vérifiés par le temps réel comptent dans titres et classements.
- **Marques** : jamais de nom, logo ou visuel SNCF, IDFM ou d'un opérateur dans l'appli. Titres pop culture par allusion seulement.
- **Ton** : tutoiement, complice, léger, jamais aigri ni moqueur envers les agents.
- **Design** : tokens de `@escargo/design-tokens` uniquement, pas de couleur en dur. Un seul aplat orange par écran, jamais de texte blanc sur orange, ni ombre ni dégradé. Respect de « Réduire les animations ».
- **Hébergement** : données dans l'UE uniquement.
- Logique métier (retard, titres, anti-triche) dans `packages/*` en fonctions pures, avec tests Vitest.

## Flow de travail

1. Une issue GitHub par tâche, milestone = phase du planning.
2. `/feature <n° issue>` : branche, plan, implémentation, tests, PR.
   Une fonctionnalité = un seul contexte qui code tout (packages, API, appli). Les agents spécialisés servent de consultants ou pour des sous-tâches isolées, jamais pour découper une fonctionnalité par techno.
3. Pour des tâches parallèles : `claude --worktree <nom>`.
4. Avant PR : `pnpm typecheck && pnpm test`, puis `/code-review`. Agents `privacy-reviewer` ou `design-reviewer` si la PR touche données ou UI.
5. Commits en Conventional Commits (`feat(mobile): …`), en anglais.
