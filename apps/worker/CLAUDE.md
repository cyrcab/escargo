# apps/worker

Process séparé de l'API. Toutes les 2 min : GTFS-RT national SNCF (TGV, Intercités, une partie des TER) ; PRIM pour l'Île-de-France (quotas journaliers : à respecter) ; Navitia en secours.

- Parsing et calcul dans `@escargo/transit` (pur, testé), ici seulement orchestration + I/O.
- Cache Redis par `trip_id` + date de service : coût indépendant du nombre d'utilisateurs.
- GTFS statiques téléchargés dans `data/` (gitignoré), réimport quotidien.
- Ligne de test prioritaire : TER Aubiet – Saint-Martin-du-Touch via Colomiers (vérifier sa couverture temps réel en premier).
