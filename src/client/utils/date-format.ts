import { getLocale, type Locale } from '../i18n';

/**
 * Maps application locale to browser locale string for date formatting
 */
function getBrowserLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
  };
  return localeMap[locale] || 'en-US';
}

/**
 * Formats a date according to the current application locale
 * @param date - Date object or date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getBrowserLocale(getLocale());
  return dateObj.toLocaleString(locale, options);
}

/**
 * Formats a date with date only (no time)
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDateOnly(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * Formats a date with date and time
 * @param date - Date object or date string
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });
}
