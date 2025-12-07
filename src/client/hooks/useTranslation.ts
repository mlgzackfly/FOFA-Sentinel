import { useState, useEffect } from 'react';
import { getLocale, setLocale, type Locale, t as translate } from '../i18n';

export function useTranslation() {
  const [locale, setCurrentLocale] = useState<Locale>(getLocale());

  useEffect(() => {
    const handleLocaleChange = () => {
      setCurrentLocale(getLocale());
    };
    
    window.addEventListener('localechange', handleLocaleChange);
    return () => {
      window.removeEventListener('localechange', handleLocaleChange);
    };
  }, []);

  const t = (key: string): string => {
    return translate(key);
  };

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
  };

  return { t, locale, changeLocale };
}

