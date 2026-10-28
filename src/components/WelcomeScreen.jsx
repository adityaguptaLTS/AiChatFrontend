import { useLanguage } from '../context/LanguageContext.jsx';

export default function WelcomeScreen({ children }) {
  const { t } = useLanguage();

  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <h1 className="welcome-title">{t('howCanIHelp')}</h1>
        <p className="welcome-subtitle">
          {t('welcomeSubtitle')}
        </p>
      </div>
      {children && (
        <div className="welcome-composer-wrapper">
          {children}
        </div>
      )}
    </div>
  );
}
