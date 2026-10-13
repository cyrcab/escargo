export interface ScheduledTrip {
  id: string;
  mode: string;
  line: string;
  lineName: string;
}

export interface CoverageCount {
  expected: number;
  seen: number;
  /** 0 à 100, arrondi. */
  percent: number;
}

export interface LineCoverage extends CoverageCount {
  mode: string;
  line: string;
  lineName: string;
}

export interface Coverage {
  byMode: Record<string, CoverageCount>;
  /** Du moins couvert au plus couvert. */
  byLine: LineCoverage[];
}

const withPercent = (expected: number, seen: number): CoverageCount => ({
  expected,
  seen,
  percent: expected === 0 ? 0 : Math.round((100 * seen) / expected),
});

/** Part des trains prévus présents dans le flux temps réel, par mode et par ligne. */
export function computeCoverage(
  trips: ScheduledTrip[],
  seenTripIds: ReadonlySet<string>,
): Coverage {
  const modes = new Map<string, { expected: number; seen: number }>();
  const lines = new Map<string, { trip: ScheduledTrip; expected: number; seen: number }>();

  for (const trip of trips) {
    const seen = seenTripIds.has(trip.id) ? 1 : 0;
    const mode = modes.get(trip.mode) ?? { expected: 0, seen: 0 };
    mode.expected++;
    mode.seen += seen;
    modes.set(trip.mode, mode);

    const key = `${trip.mode} ${trip.line}`;
    const line = lines.get(key) ?? { trip, expected: 0, seen: 0 };
    line.expected++;
    line.seen += seen;
    lines.set(key, line);
  }

  return {
    byMode: Object.fromEntries(
      [...modes].map(([mode, c]) => [mode, withPercent(c.expected, c.seen)]),
    ),
    byLine: [...lines.values()]
      .map(({ trip, expected, seen }) => ({
        mode: trip.mode,
        line: trip.line,
        lineName: trip.lineName,
        ...withPercent(expected, seen),
      }))
      .sort((a, b) => a.percent - b.percent || b.expected - a.expected),
  };
}
