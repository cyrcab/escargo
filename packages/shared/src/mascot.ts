import { z } from 'zod';

/**
 * Recette de mascotte : les pièces que l'appli assemble pour illustrer un titre.
 * Écrite dans le catalogue (content/titles), lue telle quelle, jamais tirée au hasard.
 * La casquette de chef de gare n'est pas une pièce : elle est toujours là.
 */
export const MascotExpression = z.enum([
  'normal',
  'endormi',
  'presse',
  'victoire',
  'surpris',
  'blase',
  'amoureux',
]);
export type MascotExpression = z.infer<typeof MascotExpression>;

export const MascotEyes = z.enum(['aucun', 'soleil', 'rondes', 'monocle', '3d', 'masque']);
export type MascotEyes = z.infer<typeof MascotEyes>;

export const MascotNeck = z.enum([
  'aucun',
  'echarpe',
  'noeud',
  'medaille',
  'fleurs',
  'cape',
  'sherif',
]);
export type MascotNeck = z.infer<typeof MascotNeck>;

export const MascotPattern = z.enum([
  'aucun',
  'etoiles',
  'points',
  'eclair',
  'damier',
  'anneau',
  'coeurs',
]);
export type MascotPattern = z.infer<typeof MascotPattern>;

export const MascotShell = z.enum(['creme', 'or', 'menthe', 'violet', 'nuit']);
export type MascotShell = z.infer<typeof MascotShell>;

export const MascotProp = z.enum([
  'aucun',
  'parapluie',
  'valise',
  'cafe',
  'popcorn',
  'guitare',
  'manette',
  'trophee',
]);
export type MascotProp = z.infer<typeof MascotProp>;

export const MascotScene = z.enum([
  'aucun',
  'etoiles',
  'pluie',
  'neige',
  'confettis',
  'notes',
  'eclairs',
  'lune',
  'code',
  'zzz',
  'coeurs',
]);
export type MascotScene = z.infer<typeof MascotScene>;

/** Une pièce absente garde sa valeur par défaut (rien, coquille crème). */
export const MascotRecipe = z
  .object({
    expression: MascotExpression.default('normal'),
    yeux: MascotEyes.default('aucun'),
    cou: MascotNeck.default('aucun'),
    motif: MascotPattern.default('aucun'),
    coquille: MascotShell.default('creme'),
    objet: MascotProp.default('aucun'),
    decor: MascotScene.default('aucun'),
  })
  .strict();
export type MascotRecipe = z.infer<typeof MascotRecipe>;
export type MascotRecipeInput = z.input<typeof MascotRecipe>;

export const MASCOT_SLOTS = [
  'expression',
  'yeux',
  'cou',
  'motif',
  'coquille',
  'objet',
  'decor',
] as const satisfies readonly (keyof MascotRecipe)[];
export type MascotSlot = (typeof MASCOT_SLOTS)[number];

export const DEFAULT_MASCOT_RECIPE: MascotRecipe = MascotRecipe.parse({});

/** Les 24 catégories du catalogue de lancement ; chacune a son emblème dans l'appli. */
export const TitleCategory = z.enum([
  'paliers',
  'unretard',
  'series',
  'horaires',
  'lignes',
  'suppressions',
  'saisons',
  'popculture',
  'classements',
  'cumul',
  'equivalences',
  'records',
  'nombres',
  'calendrier',
  'regions',
  'types',
  'distances',
  'correspondances',
  'alheure',
  'meteo',
  'cinema',
  'musique',
  'collection',
  'communaute',
]);
export type TitleCategory = z.infer<typeof TitleCategory>;
