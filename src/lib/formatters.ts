/**
 * Safe formatting utilities for numbers and dates.
 * Prevents "Cannot read properties of undefined (reading 'toLocaleString')" errors.
 */

export function fmtNum(val: any, locale: string = 'en-IN'): string {
  if (val === null || val === undefined) return '0';
  const n = Number(val);
  if (isNaN(n)) return '0';
  return n.toLocaleString(locale);
}

export function fmtDate(val: any, options?: Intl.DateTimeFormatOptions): string {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('bn-BD', options);
}
