// Couverture temps réel d'une journée : part des trains prévus (GTFS) vus dans le flux
// GTFS-RT, par mode et par ligne. N'a de sens que si le worker a tourné ce jour-là.
// pnpm --filter @escargo/worker rt:coverage [YYYY-MM-DD]
import { createDb } from '@escargo/db';
import { serviceDaySeconds } from '@escargo/transit';
import { sql } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { env } from './env';
import { pollsKey, seenKey } from './realtime-keys';

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const date = process.argv[2] ?? today;

const db = createDb(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL);

const polls = await redis.hgetall(pollsKey(date));
if (!polls.first || !polls.last) {
  console.log(`Aucun relevé temps réel pour le ${date}.`);
} else {
  const seen = new Set(await redis.smembers(seenKey(date)));
  // Trains partis pendant la période où le worker tournait.
  const from = serviceDaySeconds(Number(polls.first), date);
  const to = serviceDaySeconds(Number(polls.last), date);
  const trips = await db.execute<{ id: string; mode: string; line: string; name: string }>(sql`
    select t.id, t.mode, r.short_name as line, r.long_name as name
    from gtfs_trips t
    join gtfs_service_dates d on d.service_id = t.service_id and d.date = ${date}
    join gtfs_routes r on r.id = t.route_id
    join lateral (
      select min(departure_seconds) as departure from gtfs_stop_times where trip_id = t.id
    ) st on true
    where st.departure between ${from} and ${to}
  `);

  type Count = { expected: number; seen: number; name: string };
  const byMode = new Map<string, Count>();
  const byLine = new Map<string, Count>();
  for (const trip of trips) {
    for (const [map, key, name] of [
      [byMode, trip.mode, trip.mode],
      [byLine, `${trip.mode} ${trip.line}`, trip.name],
    ] as const) {
      const count = map.get(key) ?? { expected: 0, seen: 0, name };
      count.expected++;
      if (seen.has(trip.id)) count.seen++;
      map.set(key, count);
    }
  }

  const pct = (c: Count) => Math.round((100 * c.seen) / c.expected);
  const hhmm = (s: number) =>
    new Date(s * 1000).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' });
  console.log(
    `Couverture du ${date}, relevés de ${hhmm(Number(polls.first))} à ${hhmm(Number(polls.last))}`,
  );
  for (const [mode, c] of byMode)
    console.log(`  ${mode.padEnd(11)} ${pct(c)} % (${c.seen}/${c.expected})`);
  console.log('\nLignes les moins couvertes (au moins 5 trains prévus) :');
  const worst = [...byLine]
    .filter(([, c]) => c.expected >= 5)
    .sort(([, a], [, b]) => pct(a) - pct(b))
    .slice(0, 20);
  for (const [line, c] of worst) {
    console.log(`  ${pct(c)} %  ${line} (${c.name}) ${c.seen}/${c.expected}`);
  }
}

redis.disconnect();
await db.$client.end();
