# Catalogue de titres

Un fichier YAML par vague (`AAAA-MM-theme.yaml`), seedé en base par l'API. Ajout sans mise à jour de l'appli.
Le catalogue de lancement (500 titres) est dans `2026-10-lancement.yaml` ; sa version lisible, avec les règles de jeu, est `Catalogue des titres — Escargo.md` à la racine du dossier projet.

```yaml
- id: seigneur-des-retards
  name: "Le Seigneur des Retards"
  description: "3 retards d'une heure ou plus dans l'année."
  rarity: legendary # common | rare | legendary
  category: popculture # une des 24 catégories (TitleCategory), donne l'emblème
  rule: TODO # condition machine ; TODO = à écrire, jamais seedé
  season: null
  requires: [] # meteo | amis : données à brancher avant que le titre soit déblocable
  recipe: { expression: victoire, cou: cape, motif: anneau, coquille: or, decor: lune }
```

Schéma : `TitleEntry` dans `@escargo/shared`. Règles de ton : allusions et jeux de mots seulement, jamais de nom de personnage, logo, slogan déposé ni marque d'opérateur. Génération avec `/add-titles`, **relecture humaine obligatoire avant merge**.

## Recette de mascotte

Chaque titre a une `recipe` : les pièces du composant `Mascotte` (`apps/mobile/src/ui/mascotte`) qui l'illustrent. On n'écrit que les pièces qui changent ; une pièce absente garde sa valeur par défaut. La casquette est toujours là.

| Pièce | Valeurs (défaut en premier) |
| --- | --- |
| `expression` | normal, endormi, presse, victoire, surpris, blase, amoureux |
| `yeux` | aucun, soleil, rondes, monocle, 3d, masque |
| `cou` | aucun, echarpe, noeud, medaille, fleurs, cape, sherif |
| `motif` | aucun, etoiles, points, eclair, damier, anneau, coeurs |
| `coquille` | creme, or, menthe, violet, nuit |
| `objet` | aucun, parapluie, valise, cafe, popcorn, guitare, manette, trophee |
| `decor` | aucun, etoiles, pluie, neige, confettis, notes, eclairs, lune, code, zzz, coeurs |

`pnpm test` (paquet `@escargo/gamification`, `catalogue.test.ts`) refuse une vague qui casse une de ces règles :

1. Coquille `or` réservée aux légendaires.
2. Au plus 4 pièces en plus de l'expression (`yeux`, `cou`, `motif`, `objet`, `decor`).
3. Pas de lunettes de soleil avec `pluie` ou `neige` (exceptions par id dans le test, ex. `arc-en-ciel`) ; un `parapluie` va toujours avec `decor: pluie`.
4. Aucune recette, aucun id ni aucun nom en double sur tout le catalogue.
5. Toute pièce ou valeur hors de la table est refusée par le schéma.

À la relecture humaine : l'expression suit le ton du titre (pas de `victoire` ni de cœurs sur un titre de galère, sauf si c'est le gag), et les titres pop culture portent un clin d'œil à leur référence (anneau doré pour Le Seigneur des Retards, éclairs pour Retour vers le quai…).

Ajouter une pièce : sa valeur dans `packages/shared/src/mascot.ts`, son dessin dans `apps/mobile/src/ui/mascotte/pieces.ts`. Chaque pièce ajoutée multiplie les combinaisons possibles.
