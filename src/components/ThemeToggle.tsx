'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from '@/i18n/useTranslations';
import type { Theme } from '@/contexts/ThemeContext';

const ICON_SIZE = 20;
const ICON_VIEWBOX = '0 0 24 24';
const STROKE_WIDTH = 2;

const NEXT_THEME: Record<Theme, Theme> = {
  dark: 'light',
  light: 'high-contrast',
  'high-contrast': 'dark',
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();

  const nextTheme = NEXT_THEME[theme];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className="theme-toggle p-2 border border-line hover:border-accent transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={t('themeToggle.ariaLabel', { next: nextTheme, current: theme })}
      aria-pressed={theme !== 'light'}
      title={t('themeToggle.title', { next: nextTheme })}
      data-theme-icon={theme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' && (
          <svg width={ICON_SIZE} height={ICON_SIZE} viewBox={ICON_VIEWBOX} fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={STROKE_WIDTH} />
            <path
              d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />
          </svg>
        )}
        {theme === 'light' && (
          <svg width={ICON_SIZE} height={ICON_SIZE} viewBox={ICON_VIEWBOX} fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="currentColor"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {theme === 'high-contrast' && (
          <svg width={ICON_SIZE} height={ICON_SIZE} viewBox={ICON_VIEWBOX} fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="currentColor"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        )}
      </span>
    </button>
  );
}
