---
name: check-train
description: Diagnostique le retard d'un train donné en interrogeant les flux temps réel (SNCF GTFS-RT, PRIM, Navitia) et le calcul Escargo. Utiliser pour déboguer un retard faux ou vérifier la couverture d'une ligne.
argument-hint: <numéro de train ou trip_id> [date AAAA-MM-JJ]
---

Diagnostique le train « $ARGUMENTS » avec l'agent `transit-expert`.

1. Retrouve le `trip_id` dans le GTFS statique (`data/`), les arrêts et horaires prévus.
2. Interroge les flux temps réel disponibles (clés dans `.env`, jamais affichées) et le cache Redis local s'il tourne.
3. Calcule le retard avec `@escargo/transit` et compare aux flux.
4. Rends : horaires prévus et réels par arrêt, source qui couvre le train, retard compté, et toute incohérence (train absent du flux, trip_id différent, suppression non signalée).

Ligne de référence : TER Aubiet – Saint-Martin-du-Touch via Colomiers.
