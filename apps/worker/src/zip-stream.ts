import { createReadStream } from 'node:fs';
import { Unzip, UnzipInflate } from 'fflate';

/**
 * Contenu d'un fichier d'une archive zip, décompressé à la volée par morceaux.
 * Le stop_times.txt du GTFS IDFM dépasse 1 Go décompressé : il ne doit jamais
 * tenir en mémoire d'un bloc.
 */
export async function* readZipEntry(zipPath: string, name: string): AsyncGenerator<Uint8Array> {
  const pending: Uint8Array[] = [];
  let found = false;
  let done = false;
  let failure: Error | null = null;

  const unzip = new Unzip((file) => {
    if (file.name !== name) return;
    found = true;
    file.ondata = (error, chunk, final) => {
      if (error) failure = error;
      else pending.push(chunk);
      if (final) done = true;
    };
    file.start();
  });
  unzip.register(UnzipInflate);

  for await (const chunk of createReadStream(zipPath, { highWaterMark: 1 << 20 })) {
    unzip.push(chunk as Uint8Array);
    if (failure) throw failure;
    yield* pending.splice(0);
    // Sortir de la boucle ferme le fichier : inutile de lire la suite de l'archive.
    if (done) return;
  }
  unzip.push(new Uint8Array(0), true);
  if (failure) throw failure;
  yield* pending.splice(0);
  if (!found) throw new Error(`${name} absent de ${zipPath}`);
}

/** Contenu complet d'un petit fichier de l'archive. */
export async function readZipFile(zipPath: string, name: string): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readZipEntry(zipPath, name)) chunks.push(chunk);
  return Buffer.concat(chunks);
}
