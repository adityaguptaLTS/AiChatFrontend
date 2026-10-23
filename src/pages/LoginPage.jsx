import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldAlert, Sun, Moon } from 'lucide-react';
import acmeLogo from '../assets/ACME-Logo-SVG.png';
import { setDemoAuthSession } from '../utils/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Validate a single field
  const validateField = (field, value) => {
    if (field === 'email') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 'Email address is required.';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid email address (e.g. user@acme.in).';
      }
      return '';
    }

    if (field === 'password') {
      if (!value) {
        return 'Password is required.';
      }
      if (!value.trim()) {
        return 'Password cannot be empty or only spaces.';
      }
      return '';
    }

    return '';
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateField('email', val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validateField('password', val) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailError, password: passwordError });

    if (emailError) {
      emailInputRef.current?.focus();
      return;
    }

    if (passwordError) {
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // Frontend-only session creation:
    // IMPORTANT: Absolutely NO password is saved, logged, or persisted.
    // Only the email/username is used for frontend UI presentation.
    setDemoAuthSession({ email });

    // Smooth transition to the chat interface
    setTimeout(() => {
      navigate('/chat', { replace: true });
    }, 250);
  };

  return (
    <div className="login-page-container">
      {/* Top Bar with Theme Toggle */}
      <header className="login-top-bar" role="banner">
        <div className="login-brand-minimal">
          <img src={acmeLogo} alt="ACME Logo" className="login-header-logo" />
          <span className="login-header-title">ACME AI Assistant</span>
        </div>
        {onToggleTheme && (
          <button
            type="button"
            className="login-theme-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </header>

      {/* Main Login Card Area */}
      <main className="login-main-content">
        <div className="login-card" role="region" aria-labelledby="login-heading">
          {/* Brand Header */}
          <div className="login-card-header">
            <div className="login-logo-badge" aria-hidden="true">
              <img src={acmeLogo} alt="ACME AI Logo" className="login-hero-logo" />
            </div>
            <h1 id="login-heading" className="login-heading">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue to ACME AI Assistant.</p>
          </div>

          {/* Demonstration Notice Banner */}
          <div className="login-demo-notice" role="note" aria-label="Demo Authentication Notice">
            <ShieldAlert size={16} className="login-notice-icon" aria-hidden="true" />
            <div className="login-notice-text">
              <strong>Frontend Demo Mode:</strong> Enter any valid email format and non-empty password to proceed. No passwords or credentials are saved.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email Field */}
            <div className="login-form-group">
              <label htmlFor="login-email" className="login-label">
                Email Address <span className="required-star" aria-hidden="true">*</span>
              </label>
              <div className={`login-input-wrapper ${errors.email && touched.email ? 'has-error' : ''}`}>
                <Mail size={18} className="login-field-icon" aria-hidden="true" />
                <input
                  ref={emailInputRef}
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@acme.in"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  className="login-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.email && touched.email)}
                  aria-describedby={errors.email && touched.email ? 'email-error-msg' : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && touched.email && (
                <div id="email-error-msg" className="login-inline-error" role="alert">
                  <AlertCircle size={13} aria-hidden="true" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label htmlFor="login-password" className="login-label">
                Password <span className="required-star" aria-hidden="true">*</span>
              </label>
              <div className={`login-input-wrapper ${errors.password && touched.password ? 'has-error' : ''}`}>
                <Lock size={18} className="login-field-icon" aria-hidden="true" />
                <input
                  ref={passwordInputRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  className="login-input"
                  aria-required="true"
                  aria-invalid={Boolean(errors.password && touched.password)}
                  aria-describedby={errors.password && touched.password ? 'password-error-msg' : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && touched.password && (
                <div id="password-error-msg" className="login-inline-error" role="alert">
                  <AlertCircle size={13} aria-hidden="true" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isSubmitting}
              aria-label="Sign In to ACME AI Assistant"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight size={16} className="login-btn-arrow" />}
            </button>
          </form>

          {/* Footer note */}
          <footer className="login-card-footer">
            <p className="login-footer-disclaimer">
              Connected to ACME Local AI Engine. Real production authentication will connect to corporate SSO / JWT provider.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
