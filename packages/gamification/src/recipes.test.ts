import { MascotRecipe, type MascotRecipeInput, TitleEntry } from '@escargo/shared';
import { describe, expect, it } from 'vitest';
import {
  checkCatalogue,
  checkRecipe,
  countAccessories,
  formatRecipe,
  parseRecipe,
  recipeKey,
} from './recipes';

const recipe = (input: MascotRecipeInput) => MascotRecipe.parse(input);
const codes = (input: MascotRecipeInput, rarity: 'common' | 'rare' | 'legendary' = 'rare') =>
  checkRecipe(recipe(input), rarity).map((v) => v.code);

const title = (id: string, recipeInput: MascotRecipeInput, rarity = 'rare' as const) =>
  TitleEntry.parse({
    id,
    name: id,
    description: 'test',
    rarity,
    category: 'popculture',
    rule: 'TODO',
    recipe: recipeInput,
  });

describe('checkRecipe', () => {
  it('accepte Retour vers le quai', () => {
    expect(
      codes({ expression: 'surpris', yeux: 'soleil', motif: 'eclair', decor: 'eclairs' }),
    ).toEqual([]);
  });

  it('réserve la coquille or aux légendaires', () => {
    expect(codes({ coquille: 'or' }, 'rare')).toEqual(['gold-not-legendary']);
    expect(codes({ coquille: 'or' }, 'legendary')).toEqual([]);
  });

  it('limite à 4 pièces en plus de l’expression, coquille non comprise', () => {
    const five = {
      yeux: 'soleil',
      cou: 'cape',
      motif: 'etoiles',
      objet: 'cafe',
      decor: 'lune',
    } as const;
    expect(codes(five)).toEqual(['too-many-pieces']);
    expect(codes({ ...five, decor: 'aucun', coquille: 'nuit' })).toEqual([]);
  });

  it('refuse le soleil sous la pluie ou la neige, sauf exception', () => {
    expect(codes({ yeux: 'soleil', decor: 'neige' })).toEqual(['sun-in-bad-weather']);
    expect(
      checkRecipe(recipe({ yeux: 'soleil', objet: 'parapluie', decor: 'pluie' }), 'common', {
        allowSunInBadWeather: true,
      }),
    ).toEqual([]);
  });

  it('veut la pluie avec le parapluie', () => {
    expect(codes({ objet: 'parapluie' })).toEqual(['umbrella-without-rain']);
    expect(codes({ objet: 'parapluie', decor: 'pluie' })).toEqual([]);
  });
});

describe('formatRecipe / parseRecipe', () => {
  it('écrit seulement les pièces qui changent', () => {
    expect(formatRecipe(recipe({}))).toBe('normal');
    expect(formatRecipe(recipe({ expression: 'blase', coquille: 'nuit', decor: 'code' }))).toBe(
      'blase · coquille=nuit · decor=code',
    );
  });

  it('relit la forme courte du catalogue', () => {
    const text = 'victoire · cou=cape · motif=anneau · coquille=or · decor=lune';
    expect(formatRecipe(parseRecipe(text))).toBe(text);
    expect(countAccessories(parseRecipe(text))).toBe(3);
  });

  it('refuse une pièce ou une valeur inconnue', () => {
    expect(() => parseRecipe('normal · chapeau=melon')).toThrow();
    expect(() => parseRecipe('normal · objet=sabre')).toThrow();
    expect(() => parseRecipe('normal · objet=cafe · objet=valise')).toThrow();
  });
});

describe('checkCatalogue', () => {
  it('signale les recettes, ids et noms en double', () => {
    const violations = checkCatalogue([
      title('a', { expression: 'blase' }),
      title('b', { expression: 'blase' }),
      title('a', { expression: 'surpris' }),
    ]);
    expect(violations.map((v) => `${v.titleId}:${v.code}`)).toEqual([
      'b:duplicate-recipe',
      'a:duplicate-id',
      'a:duplicate-name',
    ]);
  });

  it('applique les exceptions par id', () => {
    const rainbow = title('arc-en-ciel', { yeux: 'soleil', objet: 'parapluie', decor: 'pluie' });
    expect(checkCatalogue([rainbow])).toHaveLength(1);
    expect(checkCatalogue([rainbow], { sunInBadWeather: ['arc-en-ciel'] })).toEqual([]);
  });

  it('considère les valeurs par défaut dans la clé', () => {
    expect(recipeKey(recipe({}))).toBe(recipeKey(recipe({ yeux: 'aucun', coquille: 'creme' })));
  });
});
