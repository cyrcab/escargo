import {
  DEFAULT_MASCOT_RECIPE,
  MASCOT_SLOTS,
  MascotRecipe,
  type Rarity,
  type TitleEntry,
} from '@escargo/shared';

/** Pièces qui s'ajoutent à l'expression ; la couleur de coquille n'en fait pas partie. */
export const ACCESSORY_SLOTS = ['yeux', 'cou', 'motif', 'objet', 'decor'] as const;

/** Au-delà, la mascotte devient illisible en petit (tuile de collection, pastille). */
export const MAX_ACCESSORIES = 4;

export type RecipeViolationCode =
  | 'gold-not-legendary'
  | 'too-many-pieces'
  | 'sun-in-bad-weather'
  | 'umbrella-without-rain';

export type CatalogueViolationCode =
  | RecipeViolationCode
  | 'duplicate-recipe'
  | 'duplicate-id'
  | 'duplicate-name';

export type RecipeViolation = { code: RecipeViolationCode; message: string };
export type CatalogueViolation = { titleId: string; code: CatalogueViolationCode; message: string };

export type RecipeCheckOptions = {
  /** Lunettes de soleil sous la pluie ou la neige tolérées (ex. Arc-en-ciel). */
  allowSunInBadWeather?: boolean;
};

export function countAccessories(recipe: MascotRecipe): number {
  return ACCESSORY_SLOTS.filter((slot) => recipe[slot] !== DEFAULT_MASCOT_RECIPE[slot]).length;
}

/**
 * Règles de cohérence d'une recette (section « Recettes de mascotte » du catalogue).
 * Le ton (pas de victoire sur un titre de galère) reste à la relecture humaine.
 */
export function checkRecipe(
  recipe: MascotRecipe,
  rarity: Rarity,
  options: RecipeCheckOptions = {},
): RecipeViolation[] {
  const violations: RecipeViolation[] = [];

  if (recipe.coquille === 'or' && rarity !== 'legendary') {
    violations.push({
      code: 'gold-not-legendary',
      message: 'La coquille or est réservée aux titres légendaires.',
    });
  }

  const pieces = countAccessories(recipe);
  if (pieces > MAX_ACCESSORIES) {
    violations.push({
      code: 'too-many-pieces',
      message: `${pieces} pièces en plus de l'expression, ${MAX_ACCESSORIES} au maximum.`,
    });
  }

  const badWeather = recipe.decor === 'pluie' || recipe.decor === 'neige';
  if (recipe.yeux === 'soleil' && badWeather && !options.allowSunInBadWeather) {
    violations.push({
      code: 'sun-in-bad-weather',
      message: 'Pas de lunettes de soleil sous la pluie ou la neige.',
    });
  }

  if (recipe.objet === 'parapluie' && recipe.decor !== 'pluie') {
    violations.push({
      code: 'umbrella-without-rain',
      message: 'Un parapluie va toujours avec le décor pluie.',
    });
  }

  return violations;
}

/** Clé canonique : deux recettes identiques ont la même clé, valeurs par défaut comprises. */
export function recipeKey(recipe: MascotRecipe): string {
  return MASCOT_SLOTS.map((slot) => recipe[slot]).join('|');
}

/**
 * Forme courte lisible, celle de la colonne Recette du catalogue :
 * l'expression, puis seulement les pièces qui changent (`surpris · yeux=soleil · decor=eclairs`).
 */
export function formatRecipe(recipe: MascotRecipe): string {
  const parts: string[] = [recipe.expression];
  for (const slot of MASCOT_SLOTS) {
    if (slot === 'expression') continue;
    if (recipe[slot] !== DEFAULT_MASCOT_RECIPE[slot]) parts.push(`${slot}=${recipe[slot]}`);
  }
  return parts.join(' · ');
}

/** Lit la forme courte ; lève une erreur si une pièce ou une valeur n'existe pas. */
export function parseRecipe(text: string): MascotRecipe {
  const [expression, ...rest] = text
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
  const input: Record<string, string> = {};
  if (expression) input.expression = expression;
  for (const part of rest) {
    const [slot, value] = part.split('=').map((s) => s.trim());
    if (!slot || !value) throw new Error(`Pièce illisible : « ${part} »`);
    if (slot in input) throw new Error(`Pièce en double : « ${slot} »`);
    input[slot] = value;
  }
  return MascotRecipe.parse(input);
}

export type CatalogueCheckOptions = {
  /** Ids de titres autorisés à porter des lunettes de soleil sous la pluie ou la neige. */
  sunInBadWeather?: readonly string[];
};

/**
 * Vérifie une liste de titres avant une vague : règles de recette, et unicité
 * des ids, des noms et des recettes sur l'ensemble du catalogue.
 */
export function checkCatalogue(
  titles: readonly TitleEntry[],
  options: CatalogueCheckOptions = {},
): CatalogueViolation[] {
  const sunAllowed = new Set(options.sunInBadWeather ?? []);
  const violations: CatalogueViolation[] = [];
  const ids = new Map<string, string>();
  const names = new Map<string, string>();
  const recipes = new Map<string, string>();

  for (const title of titles) {
    for (const v of checkRecipe(title.recipe, title.rarity, {
      allowSunInBadWeather: sunAllowed.has(title.id),
    })) {
      violations.push({ titleId: title.id, ...v });
    }

    const seenId = ids.get(title.id);
    if (seenId !== undefined) {
      violations.push({ titleId: title.id, code: 'duplicate-id', message: 'Id déjà utilisé.' });
    } else ids.set(title.id, title.id);

    const nameKey = title.name.trim().toLocaleLowerCase('fr');
    const sameName = names.get(nameKey);
    if (sameName !== undefined) {
      violations.push({
        titleId: title.id,
        code: 'duplicate-name',
        message: `Même nom que « ${sameName} ».`,
      });
    } else names.set(nameKey, title.id);

    const key = recipeKey(title.recipe);
    const sameRecipe = recipes.get(key);
    if (sameRecipe !== undefined) {
      violations.push({
        titleId: title.id,
        code: 'duplicate-recipe',
        message: `Même recette que « ${sameRecipe} » (${formatRecipe(title.recipe)}).`,
      });
    } else recipes.set(key, title.id);
  }

  return violations;
}
