# ADR 0004 — Hébergement : un VPS OVHcloud en France

Date : 2026-10-15 · Statut : accepté

## Contexte

Le backend (API, worker, Postgres, Redis) doit tourner en continu : le flux temps réel SNCF ne publie qu'une fenêtre glissante (trains en cours et de l'heure qui suit), donc un relevé manqué est perdu. Contrainte RGPD du projet : données dans l'UE uniquement. MVP pour tester le concept : budget au plus bas, une seule machine suffit.

Comparatif (prix HT par mois, relevés en octobre 2026 après les hausses de l'année, à confirmer au moment de commander) :

| | Hetzner CX23 | OVHcloud VPS-1 | Scaleway DEV1-M |
|---|---|---|---|
| Machine | 2 vCPU, 4 Go | 4 vCore, 8 Go, 75 Go | 3 vCPU, 4 Go |
| Prix | ≈ 5,5 € + 0,5 € IPv4 | ≈ 7,8 € | ≈ 14,7 € + IPv4 et disque |
| Lieu | Allemagne, Finlande | France | France |
| Docker | oui | oui | oui |

## Décision

Un VPS-1 OVHcloud dans un datacenter français. Tout tourne sur la machine avec Docker Compose (`infra/docker-compose.prod.yml`) : Caddy (TLS), API, worker, Postgres 17, Redis 8, et une sauvegarde Postgres quotidienne.

## Raisons

- Deux fois plus de mémoire que Hetzner pour environ 2 € de plus : Postgres et les imports GTFS (SNCF, IDFM trois fois par jour) tiennent sans risque.
- Données en France chez un hébergeur français : simple à afficher dans la politique de confidentialité.
- Scaleway coûte deux fois plus à machine égale.
- Docker Compose plutôt qu'un orchestrateur : une machine, un fichier, déploiement par `git pull` puis `up -d --build`.

## Conséquences

- Hetzner CX23 reste le plan B, au même compose.
- Pas de redondance : si la machine tombe, l'appli tombe. Acceptable pour le MVP.
- Les sauvegardes restent sur le VPS (7 jours) : une copie hors machine (stockage objet UE) est à ajouter avant l'ouverture aux utilisateurs.
- Sans nom de domaine, Caddy sert l'API en HTTP seul : à réserver aux tests, jamais avec de vrais utilisateurs.
