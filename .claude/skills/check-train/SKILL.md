---
name: check-train
description: Diagnostique le retard d'un train donné en interrogeant les flux temps réel (SNCF GTFS-RT, PRIM, Navitia) et le calcul Escargo. Utiliser pour déboguer un retard faux ou vérifier la couverture d'une ligne.
argument-hint: <numéro de train ou trip_id> [date AAAA-MM-JJ]
---

Diagnostique le train « $ARGUMENTS » avec l'agent `transit-expert`.

1. Lance `pnpm --filter @escargo/worker check-train <n° de train | trip_id> [AAAA-MM-JJ]` (Postgres et Redis locaux, GTFS importé via `gtfs:import`). Il affiche le `trip_id`, la présence dans le cache Redis et dans le flux SNCF en direct, puis, gare par gare, l'heure prévue, l'heure réelle et le retard compté par `computeTrainDelay` (train suivant de la ligne si supprimé).
2. Si le train manque du cache et du flux SNCF, interroge les autres sources disponibles (PRIM, Navitia ; clés dans `.env`, jamais affichées).
3. Rends : horaires prévus et réels par arrêt, source qui couvre le train, retard compté, et toute incohérence (train absent du flux, trip_id différent, suppression non signalée).

Pour figer une journée de la ligne test en fixtures : `pnpm --filter @escargo/worker rt:capture [AAAA-MM-JJ]` (écrit `packages/transit/src/__fixtures__/ligne-test/`).

Ligne de référence : TER Aubiet – Saint-Martin-du-Touch via Colomiers.
