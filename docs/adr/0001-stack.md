# ADR 0001 — Stack du MVP

Date : 2026-10-09 · Statut : accepté

## Décision

- Monorepo pnpm workspaces + Turborepo, TypeScript strict partout (TS 6, aligné sur Expo SDK 57).
- Mobile : Expo SDK 57, Expo Router, Reanimated 4. `nodeLinker: hoisted` pour Metro.
- Backend : Fastify 5 (`apps/api`) et un worker séparé (`apps/worker`) pour le polling temps réel.
- Données : PostgreSQL 17 via Drizzle ORM (migrations générées), Redis 8 pour le cache par train.
- Packages internes consommés en source TS, sans étape de build ; api et worker bundlés avec esbuild pour la prod.
- Qualité : Biome (lint + format), Vitest, CI GitHub Actions.
- Hébergement : Docker self-host sur un VPS dans l'UE, fournisseur à choisir.

## Raisons

- Une seule langue de l'appli au serveur, types et schémas Zod partagés.
- Worker séparé : coût du temps réel indépendant du nombre d'utilisateurs et de la charge API.
- Logique métier (retard, titres, anti-triche) en fonctions pures dans `packages/*`, testable sans réseau.
- Self-host : coût fixe bas, contrôle RGPD.

## Conséquences

- Il faut maintenir Postgres et Redis soi-même (sauvegardes, mises à jour).
- `npx expo install` obligatoire pour les dépendances mobiles.
