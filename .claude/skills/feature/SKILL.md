---
name: feature
description: Implémente une issue GitHub de bout en bout (branche, plan, code, tests, PR). Utiliser quand on démarre le travail sur une issue.
argument-hint: <numéro d'issue>
disable-model-invocation: true
---

Implémente l'issue GitHub #$ARGUMENTS.

1. `gh issue view $ARGUMENTS` : lis l'issue et ses commentaires. Si des critères d'acceptation manquent ou sont flous, pose les questions avant de coder.
2. Crée la branche `<type>/<numéro>-<slug>` depuis `main` à jour (type : feat, fix, chore…), sauf si tu es déjà dans un worktree dédié.
3. Explore le code concerné, puis propose un plan court (fichiers touchés, tests prévus) et attends validation.
4. Implémente toi-même toute la fonctionnalité, de bout en bout, dans ce contexte (packages, API, worker, appli). Ne découpe pas par techno entre agents : un seul contexte garde le fil des décisions.
   - Contrat d'abord : schémas Zod dans `packages/shared`, puis logique métier pure dans `packages/*` avec tests, puis API/worker, puis écrans.
   - Consulte un spécialiste pour une question précise, sans lui déléguer le code de la fonctionnalité : `transit-expert` (flux, rapprochement train ↔ `trip_id`, couverture temps réel), `gamification-designer` (règles de titres/badges, ton).
   - Délègue seulement une sous-tâche isolée et autonome : vague de titres dans `content/titles` (`gamification-designer`), extension Swift Live Activity (`ios-native`), investigation de flux (`transit-expert`).
5. `pnpm typecheck && pnpm test`. Corrige jusqu'au vert.
6. Si la PR touche données, localisation, logs ou classements : lance `privacy-reviewer`. Si elle touche l'UI : lance `design-reviewer`. Corrige les points bloquants.
7. Commits Conventional Commits en anglais. Push, puis `gh pr create` avec `Closes #$ARGUMENTS`, un résumé et un plan de test (ce qui doit être testé sur appareil).
