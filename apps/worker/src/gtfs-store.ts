import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { type createDb, schema } from '@escargo/db';
import type { GtfsFeed } from '@escargo/shared';
import { desc, eq } from 'drizzle-orm';

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Table = Parameters<Tx['insert']>[0];

const BATCH_SIZE = 5000;

/** Dernier import (ou dernière vérification) d'un flux. */
export async function lastImport(db: Db, feed: GtfsFeed) {
  const [last] = await db
    .select()
    .from(schema.gtfsImports)
    .where(eq(schema.gtfsImports.feed, feed))
    .orderBy(desc(schema.gtfsImports.checkedAt))
    .limit(1);
  return last ?? null;
}

/**
 * Si le fichier est identique au dernier importé, note seulement la vérification
 * et renvoie `true` : rien à importer.
 */
export async function markIfUnchanged(db: Db, feed: GtfsFeed, feedHash: string) {
  const last = await lastImport(db, feed);
  if (last?.feedHash !== feedHash) return false;
  await db
    .update(schema.gtfsImports)
    .set({ checkedAt: new Date() })
    .where(eq(schema.gtfsImports.id, last.id));
  console.log(`[gtfs ${feed}] flux inchangé, rien à importer`);
  return true;
}

/** Télécharge le zip sur disque en calculant son empreinte, sans le garder en mémoire. */
export async function download(
  url: string,
  dataDir: string,
  fileName: string,
  label: string,
): Promise<{ path: string; feedHash: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10 * 60_000) });
  if (!response.ok || !response.body) throw new Error(`${label} : HTTP ${response.status}`);
  await mkdir(dataDir, { recursive: true });
  const path = join(dataDir, fileName);
  const hash = createHash('sha256');
  await pipeline(
    Readable.fromWeb(response.body),
    new Transform({
      transform(chunk, _encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      },
    }),
    createWriteStream(path),
  );
  return { path, feedHash: hash.digest('hex') };
}

/** Vide les horaires d'un flux, sans toucher aux autres. */
export async function clearFeed(tx: Tx, feed: GtfsFeed) {
  await tx.delete(schema.gtfsStopTimes).where(eq(schema.gtfsStopTimes.feed, feed));
  await tx.delete(schema.gtfsTrips).where(eq(schema.gtfsTrips.feed, feed));
  await tx.delete(schema.gtfsServiceDates).where(eq(schema.gtfsServiceDates.feed, feed));
  await tx.delete(schema.gtfsRoutes).where(eq(schema.gtfsRoutes.feed, feed));
  await tx.delete(schema.gtfsStops).where(eq(schema.gtfsStops.feed, feed));
}

export async function insertBatches<T extends Table>(tx: Tx, table: T, rows: T['$inferInsert'][]) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await tx.insert(table).values(rows.slice(i, i + BATCH_SIZE));
  }
}

export async function insertStream<T extends Table>(
  tx: Tx,
  table: T,
  rows: Iterable<T['$inferInsert']> | AsyncIterable<T['$inferInsert']>,
): Promise<number> {
  let batch: T['$inferInsert'][] = [];
  let count = 0;
  for await (const row of rows) {
    batch.push(row);
    count++;
    if (batch.length === BATCH_SIZE) {
      await tx.insert(table).values(batch);
      batch = [];
    }
  }
  if (batch.length > 0) await tx.insert(table).values(batch);
  return count;
}
