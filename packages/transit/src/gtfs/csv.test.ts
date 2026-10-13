import { describe, expect, it } from 'vitest';
import { iterateCsv, iterateLines, parseCsvLine } from './csv';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('parseCsvLine', () => {
  it('découpe sur les virgules et garde les champs vides', () => {
    expect(parseCsvLine('a,,c,')).toEqual(['a', '', 'c', '']);
  });

  it('gère les guillemets, virgules et guillemets échappés', () => {
    expect(parseCsvLine('"Paris, Gare de Lyon","il dit ""bonjour""",x')).toEqual([
      'Paris, Gare de Lyon',
      'il dit "bonjour"',
      'x',
    ]);
  });
});

describe('iterateLines', () => {
  it('recolle les lignes et les caractères multi-octets coupés entre deux morceaux', () => {
    const text = 'Arènes\r\nSaint-Cyprien\nLe Toec';
    expect([...iterateLines(bytes(text), 3)]).toEqual(['Arènes', 'Saint-Cyprien', 'Le Toec']);
  });
});

describe('iterateCsv', () => {
  it('indexe par nom de colonne et ignore le BOM et les lignes vides', () => {
    const rows = [
      ...iterateCsv(bytes('﻿stop_id,stop_name\n1,Aubiet\n\n2,Colomiers\n'), [
        'stop_id',
        'stop_name',
      ]),
    ];
    expect(rows).toEqual([
      { stop_id: '1', stop_name: 'Aubiet' },
      { stop_id: '2', stop_name: 'Colomiers' },
    ]);
  });

  it('renvoie une chaîne vide pour une colonne absente', () => {
    expect([...iterateCsv(bytes('stop_id\n1\n'), ['stop_id', 'parent_station'])]).toEqual([
      { stop_id: '1', parent_station: '' },
    ]);
  });
});
