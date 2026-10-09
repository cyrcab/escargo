# Catalogue de titres

Un fichier YAML par vague (`AAAA-MM-theme.yaml`), seedé en base par l'API. Ajout sans mise à jour de l'appli.

```yaml
- id: seigneur-des-retards
  name: Le Seigneur des Retards
  description: Cumule 10 h de retard sur une même ligne.
  rarity: rare # common | rare | legendary
  rule: line_total_minutes >= 600
  season: null
```

Règles : allusions et jeux de mots seulement, jamais de nom de personnage, logo, slogan déposé ni marque d'opérateur. Génération avec `/add-titles`, **relecture humaine obligatoire avant merge**.
