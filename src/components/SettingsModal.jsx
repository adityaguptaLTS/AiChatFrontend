import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Sliders,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { testEngineConnection } from '../services/aiService.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  engineConfig,
  theme,
  onToggleTheme,
}) {
  const { language, setLanguage, t, languages } = useLanguage();
  const [endpoint, setEndpoint] = useState(settings.customEndpoint || '');
  const [model, setModel] = useState(settings.customModel || '');
  const [useDemo, setUseDemo] = useState(Boolean(settings.useDemoMode));
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Sync state if settings prop changes externally
  useEffect(() => {
    if (isOpen) {
      setEndpoint(settings.customEndpoint || '');
      setModel(settings.customModel || '');
      setUseDemo(Boolean(settings.useDemoMode));
      setTemperature(settings.temperature ?? 0.7);
      setTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const result = await testEngineConnection({
      customEndpoint: endpoint,
      customModel: model,
      useDemoMode: false,
    });

    setTestResult(result);
    setTesting(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings({
      customEndpoint: endpoint.trim(),
      customModel: model.trim(),
      useDemoMode: useDemo,
      temperature: Number(temperature),
    });
    onClose();
  };

  const handleReset = () => {
    setEndpoint('');
    setModel('');
    setUseDemo(false);
    setTemperature(0.7);
    setTestResult(null);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="modal-card chatgpt-settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h2 id="settings-title">{t('settings')}</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="modal-body settings-body-sections">
          {/* Section 1: General & Appearance */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Sun size={15} className="section-icon" />
              <h3>{t('generalAppearance')}</h3>
            </div>

            {/* Language Preference */}
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-row-label">{t('language')}</span>
                <span className="settings-row-desc">
                  {t('languageDesc')}
                </span>
              </div>
              <div className="language-select-wrapper">
                <Globe size={15} className="language-select-icon" aria-hidden="true" />
                <select
                  id="setting-language"
                  className="language-select-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  aria-label={t('language')}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} {lang.name !== lang.nativeName ? `(${lang.nativeName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language Scope Explanatory Note */}
            <div className="settings-hint-box">
              <span className="settings-hint-text">
                {t('languageNotice')}
              </span>
            </div>

            {/* Theme Selector */}
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-row-label">{t('theme')}</span>
                <span className="settings-row-desc">
                  {t('themeDesc')}
                </span>
              </div>
              <div className="theme-pill-selector" role="group" aria-label="Theme selection">
                <button
                  type="button"
                  className={`theme-pill-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => theme !== 'dark' && onToggleTheme?.()}
                  aria-pressed={theme === 'dark'}
                >
                  <Moon size={14} />
                  <span>{theme === 'dark' ? t('darkMode') : 'Dark'}</span>
                </button>
                <button
                  type="button"
                  className={`theme-pill-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => theme !== 'light' && onToggleTheme?.()}
                  aria-pressed={theme === 'light'}
                >
                  <Sun size={14} />
                  <span>{theme === 'light' ? t('lightMode') : 'Light'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="form-divider" />

          {/* Section 2: Model & Intelligence */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Sliders size={15} className="section-icon" />
              <h3>{t('modelGeneration')}</h3>
            </div>

            {/* Model Name */}
            <div className="form-group">
              <label htmlFor="setting-model" className="form-label">
                Model Name
              </label>
              <input
                id="setting-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={engineConfig.modelName ? `Current: ${engineConfig.modelName}` : 'e.g. local-llm, llama3'}
                className="form-input"
              />
              <span className="form-hint">
                Model identifier provided by your local backend engine (leave blank to use <code>.env</code> default).
              </span>
            </div>

            {/* Temperature Slider */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="setting-temp" className="form-label">
                  Temperature
                </label>
                <span className="setting-value-badge">{temperature.toFixed(2)}</span>
              </div>
              <input
                id="setting-temp"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="form-range"
              />
              <span className="form-hint">
                Lower values produce focused and deterministic responses; higher values encourage creativity.
              </span>
            </div>
          </div>

          <div className="form-divider" />

          {/* Section 3: Engine Connection & Simulation */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Server size={15} className="section-icon" />
              <h3>{t('engineConnection')}</h3>
            </div>

            {/* Mode Switcher */}
            <div className="settings-row">
              <div className="settings-row-text">
                <span className="settings-row-label">Simulation / Demo Mode</span>
                <span className="settings-row-desc">
                  Simulate local responses without sending queries to the external or local engine server.
                </span>
              </div>
              <label className="toggle-switch-container">
                <input
                  type="checkbox"
                  id="demo-mode-checkbox"
                  checked={useDemo}
                  onChange={(e) => setUseDemo(e.target.checked)}
                  className="toggle-switch-input"
                />
                <span className="toggle-switch-slider" />
              </label>
            </div>

            {/* Engine Base URL */}
            <div className="form-group">
              <label htmlFor="setting-endpoint" className="form-label">
                Engine API Endpoint URL
              </label>
              <input
                id="setting-endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={engineConfig.baseUrl || 'http://localhost:5181'}
                className="form-input"
              />
              <span className="form-hint">
                Default: <code>{engineConfig.baseUrl || 'http://localhost:5181'}</code>
              </span>
            </div>

            {/* Test Connection Button */}
            <div className="test-connection-section">
              <button
                type="button"
                className="test-conn-btn"
                onClick={handleTestConnection}
                disabled={testing || (!endpoint && !engineConfig.baseUrl)}
              >
                <RefreshCw size={13} className={testing ? 'spin-icon' : ''} />
                <span>{testing ? 'Testing connection...' : 'Test Connection'}</span>
              </button>

              {testResult && (
                <div className={`test-result-box ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.success ? (
                    <CheckCircle size={15} className="result-icon-success" />
                  ) : (
                    <AlertCircle size={15} className="result-icon-error" />
                  )}
                  <div className="result-text">{testResult.message}</div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary btn-reset"
              onClick={handleReset}
              title="Reset all settings to default values"
            >
              <RotateCcw size={13} />
              <span>{t('resetDefaults')}</span>
            </button>
            <div className="footer-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
