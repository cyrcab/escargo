import { colors } from '@escargo/design-tokens';
import type {
  MascotExpression,
  MascotEyes,
  MascotNeck,
  MascotPattern,
  MascotProp,
  MascotRecipe,
  MascotScene,
  MascotShell,
} from '@escargo/shared';

/**
 * Bibliothèque de pièces de la mascotte, dans le repère du dessin (viewBox -12 -28 192 148).
 * Même géométrie que le composant Mascotte du canevas de design « Escargo — écrans principaux ».
 * Ajouter une pièce : une entrée ici + sa valeur dans le schéma MascotRecipe (@escargo/shared).
 */
export type Layer = {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
  dash?: string;
};
type Split = { back: Layer[]; front: Layer[] };

export const MASCOT_VIEWBOX = { x: -12, y: -28, width: 192, height: 148 } as const;

const INK = colors.ink;
const CREAM = colors.cream;
const ORANGE = colors.orange;
const MINT = colors.mint;
const VIOLET = colors.violet;
const GOLD = colors.gold;
const SOFT = colors['ink-soft'];

const P = (d: string, fill?: string, stroke?: string, width?: number, dash?: string): Layer => ({
  d,
  fill,
  stroke,
  width,
  dash,
});

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const star = (cx: number, cy: number, r: number) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return `${d}Z`;
};

const spark = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;

const heart = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s * 0.9} C${cx - s * 1.6} ${cy} ${cx - s * 0.8} ${cy - s} ${cx} ${cy - s * 0.3} C${cx + s * 0.8} ${cy - s} ${cx + s * 1.6} ${cy} ${cx} ${cy + s * 0.9}Z`;

const flake = (x: number, y: number) =>
  `M${x - 5} ${y} h10 M${x} ${y - 5} v10 M${x - 3.5} ${y - 3.5} l7 7 M${x + 3.5} ${y - 3.5} l-7 7`;

const none: Split = { back: [], front: [] };
const front = (...layers: Layer[]): Split => ({ back: [], front: layers });

const SHELL: Record<MascotShell, { fill: string; spiral: string }> = {
  creme: { fill: CREAM, spiral: INK },
  or: { fill: GOLD, spiral: INK },
  menthe: { fill: MINT, spiral: INK },
  violet: { fill: VIOLET, spiral: INK },
  nuit: { fill: INK, spiral: CREAM },
};

const EXPRESSION: Record<MascotExpression, Layer[]> = {
  normal: [P(circle(130, 84, 4), INK), P('M124 94 q6 4 12 0', undefined, INK, 3)],
  endormi: [P('M125 85 q5 4 10 0', undefined, INK, 3), P('M127 95 h6', undefined, INK, 3)],
  presse: [
    P(circle(131, 83, 5), INK),
    P('M126 95 q4 -3 8 0', undefined, INK, 3),
    P('M148 78 q4 6 0 9 q-4 -3 0 -9', MINT),
    P('M-2 84 H14 M-4 98 H12 M2 70 H16', undefined, INK, 4),
  ],
  victoire: [P('M126 86 q4 -5 8 0', undefined, INK, 3), P('M122 93 q8 7 16 0', undefined, INK, 3)],
  surpris: [
    P(circle(130, 83, 5.5), CREAM, INK, 2.5),
    P(circle(131, 83, 2.2), INK),
    P(circle(130, 96, 3), INK),
  ],
  blase: [
    P('M124 82 h12', undefined, INK, 3),
    P('M126 83 a4 4 0 0 0 8 0Z', INK),
    P('M124 95 h11', undefined, INK, 3),
  ],
  amoureux: [P(heart(130, 84, 5), INK), P('M124 94 q6 4 12 0', undefined, INK, 3)],
};

const EYES: Record<MascotEyes, Layer[]> = {
  aucun: [],
  soleil: [
    P('M120 79 h20 v5 a5 5 0 0 1 -5 5 h-10 a5 5 0 0 1 -5 -5Z', INK),
    P('M120 81 H110', undefined, INK, 3),
  ],
  rondes: [P(circle(130, 84, 6.5), undefined, INK, 2.5), P('M123.5 84 H110', undefined, INK, 2.5)],
  monocle: [
    P(circle(131, 84, 6.5), undefined, GOLD, 3),
    P('M131 90.5 q-2 10 -12 14', undefined, GOLD, 1.5),
  ],
  '3d': [
    P('M117 78 h26 v10 h-26Z', CREAM, INK, 2.5),
    P('M120 80.5 h9 v5 h-9Z', VIOLET),
    P('M131 80.5 h9 v5 h-9Z', MINT),
  ],
  masque: [
    P('M115 80 q15 -5 30 0 q-2 9 -9 9 q-4 0 -6 -3 q-2 3 -6 3 q-7 0 -9 -9Z', INK),
    P(circle(131, 83, 2.5), CREAM),
    P('M115 81 l-9 -4 M115 83 l-9 4', undefined, INK, 3),
  ],
};

const NECK: Record<MascotNeck, Split> = {
  aucun: none,
  echarpe: front(
    P('M106 88 q12 8 26 0 l1 7 q-14 8 -28 0Z', VIOLET, INK, 2),
    P('M110 94 l-5 16 h7 l3 -14Z', VIOLET, INK, 2),
  ),
  noeud: front(P('M106 90 l9 6 -9 6Z M124 90 l-9 6 9 6Z', INK), P(circle(115, 96, 3), INK)),
  medaille: front(
    P('M108 86 l7 12 M122 86 l-7 12', undefined, VIOLET, 3),
    P(circle(115, 103, 6), GOLD, INK, 2),
    P(star(115, 103, 3.5), INK),
  ),
  fleurs: front(
    P(circle(104, 90, 4), MINT, INK, 1.5),
    P(circle(108, 97, 4), GOLD, INK, 1.5),
    P(circle(114, 101, 4), VIOLET, INK, 1.5),
    P(circle(121, 102, 4), CREAM, INK, 1.5),
    P(circle(128, 100, 4), MINT, INK, 1.5),
    P(circle(134, 96, 4), GOLD, INK, 1.5),
  ),
  cape: {
    back: [P('M110 84 Q76 22 0 4 Q16 24 12 42 Q34 32 44 46 Q70 42 108 92Z', VIOLET, INK, 3)],
    front: [P('M106 86 q10 6 22 0', undefined, VIOLET, 4)],
  },
  sherif: front(P(star(115, 99, 9), GOLD, INK, 1.5), P(circle(115, 99, 2), INK)),
};

const PATTERN: Record<MascotPattern, Split> = {
  aucun: none,
  etoiles: front(
    P(star(38, 54, 6), GOLD, INK, 1),
    P(star(95, 58, 5), GOLD, INK, 1),
    P(star(44, 98, 5), GOLD, INK, 1),
  ),
  points: front(
    P(circle(36, 66, 3.5), MINT, INK, 1),
    P(circle(52, 40, 3), VIOLET, INK, 1),
    P(circle(84, 40, 3.5), MINT, INK, 1),
    P(circle(98, 74, 3), VIOLET, INK, 1),
    P(circle(80, 102, 3.5), MINT, INK, 1),
    P(circle(46, 100, 3), VIOLET, INK, 1),
  ),
  eclair: front(P('M100 76 l-8 12 h6 l-4 10 l11 -13 h-6 l4 -9Z', GOLD, INK, 1.5)),
  damier: front(
    P('M30 46h15v15h-15Z', CREAM, INK, 1.5),
    P('M30 46h5v5h-5Z M40 46h5v5h-5Z M35 51h5v5h-5Z M30 56h5v5h-5Z M40 56h5v5h-5Z', INK),
  ),
  anneau: {
    back: [P('M6 90 A62 15 -18 0 1 126 50', undefined, GOLD, 5)],
    front: [P('M6 90 A62 15 -18 0 0 126 50', undefined, GOLD, 5)],
  },
  coeurs: front(P(heart(96, 90, 6), VIOLET, INK, 1), P(heart(40, 52, 5), VIOLET, INK, 1)),
};

const PROP: Record<MascotProp, Split> = {
  aucun: none,
  parapluie: front(
    P('M66 34 V8', undefined, INK, 3),
    P('M36 10 Q66 -26 96 10 Q88 5 81 10 Q73 5 66 10 Q59 5 51 10 Q44 5 36 10Z', VIOLET, INK, 2.5),
    P('M66 -8 v-5', undefined, INK, 3),
  ),
  valise: front(
    P('M60 22 v-5 h12 v5', undefined, INK, 3),
    P('M48 22 h36 a4 4 0 0 1 4 4 v12 h-44 v-12 a4 4 0 0 1 4 -4Z', GOLD, INK, 2.5),
    P('M56 22 v16 M76 22 v16', undefined, INK, 2),
  ),
  cafe: front(
    P('M151 93 q-3 -4 0 -8 M157 93 q-3 -4 0 -8', undefined, SOFT, 2),
    P('M162 100 a4 4 0 0 1 0 8', undefined, INK, 2.5),
    P('M146 98 h16 v8 a6 6 0 0 1 -6 6 h-4 a6 6 0 0 1 -6 -6Z', CREAM, INK, 2.5),
  ),
  popcorn: front(
    P(circle(52, 16, 6), CREAM, INK, 2),
    P(circle(61, 11, 6), CREAM, INK, 2),
    P(circle(71, 11, 6), CREAM, INK, 2),
    P(circle(80, 16, 6), CREAM, INK, 2),
    P(circle(66, 5, 5), CREAM, INK, 2),
    P('M50 18 l4 20 h24 l4 -20Z', CREAM, INK, 2.5),
    P('M58 18 l2 20 M66 18 v20 M74 18 l-2 20', undefined, VIOLET, 3),
  ),
  guitare: front(
    P('M34 30 L74 -10', undefined, INK, 5),
    P('M70 -14 l8 -4 l4 6 l-6 6Z', INK),
    P(circle(24, 42, 13), GOLD, INK, 2.5),
    P(circle(35, 29, 9), GOLD, INK, 2.5),
    P(circle(27, 39, 3.5), INK),
  ),
  manette: front(
    P('M48 24 h36 a10 10 0 0 1 0 20 h-6 l-5 -5 h-14 l-5 5 h-6 a10 10 0 0 1 0 -20Z', INK),
    P('M54 34 h8 M58 30 v8', undefined, CREAM, 2.5),
    P(circle(76, 31, 2.5), VIOLET),
    P(circle(81, 36, 2.5), MINT),
  ),
  trophee: front(
    P('M54 9 h-5 a5 5 0 0 0 6 8 M78 9 h5 a5 5 0 0 1 -6 8', undefined, INK, 2.5),
    P('M54 6 h24 v8 a12 12 0 0 1 -24 0Z', GOLD, INK, 2.5),
    P('M66 26 v6', undefined, INK, 4),
    P('M56 33 h20', undefined, INK, 5),
  ),
};

const SCENE: Record<MascotScene, Split> = {
  aucun: none,
  etoiles: front(
    P(spark(0, 10, 7), GOLD),
    P(spark(150, -6, 6), GOLD),
    P(spark(172, 40, 5), GOLD),
    P(spark(16, -14, 4), GOLD),
  ),
  pluie: front(
    P(
      'M10 -12 l-4 10 M40 -18 l-4 10 M74 -12 l-4 10 M104 -18 l-4 10 M140 -12 l-4 10 M170 -4 l-4 10',
      undefined,
      VIOLET,
      4,
    ),
  ),
  neige: front(
    P(
      [
        flake(6, -6),
        flake(44, -16),
        flake(96, -14),
        flake(150, -14),
        flake(172, 20),
        flake(-2, 40),
      ].join(' '),
      undefined,
      VIOLET,
      2,
    ),
  ),
  confettis: front(
    P('M0 -6 l10 -3 l2 6 l-10 3Z', VIOLET),
    P('M150 -16 l9 4 l-3 6 l-9 -4Z', VIOLET),
    P('M170 30 l8 -5 l3 5 l-8 5Z', MINT),
    P('M20 -22 l6 6 l-4 4 l-6 -6Z', GOLD),
    P(circle(118, -14, 3), INK),
    P(circle(-4, 30, 3), VIOLET),
    P('M96 -24 l9 2 l-1 6 l-9 -2Z', MINT),
  ),
  notes: front(
    P('M152 6 V-12 l12 -3 V3', undefined, INK, 3),
    P(circle(148, 6, 4), INK),
    P(circle(160, 3, 4), INK),
    P('M8 12 V-6 l6 -2', undefined, INK, 3),
    P(circle(4, 12, 4), INK),
  ),
  eclairs: front(
    P('M164 -18 l-10 16 h8 l-6 14 l16 -18 h-8 l6 -12Z', GOLD, INK, 1.5),
    P('M10 -12 l-7 11 h6 l-4 10 l11 -13 h-6 l4 -8Z', GOLD, INK, 1.5),
  ),
  lune: front(
    P('M166 -14 a14 14 0 1 0 8 26 a11 11 0 0 1 -8 -26Z', GOLD),
    P(spark(140, -14, 4), GOLD),
    P(spark(6, 0, 5), GOLD),
  ),
  code: {
    back: [P('M-4 -24 v64 M10 -14 v40 M164 -24 v54 M178 -10 v40', undefined, MINT, 3, '3 5')],
    front: [],
  },
  zzz: front(P('M148 8 h10 l-10 12 h10 M164 -8 h7 l-7 9 h7', undefined, VIOLET, 3)),
  coeurs: front(
    P(heart(160, -2, 8), VIOLET),
    P(heart(6, -6, 6), VIOLET),
    P(heart(172, 30, 4), VIOLET),
  ),
};

/** Calques dans l'ordre de dessin : décor et cape derrière, casquette et visage devant. */
export function mascotLayers(recipe: MascotRecipe): Layer[] {
  const shell = SHELL[recipe.coquille];
  const neck = NECK[recipe.cou];
  const pattern = PATTERN[recipe.motif];
  const prop = PROP[recipe.objet];
  const scene = SCENE[recipe.decor];
  const body = [
    P('M18 112 H122 Q140 112 140 98 Q140 86 128 86 H70 Z', ORANGE),
    P(circle(126, 84, 16), ORANGE),
    P(circle(66, 72, 40), shell.fill, INK, 4),
    P(
      'M66 72 m0 -9 a9 9 0 1 1 -9 9 a18 18 0 1 1 18 18 a27 27 0 1 1 -27 -27',
      undefined,
      shell.spiral,
      5,
    ),
  ];
  const cap = [
    P('M110 72 Q124 58 142 66 L144 74 H108 Z', INK),
    P('M104 74 H150', undefined, INK, 5),
  ];
  return [
    ...scene.back,
    ...neck.back,
    ...pattern.back,
    ...prop.back,
    ...body,
    ...pattern.front,
    ...prop.front,
    ...neck.front,
    ...cap,
    ...EXPRESSION[recipe.expression],
    ...EYES[recipe.yeux],
    ...scene.front,
  ];
}
