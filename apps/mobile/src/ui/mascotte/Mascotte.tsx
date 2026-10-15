import { DEFAULT_MASCOT_RECIPE, MascotRecipe, type MascotRecipeInput } from '@escargo/shared';
import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { MASCOT_VIEWBOX, mascotLayers } from './pieces';

type Props = {
  /** Recette du titre telle que l'API la renvoie ; une pièce absente garde sa valeur par défaut. */
  recipe?: MascotRecipeInput;
  /** Largeur en points ; la hauteur suit les proportions du dessin. */
  size?: number;
  /** Texte lu par le lecteur d'écran ; absent = image décorative. */
  label?: string;
};

const { x, y, width, height } = MASCOT_VIEWBOX;

export function Mascotte({ recipe, size = 200, label }: Props) {
  // Une recette invalide venue de l'API ne doit pas faire planter l'écran : mascotte par défaut.
  const layers = useMemo(() => {
    const parsed = MascotRecipe.safeParse(recipe ?? {});
    return mascotLayers(parsed.success ? parsed.data : DEFAULT_MASCOT_RECIPE);
  }, [recipe]);
  return (
    <Svg
      width={size}
      height={Math.round((size * height) / width)}
      viewBox={`${x} ${y} ${width} ${height}`}
      accessible={label !== undefined}
      accessibilityLabel={label}
      accessibilityElementsHidden={label === undefined}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
    >
      {layers.map((layer, index) => (
        <Path
          // Les calques sont un dessin statique : l'index est une clé stable.
          // biome-ignore lint/suspicious/noArrayIndexKey: ordre de dessin fixe
          key={index}
          d={layer.d}
          fill={layer.fill ?? 'none'}
          stroke={layer.stroke ?? 'none'}
          strokeWidth={layer.width ?? 0}
          strokeDasharray={layer.dash}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={layer.opacity ?? 1}
        />
      ))}
    </Svg>
  );
}
