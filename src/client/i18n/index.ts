import { en } from './locales/en';
import { zhTW } from './locales/zh-TW';
import { zhCN } from './locales/zh-CN';

export type Locale = 'en' | 'zh-TW' | 'zh-CN';

export const locales = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
} as const;

export type Translations = typeof en;

let currentLocale: Locale = 'en';

const getStoredLocale = (): Locale | null => {
  try {
    const stored = localStorage.getItem('fofa-locale');
    if (stored && (stored === 'en' || stored === 'zh-TW' || stored === 'zh-CN')) {
      return stored as Locale;
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
};

const setStoredLocale = (locale: Locale): void => {
  try {
    localStorage.setItem('fofa-locale', locale);
  } catch {
    // Ignore localStorage errors
  }
};

export const setLocale = (locale: Locale): void => {
  currentLocale = locale;
  setStoredLocale(locale);
  window.dispatchEvent(new Event('localechange'));
};

export const getLocale = (): Locale => {
  const stored = getStoredLocale();
  if (stored) {
    currentLocale = stored;
  }
  return currentLocale;
};

export const t = (key: string): string => {
  const translations = locales[currentLocale];
  const keys = key.split('.');
  let value: unknown = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
};

// Initialize locale from storage
getLocale();
