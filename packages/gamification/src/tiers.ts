export type Tier = { level: number; name: string; minMinutes: number };

/** Paliers provisoires (cumul annuel) : seuils à ajuster après les premières données. */
export const TIERS: readonly Tier[] = [
  { level: 1, name: 'Voyageur serein', minMinutes: 0 },
  { level: 2, name: 'Habitué du quai', minMinutes: 60 },
  { level: 3, name: 'Patient confirmé', minMinutes: 5 * 60 },
  { level: 4, name: 'Martyr du rail', minMinutes: 15 * 60 },
  { level: 5, name: 'Légende du quai', minMinutes: 30 * 60 },
  { level: 6, name: 'Fantôme des quais', minMinutes: 60 * 60 },
];

export function tierForMinutes(totalMinutes: number): { current: Tier; next: Tier | null } {
  const index = Math.max(
    0,
    TIERS.findLastIndex((tier) => totalMinutes >= tier.minMinutes),
  );
  return { current: TIERS[index] as Tier, next: TIERS[index + 1] ?? null };
}
