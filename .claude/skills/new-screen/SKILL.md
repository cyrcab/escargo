---
name: new-screen
description: Crée un écran Expo Router conforme au design system Escargo (tokens, animations, haptics, états vides, accessibilité). Utiliser pour tout nouvel écran de l'appli.
argument-hint: <nom de l'écran> [route]
---

Crée l'écran « $ARGUMENTS » dans `apps/mobile` avec l'agent `mobile-dev`.

Checklist :
- Route dans `src/app/` (onglet dans `(tabs)/` si besoin), logique dans `src/features/<domaine>/`, composants réutilisables dans `src/ui/`.
- Retrouve dans `packages/design-tokens/README.md` (section Écrans à maquetter) la description de l'écran, ses composants et ses animations.
- Styles 100 % `@escargo/design-tokens`, marges `spacing['5']`, cartes `radius.lg`.
- États : chargement (spirale de la coquille), vide (mascotte + texte complice), erreur réseau, données.
- Animations du tableau « Moments clés », avec fallback `useReducedMotion()`. Haptique légère sur confirmation.
- Accessibilité : labels, cibles ≥ 44 px, ordre de lecture.
- Textes en français, tutoiement.

Termine par `pnpm --filter @escargo/mobile typecheck` puis lance `design-reviewer` sur les fichiers créés.
