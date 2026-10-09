import source from '../tokens.json';

// Source : design system Escargo (artifact claude.ai). Resynchroniser avec /sync-design.

type ColorName = (typeof source.color.tokens)[number]['name'];

const px = (value: string) => Number.parseFloat(value);

export const colors = Object.fromEntries(
  source.color.tokens.map((token) => [token.name, token.value]),
) as Record<ColorName, string>;

export const spacing = Object.fromEntries(
  source.spacing.tokens.map((token) => [token.name.replace('space-', ''), px(token.value)]),
) as Record<'1' | '2' | '3' | '4' | '5' | '6', number>;

export const radius = Object.fromEntries(
  source.radius.tokens.map((token) => [token.name.replace('radius-', ''), px(token.value)]),
) as Record<'sm' | 'md' | 'lg' | 'xl' | 'pill', number>;

export const fontFamily = 'BricolageGrotesque';

export const typography = Object.fromEntries(
  source.type.groups.flatMap((group) =>
    group.styles.map((style) => [
      style.name,
      {
        fontSize: px(style.fontSize),
        lineHeight: px(style.lineHeight),
        fontWeight: String(style.fontWeight) as '400' | '600' | '800',
      },
    ]),
  ),
) as Record<
  | 'counter'
  | 'counter-unit'
  | 'delay'
  | 'title-xl'
  | 'title'
  | 'section'
  | 'body'
  | 'body-strong'
  | 'caption'
  | 'label'
  | 'tab',
  { fontSize: number; lineHeight: number; fontWeight: '400' | '600' | '800' }
>;

/** Durées d'animation (ms), cf. section Mouvement du design system. */
export const motion = {
  micro: 200,
  screen: 380,
  celebration: 2000,
} as const;
