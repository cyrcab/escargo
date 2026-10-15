import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE_TODO, TitleEntry } from '@escargo/shared';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { checkCatalogue, formatRecipe } from './recipes';

/**
 * Le script de vérification du catalogue : tourne avec `pnpm test`, donc en CI,
 * et bloque une vague de titres qui casse une règle de recette.
 */
const TITLES_DIR = fileURLToPath(new URL('../../../content/titles', import.meta.url));

/** Exceptions voulues aux règles de recette, par id de titre. */
const SUN_IN_BAD_WEATHER = ['arc-en-ciel'];

function loadCatalogue(): TitleEntry[] {
  return readdirSync(TITLES_DIR)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .flatMap((file) => {
      const raw: unknown = parse(readFileSync(join(TITLES_DIR, file), 'utf8'));
      if (!Array.isArray(raw)) throw new Error(`${file} : une liste de titres est attendue.`);
      return raw.map((entry, index) => {
        const result = TitleEntry.safeParse(entry);
        if (!result.success) {
          throw new Error(`${file}, titre n° ${index + 1} : ${result.error.message}`);
        }
        return result.data;
      });
    });
}

describe('catalogue content/titles', () => {
  const titles = loadCatalogue();

  it('respecte les règles de recette et ne contient aucun doublon', () => {
    const recipes = new Map(titles.map((t) => [t.id, formatRecipe(t.recipe)]));
    const violations = checkCatalogue(titles, { sunInBadWeather: SUN_IN_BAD_WEATHER });
    expect(
      violations.map((v) => `${v.titleId} [${v.code}] ${v.message} — ${recipes.get(v.titleId)}`),
    ).toEqual([]);
  });

  it('garde les exceptions à jour', () => {
    const ids = new Set(titles.map((t) => t.id));
    expect(SUN_IN_BAD_WEATHER.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('compte les conditions machine encore à écrire', () => {
    const todo = titles.filter((t) => t.rule === RULE_TODO).length;
    // Information seulement : un titre TODO n'est jamais seedé en base.
    console.info(`${titles.length} titres, ${todo} avec rule: ${RULE_TODO}`);
    expect(todo).toBeLessThanOrEqual(titles.length);
  });
});
