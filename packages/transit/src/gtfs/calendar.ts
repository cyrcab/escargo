import type { GtfsServiceDate } from './parse';

export const CALENDAR_COLUMNS = [
  'service_id',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'start_date',
  'end_date',
] as const;
export type CalendarRow = Record<(typeof CALENDAR_COLUMNS)[number], string>;

/** Même ordre que `Date.getUTCDay()`. */
const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const toIsoDate = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

/**
 * Jours de circulation d'un GTFS qui utilise `calendar.txt` (jours de semaine entre deux dates)
 * corrigé par `calendar_dates.txt` (exception_type 1 = ajouté ce jour-là, 2 = retiré).
 * Le GTFS SNCF n'a que `calendar_dates.txt` : `toServiceDate` suffit.
 */
export function expandCalendar(
  calendar: Iterable<CalendarRow>,
  exceptions: Iterable<{ service_id: string; date: string; exception_type: string }>,
): GtfsServiceDate[] {
  const dates = new Map<string, Set<string>>();
  const of = (serviceId: string) => {
    let set = dates.get(serviceId);
    if (!set) {
      set = new Set();
      dates.set(serviceId, set);
    }
    return set;
  };

  for (const row of calendar) {
    const set = of(row.service_id);
    const end = Date.parse(toIsoDate(row.end_date));
    for (let day = Date.parse(toIsoDate(row.start_date)); day <= end; day += 86_400_000) {
      const date = new Date(day);
      if (row[WEEKDAYS[date.getUTCDay()] as (typeof WEEKDAYS)[number]] === '1') {
        set.add(date.toISOString().slice(0, 10));
      }
    }
  }
  for (const row of exceptions) {
    if (row.exception_type === '1') of(row.service_id).add(toIsoDate(row.date));
    if (row.exception_type === '2') dates.get(row.service_id)?.delete(toIsoDate(row.date));
  }

  return [...dates].flatMap(([serviceId, set]) => [...set].map((date) => ({ serviceId, date })));
}
