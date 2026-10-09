# Infra

- `docker-compose.yml` : Postgres 17 + Redis 8 pour le dev local (`pnpm infra:up`).
- `Dockerfile.node` : image de prod commune à `api` et `worker`.

Hébergement de prod : VPS dans l'UE, fournisseur pas encore choisi. Contrainte RGPD : serveurs dans l'UE uniquement.
