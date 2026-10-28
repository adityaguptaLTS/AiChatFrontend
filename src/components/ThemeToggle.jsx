import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ThemeToggle({ theme, onToggle }) {
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label={isDark ? t('lightMode') : t('darkMode')}
      title={isDark ? t('lightMode') : t('darkMode')}
    >
      {isDark ? (
        <>
          <Sun size={16} className="theme-icon" />
          <span className="theme-toggle-label">{t('lightMode')}</span>
        </>
      ) : (
        <>
          <Moon size={16} className="theme-icon" />
          <span className="theme-toggle-label">{t('darkMode')}</span>
        </>
      )}
    </button>
  );
}
