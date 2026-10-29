import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import { useAuthSession } from './utils/auth.js';
import { loadTheme, saveTheme } from './utils/storage.js';
import { LanguageProvider } from './context/LanguageContext.jsx';

/**
 * Lightweight Demo Navigation Guard:
 * Restricts access to the chat page unless a valid session exists.
 * NOTE: This is a frontend-only demonstration guard and does not replace server-side auth.
 */
function ProtectedRoute({ children }) {
  const user = useAuthSession();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Public Route Guard:
 * If the user already has an active session, redirects directly to /chat.
 */
function PublicRoute({ children }) {
  const user = useAuthSession();
  if (user) {
    return <Navigate to="/chat" replace />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => loadTheme());
  const user = useAuthSession();

  // Apply theme to HTML root element
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <LanguageProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Login Route (Public) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage theme={theme} onToggleTheme={toggleTheme} />
              </PublicRoute>
            }
          />

          {/* Dedicated Chat Route (Protected by Demo Guard) */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage theme={theme} onToggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          />

          {/* Root Route: Initial entry point */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
            }
          />

          {/* Catch-all Fallback */}
          <Route
            path="*"
            element={<Navigate to={user ? "/chat" : "/login"} replace />}
          />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
