# Escargo — zen à quai

Appli mobile qui compte le temps perdu à cause des retards de train et en fait un jeu.

```bash
pnpm install
cp .env.example .env
pnpm infra:up
pnpm --filter @escargo/db db:migrate
pnpm dev
```

Voir `CLAUDE.md` pour la carte du repo et les règles, `docs/` pour le cahier des charges et les ADR.
