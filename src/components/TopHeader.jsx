import { ShieldCheck, UserX } from 'lucide-react';
import acmeLogo from '../assets/ACME-Logo-SVG.png';
import { useAuthSession } from '../utils/auth.js';

export default function TopHeader() {
  const user = useAuthSession();

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

      {/* Right: Authenticated User Display */}
      <div className="top-header-right">
        {user ? (
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
        ) : (
          <div className="top-header-guest-badge" title="No active ACME chat session detected. Log in to the ACME Chat application to link your user identity.">
            <UserX size={14} className="guest-icon" />
            <span className="guest-label">Guest Session</span>
          </div>
        )}
      </div>
    </header>
  );
}
