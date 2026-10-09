// Worker temps réel : lit le GTFS-RT national SNCF toutes les 2 minutes,
// interroge PRIM pour l'Île-de-France, met en cache par train dans Redis.
// Le coût ne dépend pas du nombre d'utilisateurs.

const POLL_INTERVAL_MS = 2 * 60_000;

async function poll() {
  // TODO(phase 1) : ingestion GTFS-RT SNCF + PRIM, cache Redis par trip_id.
  console.log(`[worker] poll ${new Date().toISOString()}`);
}

await poll();
setInterval(poll, POLL_INTERVAL_MS);
