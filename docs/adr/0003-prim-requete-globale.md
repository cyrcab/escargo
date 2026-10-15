# ADR 0003 — Temps réel Île-de-France : un appel PRIM pour tout le réseau

Date : 2026-10-14 · Statut : accepté

## Contexte

Le flux GTFS-RT national SNCF ne couvre pas le RER ni le Transilien. Leur temps réel vient de PRIM (Île-de-France Mobilités), en SIRI Lite, avec une clé et un quota journalier. L'issue #4 prévoyait des appels « mutualisés par gare » (stop-monitoring). Or le quota par défaut est de 1 000 appels par jour :

- toutes les gares RER et Transilien (≈ 400) toutes les 2 min : ≈ 290 000 appels par jour ;
- seulement les gares des trains en cours d'utilisateurs : ≈ 3 000 appels par jour, et le volume grandit avec le succès de l'appli.

## Décision

Un seul appel `estimated-timetable` (requête globale) toutes les 2 minutes, soit 720 par jour, plafonné à 950 par un compteur Redis (`prim:calls:<jour>`). Le worker garde les lignes RER et Transilien du GTFS IDFM et rapproche chaque train SIRI de son `trip_id` par **numéro de train + jour de service**, puis chaque passage de son arrêt GTFS par **l'heure prévue**.

Un train sans numéro, ou qui correspond à plusieurs trains du GTFS, est ignoré.

## Raisons

- Coût fixe, indépendant du nombre d'utilisateurs, dans le quota gratuit.
- Aucun appel ne dépend d'un utilisateur : PRIM ne voit rien de leurs trajets.
- Le numéro de train est unique par jour dans le GTFS IDFM (vérifié sur le GTFS du 14/10/2026 : 4 818 trains, aucun doublon).
- Les quais SIRI (`STIF:StopPoint:Q:…`) n'ont pas d'équivalent direct dans les `stop_id` GTFS : l'heure prévue évite une table de correspondance.

## Conséquences

- Les courses RATP du RER A et B n'ont pas de numéro de train dans la requête globale (documentation PRIM) : leur temps réel n'est pas encore exploité. Les trains à forte fréquence sont mis de côté pour le MVP.
- Forme de la réponse SIRI à confirmer sur un vrai appel dès que la clé PRIM existe.
- Le GTFS IDFM est réimporté au plus trois fois par jour (8 h 30, 13 h 30, 17 h 30), seulement s'il a changé.
