import { useState, useEffect } from 'react';

/**
 * Authentication and Session Utility
 * 
 * Reuses existing authentication and session state from the company's ACME chat application.
 * Reads existing session tokens and user data stored in localStorage by the chat app.
 * Does NOT invent fake users, mock credentials, or fabricate authentication tokens.
 */

const STORAGE_AUTH_KEYS = {
  USER: 'user',
  USER_NAME: 'userName',
  EMAIL: 'email',
  AUTH_TOKEN: 'authToken',
  USER_ID: 'userId',
};

/**
 * Safely decodes the payload of a JWT token without external libraries
 */
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from existing session data.
 * Returns null if no valid user session is detected.
 */
export function getAuthenticatedUser() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    // 1. Check existing 'user' object stored by ACME chat application
    const rawUser = localStorage.getItem(STORAGE_AUTH_KEYS.USER);
    if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed && typeof parsed === 'object') {
          const fullName =
            parsed.name ||
            (parsed.firstName
              ? `${parsed.firstName} ${parsed.lastName || ''}`.trim()
              : null) ||
            parsed.username ||
            parsed.displayName;

          if (fullName) {
            return {
              name: fullName,
              email: parsed.email || localStorage.getItem(STORAGE_AUTH_KEYS.EMAIL) || null,
              role: parsed.role || null,
              userId: parsed.id || parsed.userId || parsed.user_id || localStorage.getItem(STORAGE_AUTH_KEYS.USER_ID) || null,
              isAuthenticated: true,
            };
          }
        }
      } catch {
        // Not valid JSON
      }
    }

    // 2. Check standalone 'userName' key
    const rawUserName = localStorage.getItem(STORAGE_AUTH_KEYS.USER_NAME);
    if (rawUserName && rawUserName.trim() && rawUserName !== 'undefined' && rawUserName !== 'null') {
      return {
        name: rawUserName.trim(),
        email: localStorage.getItem(STORAGE_AUTH_KEYS.EMAIL) || null,
        role: null,
        userId: localStorage.getItem(STORAGE_AUTH_KEYS.USER_ID) || null,
        isAuthenticated: true,
      };
    }

    // 3. Check JWT token stored by ACME chat app
    const authToken = localStorage.getItem(STORAGE_AUTH_KEYS.AUTH_TOKEN);
    if (authToken && authToken !== 'undefined' && authToken !== 'null') {
      const decoded = decodeJwtPayload(authToken);
      if (decoded) {
        const tokenName =
          decoded.name ||
          (decoded.firstName
            ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
            : null) ||
          decoded.username ||
          decoded.email;

        if (tokenName) {
          return {
            name: tokenName,
            email: decoded.email || null,
            role: decoded.role || null,
            userId: decoded.userId || decoded.id || decoded.sub || null,
            isAuthenticated: true,
          };
        }
      }
    }

    // 4. Fallback to existing 'email' key if present
    const email = localStorage.getItem(STORAGE_AUTH_KEYS.EMAIL);
    if (email && email.includes('@') && email !== 'undefined' && email !== 'null') {
      return {
        name: email.split('@')[0],
        email,
        role: null,
        userId: localStorage.getItem(STORAGE_AUTH_KEYS.USER_ID) || null,
        isAuthenticated: true,
      };
    }
  } catch (err) {
    console.warn('[auth] Error inspecting existing session:', err);
  }

  // No authenticated session found
  return null;
}

/**
 * React hook to observe session changes (e.g. across browser tabs or logins)
 */
export function useAuthSession() {
  const [user, setUser] = useState(() => getAuthenticatedUser());

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getAuthenticatedUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return user;
}
