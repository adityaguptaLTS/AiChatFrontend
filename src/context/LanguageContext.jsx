import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadLanguage, saveLanguage } from '../utils/storage.js';
import { SUPPORTED_LANGUAGES, t as translate } from '../utils/i18n.js';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  languages: SUPPORTED_LANGUAGES,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => loadLanguage());

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'acme-ai-language' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
          if (supported.includes(parsed)) {
            setLanguageState(parsed);
          }
        } catch {
          const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
          if (supported.includes(e.newValue)) {
            setLanguageState(e.newValue);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const changeLanguage = useCallback((newLang) => {
    const supported = SUPPORTED_LANGUAGES.map((l) => l.code);
    const validLang = supported.includes(newLang) ? newLang : 'en';
    setLanguageState(validLang);
    saveLanguage(validLang);
  }, []);

  const t = useCallback((key) => {
    return translate(key, language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
