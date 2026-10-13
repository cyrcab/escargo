// Couverture temps réel d'une journée : part des trains prévus (GTFS) vus dans le flux
// GTFS-RT, par mode et par ligne. N'a de sens que si le worker a tourné ce jour-là.
// pnpm --filter @escargo/worker rt:coverage [YYYY-MM-DD]
import { createDb } from '@escargo/db';
import { computeCoverage, pollsKey, seenKey, serviceDaySeconds } from '@escargo/transit';
import { sql } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { env } from './env';

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
  const trips = await db.execute<{ id: string; mode: string; line: string; lineName: string }>(sql`
    select t.id, t.mode, r.short_name as line, r.long_name as "lineName"
    from gtfs_trips t
    join gtfs_service_dates d on d.service_id = t.service_id and d.date = ${date}
    join gtfs_routes r on r.id = t.route_id
    join lateral (
      select min(departure_seconds) as departure from gtfs_stop_times where trip_id = t.id
    ) st on true
    where st.departure between ${from} and ${to}
  `);
  const coverage = computeCoverage([...trips], seen);

  const hhmm = (s: number) =>
    new Date(s * 1000).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' });
  console.log(
    `Couverture du ${date}, relevés de ${hhmm(Number(polls.first))} à ${hhmm(Number(polls.last))}`,
  );
  for (const [mode, c] of Object.entries(coverage.byMode)) {
    console.log(`  ${mode.padEnd(11)} ${c.percent} % (${c.seen}/${c.expected})`);
  }
  console.log('\nLignes les moins couvertes (au moins 5 trains prévus) :');
  for (const l of coverage.byLine.filter((l) => l.expected >= 5).slice(0, 20)) {
    console.log(`  ${l.percent} %  ${l.mode} ${l.line} (${l.lineName}) ${l.seen}/${l.expected}`);
  }
}

redis.disconnect();
await db.$client.end();
