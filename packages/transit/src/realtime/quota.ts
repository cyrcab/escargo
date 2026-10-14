/**
 * Quota PRIM par défaut : 1 000 appels par jour pour l'estimated-timetable.
 * Un relevé toutes les 2 minutes en consomme 720 ; la marge couvre les redémarrages
 * du worker et les essais à la main avec la même clé.
 */
export const PRIM_DAILY_CALL_BUDGET = 950;

/** Jour (heure de Paris, `YYYY-MM-DD`) auquel le quota PRIM est compté. */
export const quotaDay = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now);

/** `callNumber` : rang de l'appel dans la journée, compteur déjà incrémenté. */
export const withinQuota = (callNumber: number, budget = PRIM_DAILY_CALL_BUDGET) =>
  callNumber <= budget;
