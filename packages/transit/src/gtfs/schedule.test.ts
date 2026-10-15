import { describe, expect, it } from 'vitest';
import { isImportDue, lastSlotBefore } from './schedule';

// Créneaux de mise à jour du GTFS IDFM (heure de Paris), avec 30 min de marge.
const SLOTS = ['08:30', '13:30', '17:30'];
const at = (iso: string) => new Date(iso);
const epoch = (iso: string) => Date.parse(iso) / 1000;

describe('lastSlotBefore', () => {
  it('prend le dernier créneau passé de la journée', () => {
    expect(lastSlotBefore(at('2026-10-14T15:00:00+02:00'), SLOTS)).toBe(
      epoch('2026-10-14T13:30:00+02:00'),
    );
  });

  it('avant le premier créneau, remonte au dernier de la veille', () => {
    expect(lastSlotBefore(at('2026-10-14T07:00:00+02:00'), SLOTS)).toBe(
      epoch('2026-10-13T17:30:00+02:00'),
    );
  });

  it("suit l'heure d'hiver", () => {
    expect(lastSlotBefore(at('2026-12-01T09:00:00+01:00'), SLOTS)).toBe(
      epoch('2026-12-01T08:30:00+01:00'),
    );
  });
});

describe('isImportDue', () => {
  const now = at('2026-10-14T14:00:00+02:00');

  it('dû au premier lancement', () => {
    expect(isImportDue(null, now, SLOTS)).toBe(true);
  });

  it('dû si la dernière vérification précède le créneau de 13 h 30', () => {
    expect(isImportDue(at('2026-10-14T09:00:00+02:00'), now, SLOTS)).toBe(true);
  });

  it('pas dû si déjà vérifié après ce créneau : trois imports par jour au plus', () => {
    expect(isImportDue(at('2026-10-14T13:35:00+02:00'), now, SLOTS)).toBe(false);
  });
});
