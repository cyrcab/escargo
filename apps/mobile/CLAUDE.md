@AGENTS.md

## Spécifique Escargo

- Routes dans `src/app/` (Expo Router), onglets dans `src/app/(tabs)/` : Accueil, Trajets, Classements, Badges.
- Logique par domaine dans `src/features/<domaine>/` (trip, counter, history, leaderboard, profile, wrapped).
- Composants du design system dans `src/ui/` : nommés comme dans le design system (CarteCompteur, CarteTitre, CarteTrajet, TuileBadge, PastilleRarete, BoutonPrincipal…).
- Styles : uniquement `@escargo/design-tokens` (`colors`, `spacing`, `radius`, `typography`, `motion`).
- Animations : Reanimated (ressorts, 150-250 ms micro, 300-450 ms écran), Expo Haptics, `useReducedMotion()` remplace tout par des fondus.
- Localisation : geofencing des gares seulement (expo-location + expo-task-manager), autorisation « toujours » demandée après un premier trajet réussi.
- Live Activity iOS : extension Swift dans `targets/live-activity/` (expo-apple-targets), mise à jour par push depuis l'API.
- Pub AdMob : bannière sur Trajets et Classements uniquement, jamais sur Accueil ni trajet en cours.
- API Expo : vérifie la doc de la version installée (voir AGENTS.md) avant de l'utiliser, ne te fie pas à ta mémoire.
- Design : un seul aplat `orange` par écran, texte sur orange en `ink`, ni ombre ni dégradé, cibles tactiles ≥ 44 px.
- Chaque animation a un sens (gain, progression, changement d'état) et utilise des ressorts.
- Textes en français, tutoiement, ton complice (`packages/design-tokens/README.md`).
- Jamais de coordonnées GPS envoyées à l'API. Logique métier réutilisable dans `packages/*`, pas dans l'appli.
- Vérif rapide : `pnpm --filter @escargo/mobile typecheck`. Liste dans la PR ce qui reste à tester sur appareil.
