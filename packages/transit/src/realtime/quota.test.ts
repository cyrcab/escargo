import { describe, expect, it } from 'vitest';
import { PRIM_DAILY_CALL_BUDGET, quotaDay, withinQuota } from './quota';

describe('quota PRIM', () => {
  it('laisse passer un relevé toutes les 2 minutes sur une journée', () => {
    expect(withinQuota((24 * 60) / 2)).toBe(true);
  });

  it('bloque au-delà du budget, sous le quota de 1 000', () => {
    expect(PRIM_DAILY_CALL_BUDGET).toBeLessThan(1000);
    expect(withinQuota(PRIM_DAILY_CALL_BUDGET)).toBe(true);
    expect(withinQuota(PRIM_DAILY_CALL_BUDGET + 1)).toBe(false);
  });

  it('change de jour à minuit heure de Paris, pas UTC', () => {
    expect(quotaDay(new Date('2026-10-14T22:30:00Z'))).toBe('2026-10-15');
    expect(quotaDay(new Date('2026-10-14T21:30:00Z'))).toBe('2026-10-14');
  });
});
