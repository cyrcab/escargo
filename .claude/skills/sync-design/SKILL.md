---
name: sync-design
description: Resynchronise packages/design-tokens depuis l'artifact design system Escargo sur claude.ai. Utiliser après une modification du design system.
disable-model-invocation: true
---

1. Lis l'artifact `https://claude.ai/artifact/YPcmofnZTa4NKdgpEvfzrN` (action `read`, fichiers `project/tokens.json`, `project/README.md`, `project/design-system.json`).
2. Remplace `packages/design-tokens/tokens.json` par `project/tokens.json`, et `packages/design-tokens/README.md` par `project/README.md` en gardant l'en-tête de provenance.
3. Si des assets du groupe Logos ont changé, télécharge-les dans `apps/mobile/assets/brand/`.
4. Si de nouveaux noms de tokens ou styles apparaissent, mets à jour les types de `packages/design-tokens/src/index.ts`.
5. `pnpm typecheck`. Résume le diff (tokens ajoutés, modifiés, supprimés) et les écrans potentiellement impactés.
