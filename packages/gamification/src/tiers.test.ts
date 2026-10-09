import { describe, expect, it } from 'vitest';
import { tierForMinutes } from './tiers';

describe('tierForMinutes', () => {
  it('démarre au palier 1', () => {
    expect(tierForMinutes(0).current.level).toBe(1);
  });

  it('14 h 32 = Patient confirmé, prochain Martyr du rail', () => {
    const { current, next } = tierForMinutes(14 * 60 + 32);
    expect(current.name).toBe('Patient confirmé');
    expect(next?.name).toBe('Martyr du rail');
  });

  it('au-delà de 60 h, plus de palier suivant', () => {
    expect(tierForMinutes(61 * 60).next).toBeNull();
  });
});
