# ADR 0002 — Retard compté par train, pas par trajet avec correspondance

Date : 2026-10-13 · Statut : accepté

## Contexte

Beaucoup de navetteurs font un trajet en plusieurs trains (exemple : Aubiet → Colomiers sur la ligne C6, puis Colomiers → Saint-Martin du Touch sur la C16). Un premier train en retard peut faire rater la correspondance : le temps réellement perdu à l'arrivée finale dépasse alors le retard de chaque train.

## Décision

Pour le MVP, chaque train est un trajet distinct. Son retard = arrivée réelle à sa gare de descente − arrivée prévue GTFS, compté à partir de 5 min. Une correspondance ratée n'ajoute rien.

## Raisons

- Vérifiable train par train dans le flux GTFS-RT : l'anti-triche reste simple.
- Pas besoin de modéliser les correspondances ni de deviner le train de rattrapage.
- Sous-estimer le temps perdu est acceptable pour tester le concept.

## Conséquences

- Le compteur peut afficher moins que le temps vraiment perdu les jours de correspondance ratée.
- Piste pour plus tard : regrouper les trains d'un même trajet et mesurer l'arrivée finale, ou un badge « correspondance ratée ».
