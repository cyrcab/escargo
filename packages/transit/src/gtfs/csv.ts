/** Découpe une ligne CSV (RFC 4180) : virgules, champs entre guillemets, `""` échappé. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      fields.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  fields.push(field);
  return fields;
}

/**
 * Lignes d'un fichier texte UTF-8, décodé par morceaux pour ne jamais créer
 * une chaîne de la taille du fichier (stop_times.txt dépasse 80 Mo).
 */
export function* iterateLines(bytes: Uint8Array, chunkSize = 1 << 20): Generator<string> {
  const decoder = new TextDecoder('utf-8');
  let rest = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, bytes.length);
    rest += decoder.decode(bytes.subarray(offset, end), { stream: end < bytes.length });
    const lines = rest.split('\n');
    rest = lines.pop() ?? '';
    for (const line of lines) yield line.replace(/\r$/, '');
  }
  rest += decoder.decode();
  if (rest.replace(/\r$/, '') !== '') yield rest.replace(/\r$/, '');
}

/**
 * Enregistrements d'un fichier CSV avec en-tête, indexés par nom de colonne.
 * Une colonne absente de l'en-tête vaut `''`.
 */
export function* iterateCsv<C extends string>(
  bytes: Uint8Array,
  columns: readonly C[],
): Generator<Record<C, string>> {
  let header: string[] | undefined;
  for (const line of iterateLines(bytes)) {
    if (line === '') continue;
    const fields = parseCsvLine(line);
    if (!header) {
      header = fields.map((name) => name.replace(/^﻿/, '').trim());
      continue;
    }
    const index = header;
    const record = {} as Record<C, string>;
    for (const name of columns) {
      const i = index.indexOf(name);
      record[name] = i === -1 ? '' : (fields[i] ?? '');
    }
    yield record;
  }
}
