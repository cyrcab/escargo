import { describe, expect, it } from 'vitest';
import { computeCountedDelay } from './delay';

const at = (hhmm: string) => new Date(`2026-10-09T${hhmm}:00+02:00`);

describe('computeCountedDelay', () => {
  it('compte un retard au-dessus du seuil', () => {
    expect(computeCountedDelay(at('08:00'), at('08:12'))).toBe(12);
  });

  it('compte un retard pile au seuil', () => {
    expect(computeCountedDelay(at('08:00'), at('08:05'))).toBe(5);
  });

  it('ignore un retard sous le seuil', () => {
    expect(computeCountedDelay(at('08:00'), at('08:04'))).toBe(0);
  });

  it('ignore une arrivée en avance', () => {
    expect(computeCountedDelay(at('08:00'), at('07:58'))).toBe(0);
  });
});
