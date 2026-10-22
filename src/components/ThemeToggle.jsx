import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <>
          <Sun size={16} className="theme-icon" />
          <span className="theme-toggle-label">Light mode</span>
        </>
      ) : (
        <>
          <Moon size={16} className="theme-icon" />
          <span className="theme-toggle-label">Dark mode</span>
        </>
      )}
    </button>
  );
}
