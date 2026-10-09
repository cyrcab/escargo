---
name: add-titles
description: Génère une vague de titres pour le catalogue Escargo (YAML dans content/titles), au bon ton et sans risque juridique. Utiliser pour enrichir le catalogue.
argument-hint: <thème ou saison> [nombre]
disable-model-invocation: true
---

Génère une vague de titres sur le thème « $ARGUMENTS » avec l'agent `gamification-designer`.

1. Lis le catalogue existant dans `content/titles/` pour éviter les doublons d'`id`, de `name` et de jeu de mots.
2. Écris un nouveau fichier `content/titles/<AAAA-MM>-<theme>.yaml` (liste d'objets `id`, `name`, `description`, `rarity`, `rule`, `season`).
3. Par défaut 30 titres, répartition ~70 % commun, ~25 % rare, ~5 % légendaire.
4. Repasse chaque titre au filtre juridique : allusion seulement, aucun nom de personnage, logo, slogan déposé ni marque d'opérateur. Liste à part ceux qui te semblent limites.
5. Ne publie rien : affiche un tableau récapitulatif et rappelle que la relecture humaine est obligatoire avant merge.
