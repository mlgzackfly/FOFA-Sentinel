import { useState, useEffect } from 'react';
import { getLocale, setLocale, type Locale } from '../i18n';
import './LanguageSelector.css';

export function LanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLocaleChange = () => {
      setCurrentLocale(getLocale());
    };

    window.addEventListener('localechange', handleLocaleChange);
    return () => {
      window.removeEventListener('localechange', handleLocaleChange);
    };
  }, []);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
    { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  ];

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setCurrentLocale(locale);
    setIsOpen(false);
  };

  const currentLang = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <div className="language-selector">
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="language-flag">{currentLang.flag}</span>
        <span className="language-code">{currentLang.code.toUpperCase()}</span>
        <span className="language-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <>
          <div className="language-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-selector-dropdown">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`language-option ${currentLocale === lang.code ? 'active' : ''}`}
                onClick={() => handleSelect(lang.code)}
                aria-label={`Select ${lang.label}`}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-label">{lang.label}</span>
                {currentLocale === lang.code && <span className="language-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
