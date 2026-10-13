# Cahier des charges — MVP Escargo

8 octobre 2026 · Cyril. Source : https://claude.ai/artifact/CSmwcdz5UdtXoQBMmxHZbg

## Vision et objectifs

L'appli compte, pour chaque voyageur, le temps perdu à cause des retards de train sur une année, et transforme cette frustration en jeu : titres, badges, classements et bilan annuel partageable.

Le MVP sert à une seule chose : vérifier que le concept prend et peut faire le buzz, avant d'investir dans des applis natives.

**Cible** : les navetteurs réguliers en train partout en France, sur tous les trains : TER, Intercités, TGV, Transilien et RER.

**Critère de succès** : l'appli couvre seule ses frais grâce à la pub. Pas d'indicateur chiffré au départ.

## Périmètre

Tous les trains de France, en semi-automatique : l'appli détecte la gare, l'utilisateur confirme son train d'un tap, le retard se calcule seul.

| Dans le MVP | Hors périmètre (plus tard) |
| --- | --- |
| iOS et Android, une seule base de code (Expo) | Applis natives Swift et Kotlin |
| Tous les trains en France : TER, Intercités, TGV, Transilien, RER | Métro, bus, tram ; trains à l'étranger |
| Détection en gare + confirmation du train | Détection 100 % automatique du trajet |
| Compteur annuel, historique, titres, badges | Défis entre amis, saisons, événements |
| Classements par ligne et global | Classements par entreprise ou par ville |
| Bilan annuel partageable (« Wrapped ») | Aide à la demande de remboursement IDFM |
| Pub discrète | Abonnement premium |
| Live Activity iOS (retard en direct) | Widgets écran d'accueil, Apple Watch |

## Parcours utilisateur principal

Un trajet se compte sans rien saisir quand le bon train est suggéré à l'entrée en gare. Si la suggestion est fausse, l'utilisateur choisit son train dans les départs de la gare. Sans localisation, il déclare tout à la main ; ses trajets restent hors classements s'ils ne sont pas vérifiables.

## Fonctionnalités

1. **Accueil — le compteur** : total de minutes perdues sur l'année civile, équivalence fun quotidienne, titre actuel et progression.
2. **Trajet en cours** : suggestion du train à l'arrivée en gare (confirmation d'un tap ou liste des départs), retard en direct (aussi en Live Activity iPhone), retard définitif à l'arrivée, badge débloqué.
3. **Historique** : trajets (date, train, gares, retard, « vérifié »), stats simples (pire retard, ligne la plus pénible, jour le plus touché).
4. **Classements** : par ligne et global, remis à zéro chaque année, retards vérifiés seulement.
5. **Profil et réglages** : pseudo, avatar, lignes favorites, badges, autorisations, suppression du compte.

**Bilan annuel** : en décembre, récap en stories (total, pire trajet, titre de l'année, rang sur sa ligne) exportable en image.

**Compte** : connexion Apple et Google uniquement.

**Animation** : chiffres qui roulent, mascotte vivante, célébration plein écran à chaque titre, haptique, respect de « Réduire les animations ». Détail dans le design system (`packages/design-tokens/README.md`).

## Gamification

Les titres récompensent le cumul annuel, les badges récompensent des moments ; seuls les retards vérifiés font progresser.

| Palier | Cumul annuel | Titre |
| --- | --- | --- |
| 1 | 0 à 1 h | Voyageur serein |
| 2 | 1 à 5 h | Habitué du quai |
| 3 | 5 à 15 h | Patient confirmé |
| 4 | 15 à 30 h | Martyr du rail |
| 5 | 30 à 60 h | Légende du quai |
| 6 | plus de 60 h | Fantôme des quais |

Titre spécial de ligne pour le top 10 (« Roi du RER B »).

**Catalogue** : 500 à 600 titres au lancement, stockés côté backend, débloqués par situation (ligne, horaire, météo, type de train, record, série), ton pop culture par allusion, rareté commun/rare/légendaire, premier jet généré puis relu à la main.

**Badges de lancement** : Baptême (premier retard vérifié), Grande traversée (> 1 h), Série noire (5 jours ouvrés de suite), Lundi maudit (4 lundis dans le mois), Train fantôme (train supprimé), Lève-tôt (train avant 6 h).

**Anti-triche** : retard confirmé par le temps réel SNCF ou IDFM pour le train choisi ; position cohérente en gare de départ ; un seul trajet à la fois, pas de chevauchement ; trajets non vérifiables hors classements.

## Données et APIs

| Source | Contenu | Usage | Accès |
| --- | --- | --- | --- |
| [SNCF — GTFS et GTFS-RT national](https://www.data.gouv.fr/datasets/horaires-sncf/informations) | Horaires TER, Intercités, TGV sur 151 jours ; temps réel toutes les 2 min | Source principale hors IDF | Gratuit, sans clé |
| [PRIM — GTFS IDFM](https://prim.iledefrance-mobilites.fr/en/jeux-de-donnees/offre-horaires-tc-gtfs-idfm) | Lignes, gares, horaires sur 30 jours, 3 MAJ/jour | Gares, départs et arrivées prévus | Gratuit, compte PRIM |
| [PRIM — temps réel](https://prim.iledefrance-mobilites.fr/en/actualites/article/temps-reel) | Prochains passages, perturbations | Retard en direct, arrivée réelle | Gratuit, clé, quotas/jour |
| [API SNCF (Navitia)](https://numerique.sncf.com/startup/api/) | Horaires théoriques et temps réel, perturbations | Recoupement, secours | Gratuit, token, quota |

L'ancienne API temps réel Transilien est fermée. Le flux national SNCF ne garantit que TGV et Intercités ; TER en partie, à compléter par les flux régionaux.

**Calcul du retard** : arrivée réelle à la gare de descente − arrivée prévue GTFS ; compté à partir de 5 min ; chaque train compte séparément, une correspondance ratée n'ajoute rien (voir `docs/adr/0002-retard-par-train.md`) ; train supprimé = écart avec l'arrivée réelle du train suivant pris ; backend avec cache par train, coût indépendant du nombre d'utilisateurs.

## Architecture

Tout en TypeScript : Expo (Router, expo-location, expo-task-manager, Expo Push, AdMob), Live Activity en extension Swift, backend Fastify + PostgreSQL + Redis, EAS Build et OTA. Voir `docs/adr/0001-stack.md`.

## Vie privée et RGPD

- Aucune trace GPS ne quitte le téléphone : le serveur reçoit seulement train, gares et retard.
- Geofencing des gares seulement ; autorisation « toujours » demandée après un premier trajet réussi.
- Mode sans localisation : historique oui, classements non.
- Données stockées : pseudo, identifiant Apple/Google, trajets. Rien d'autre.
- Classements : pseudo seul, jamais les gares.
- Pub : consentement explicite (CNIL), sinon non personnalisée.
- Export et suppression du compte dans l'appli. Hébergement dans l'UE.

## Monétisation

AdMob : bannière discrète sur historique et classements (jamais sur le trajet en cours), pub récompensée facultative, pas d'interstitiel. Plus tard : premium et partenariats.

## Planning (side project, ~12 semaines)

1. **S1-2 fondations** : comptes PRIM/SNCF, import GTFS, calcul du retard testé sur la ligne Aubiet – Saint-Martin-du-Touch via Colomiers (vérifier d'abord la couverture temps réel de ce TER).
2. **S3-6 parcours cœur** : détection en gare, confirmation, suivi en direct, historique.
3. **S7-8 jeu** : titres, badges, classements, anti-triche.
4. **S9-10 finitions** : Live Activity, pub, RGPD, écrans d'autorisation.
5. **S11-12 bêta** : TestFlight et test fermé Android avec 30 à 50 navetteurs, puis lancement national.

## Questions ouvertes

- [ ] Seuils définitifs des titres
- [ ] Hébergeur du VPS UE
