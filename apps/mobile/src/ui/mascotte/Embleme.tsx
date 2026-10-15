import { colors } from '@escargo/design-tokens';
import type { TitleCategory } from '@escargo/shared';
import Svg, { Path } from 'react-native-svg';

/** Emblème de catégorie (trait 2, coins ronds), pour les titres communs illustrés sans mascotte. */
export const EMBLEMS: Record<TitleCategory, { d: string; label: string }> = {
  paliers: { d: 'M4 20h4v-4h4v-4h4V8h4V4', label: 'Paliers annuels' },
  unretard: {
    d: 'M7 3h10M7 21h10M8 3c0 6 8 5 8 9s-8 3-8 9M16 3c0 6-8 5-8 9s8 3 8 9',
    label: 'Un seul retard',
  },
  series: {
    d: 'M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3-1-5 0-7z',
    label: 'Séries et fidélité',
  },
  horaires: { d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2', label: 'Horaires et jours' },
  lignes: { d: 'M9 3 7 21M15 3l2 18M8 8h8M7.5 13h9M7 18h10', label: 'Trains et lignes' },
  suppressions: {
    d: 'M6 20V10a6 6 0 0 1 12 0v10l-2-2-2 2-2-2-2 2-2-2zM10 10v1M14 10v1',
    label: 'Suppressions et galères',
  },
  saisons: { d: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l8-8', label: 'Saisons et calendrier' },
  popculture: {
    d: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM9 7v10',
    label: 'Pop culture',
  },
  classements: { d: 'M3 20h18M5 20v-6h4v6M10 20V9h4v11M15 20v-8h4v8', label: 'Classements' },
  cumul: {
    d: 'M7 9a3 3 0 1 0 0 6c3 0 7-6 10-6a3 3 0 1 1 0 6c-3 0-7-6-10-6z',
    label: 'Cumul à vie',
  },
  equivalences: { d: 'M5 9c2-2 4 2 7 0s5-2 7 0M5 15c2-2 4 2 7 0s5-2 7 0', label: 'Équivalences' },
  records: {
    d: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6',
    label: 'Records personnels',
  },
  nombres: { d: 'M5 9h14M5 15h14M10 4 8 20M16 4l-2 16', label: 'Nombres et minutes' },
  calendrier: { d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15h2', label: 'Jours, mois et fêtes' },
  regions: {
    d: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
    label: 'Régions et grandes gares',
  },
  types: {
    d: 'M8 3h8a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM5 11h14M9 21l1.5-3M15 21l-1.5-3',
    label: 'Types de train',
  },
  distances: {
    d: 'M6 17a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM18 3a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM6 17V10a3 3 0 0 1 3-3h3M18 7v7a3 3 0 0 1-3 3h-3',
    label: 'Distances et parcours',
  },
  correspondances: { d: 'M4 8h14l-3-3M20 16H6l3 3', label: 'Correspondances' },
  alheure: {
    d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 12l3 3 5-6',
    label: 'À l’heure, pour une fois',
  },
  meteo: {
    d: 'M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 2A3 3 0 0 0 7 18zM16 4v1M20 6l-1 1',
    label: 'Météo et ciel',
  },
  cinema: {
    d: 'M4 10h16v10H4zM4 10l1.5-5.5 15 3L20 10M9 5.5 8 10M14 6.5 13 10',
    label: 'Cinéma et séries',
  },
  musique: {
    d: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
    label: 'Musique, jeux et expressions',
  },
  collection: { d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', label: 'Collection' },
  communaute: {
    d: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6',
    label: 'Classements et communauté',
  },
};

type Props = {
  category: TitleCategory;
  size?: number;
  color?: keyof typeof colors;
  /** Image décorative quand le nom de la catégorie est déjà écrit à côté. */
  decorative?: boolean;
};

export function Embleme({ category, size = 24, color = 'ink', decorative = false }: Props) {
  const emblem = EMBLEMS[category];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors[color]}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : emblem.label}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Path d={emblem.d} />
    </Svg>
  );
}
