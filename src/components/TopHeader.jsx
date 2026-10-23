import { ShieldCheck, UserX, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import acmeLogo from '../assets/ACME-Logo-SVG.png';
import { useAuthSession, clearAuthSession } from '../utils/auth.js';

export default function TopHeader() {
  const user = useAuthSession();
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuthSession();
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <header className="top-header-band" role="banner" aria-label="Application Top Header">
      {/* Left: ACME Logo and Application Title */}
      <div className="top-header-left">
        <div className="top-header-logo-wrapper">
          <img
            src={acmeLogo}
            alt="ACME Logo"
            className="top-header-logo"
          />
        </div>
        <div className="top-header-title-group">
          <h1 className="top-header-app-title">ACME AI Assistant</h1>
          <span className="top-header-app-badge">Local Engine</span>
        </div>
      </div>

      {/* Right: Authenticated User Display & Actions */}
      <div className="top-header-right">
        {user ? (
          <div className="top-header-user-group">
            <div className="top-header-user-badge" title={`Signed in as ${user.name}${user.email ? ` (${user.email})` : ''}`}>
              <div className="user-avatar-circle" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details-text">
                <span className="user-display-name">{user.name}</span>
                {user.role && (
                  <span className="user-role-tag">
                    <ShieldCheck size={11} />
                    <span>{user.role}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="top-header-logout-btn"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign out of ACME AI Assistant"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="top-header-guest-badge top-header-signin-btn"
            onClick={handleSignIn}
            title="Click to sign in"
            aria-label="Sign in"
          >
            <UserX size={14} className="guest-icon" />
            <span className="guest-label">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
