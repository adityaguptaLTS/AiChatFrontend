import { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, Server, ShieldAlert } from 'lucide-react';
import { testEngineConnection } from '../services/aiService.js';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  engineConfig,
}) {
  const [endpoint, setEndpoint] = useState(settings.customEndpoint || '');
  const [model, setModel] = useState(settings.customModel || '');
  const [useDemo, setUseDemo] = useState(Boolean(settings.useDemoMode));
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

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
    setUseDemo(true);
    setTemperature(0.7);
    setTestResult(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Server size={18} className="modal-icon" />
            <h2 id="settings-title">ACME AI Engine Settings</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close settings dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Mode Switcher */}
          <div className="form-group mode-toggle-group">
            <label className="toggle-label">
              <span className="toggle-title">Interactive Demo / Simulation Mode</span>
              <span className="toggle-desc">
                When enabled, queries return simulated local AI responses with mock streaming so the interface can be fully tested without a live server.
              </span>
            </label>
            <input
              type="checkbox"
              id="demo-mode-checkbox"
              checked={useDemo}
              onChange={(e) => setUseDemo(e.target.checked)}
              className="settings-checkbox"
            />
          </div>

          <div className="form-divider" />

          {/* Engine Base URL */}
          <div className="form-group">
            <label htmlFor="setting-endpoint" className="form-label">
              Local Engine Base URL
            </label>
            <input
              id="setting-endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="e.g. http://localhost:8000 or http://127.0.0.1:11434"
              className="form-input"
            />
            <span className="form-hint">
              Defaults to <code>VITE_AI_API_BASE_URL</code> from <code>.env</code> ({engineConfig.baseUrl || 'Not configured in .env'}).
            </span>
          </div>

          {/* Model Identifier */}
          <div className="form-group">
            <label htmlFor="setting-model" className="form-label">
              Model Identifier (Optional)
            </label>
            <input
              id="setting-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. llama3, mistral, custom-local"
              className="form-input"
            />
          </div>

          {/* Temperature Slider */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="setting-temp" className="form-label">
                Temperature: {temperature}
              </label>
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
              Lower values are more deterministic and focused; higher values are more creative.
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
              <RefreshCw size={14} className={testing ? 'spin-icon' : ''} />
              <span>{testing ? 'Testing connection...' : 'Test Engine Endpoint'}</span>
            </button>

            {testResult && (
              <div className={`test-result-box ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? (
                  <CheckCircle size={16} className="result-icon-success" />
                ) : (
                  <AlertCircle size={16} className="result-icon-error" />
                )}
                <div className="result-text">{testResult.message}</div>
              </div>
            )}
          </div>

          {/* CORS / Network notice */}
          <div className="network-note">
            <ShieldAlert size={14} className="note-icon" />
            <p>
              <strong>CORS Requirement:</strong> If your local AI server is running on a different port (e.g. 8000 or 11434), ensure its CORS policy permits requests from this origin.
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
            >
              Reset to Defaults
            </button>
            <div className="footer-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
