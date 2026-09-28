'use client';

import { useLayoutEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  useLayoutEffect(() => {
    document.documentElement.dataset.theme =
      window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  }, []);

  const toggleTheme = () => {
    const nextTheme =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('theme', nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
      className="inline-flex items-center gap-2 rounded-lg border border-[#c9e0eb] bg-white px-3 py-2 text-xs font-semibold text-[#244764] shadow-sm transition-colors hover:bg-[#eff9f5]"
    >
      <Moon className="theme-toggle-moon" size={16} aria-hidden="true" />
      <Sun className="theme-toggle-sun" size={16} aria-hidden="true" />
      <span className="theme-toggle-dark-label">Dark mode</span>
      <span className="theme-toggle-light-label">Light mode</span>
    </button>
  );
}
