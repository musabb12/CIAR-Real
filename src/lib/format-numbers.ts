/** Western digits (0–9) regardless of UI language. */
export const NUMBER_LOCALE = 'en-US';

export function formatNumberEn(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString(NUMBER_LOCALE, options);
}

/** Date/time with locale-aware labels but always Latin digits. */
export function formatDateEn(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { numberingSystem: 'latn', ...options });
}

export function formatDateTimeEn(
  date: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { numberingSystem: 'latn', ...options });
}
