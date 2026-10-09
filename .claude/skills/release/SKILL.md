---
name: release
description: Publie l'appli mobile via EAS (build + submit stores) ou une mise à jour OTA. Utiliser seulement sur demande explicite.
argument-hint: <ota|build> [ios|android|all] [message]
disable-model-invocation: true
---

Publication : « $ARGUMENTS ».

1. Vérifie être sur `main` à jour, CI verte, working tree propre.
2. `pnpm typecheck && pnpm test`.
3. OTA (changements JS uniquement) : `npx eas-cli@latest update --branch production --message "<message>"` dans `apps/mobile`. Refuse l'OTA si une dépendance native ou `app.json` a changé depuis le dernier build.
4. Build : `npx eas-cli@latest build --profile production --platform <plateforme>`, puis `submit` seulement après confirmation explicite.
5. Tague `mobile-v<version>` et résume ce qui est parti.

Ne lance aucune commande de publication sans confirmation de l'utilisateur.
