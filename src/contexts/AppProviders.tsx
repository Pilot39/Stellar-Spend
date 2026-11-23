'use client';

import { ReactNode } from 'react';
import { NotificationProvider } from './NotificationProvider';
import { ThemeProvider } from './ThemeContext';
import { I18nProvider } from '@/lib/i18n/provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composite provider wrapper for all app-level context providers.
 *
 * This is the single entry point for wiring up global React contexts. Instead of
 * nesting individual providers in `src/app/layout.tsx`, consumers should render
 * `<AppProviders>` once around the application tree.
 *
 * Provider ordering is critical:
 * 1. I18nProvider - must be outermost (affects all descendants)
 * 2. ErrorBoundary - catches errors across all descendants
 * 3. ThemeProvider - sets up theme context
 * 4. NotificationProvider - unified toast + notification-center system (#1042)
 *
 * Changing this order can cause hydration mismatches or context errors.
 *
 * Backwards compatibility: the individual providers remain exported from their
 * own modules (`NotificationProvider`, `ThemeProvider`, `useTheme`,
 * `useNotificationCenter`) so existing imports keep working.
 *
 * @example
 * ```tsx
 * // src/app/layout.tsx
 * <AppProviders>{children}</AppProviders>
 * ```
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}

// Backwards-compatible re-exports so consumers can import everything context
// related from a single module without reaching into individual files.
export { NotificationProvider, useNotificationCenter } from './NotificationProvider';
export { ThemeProvider, useTheme } from './ThemeContext';
</｜｜DSML｜｜ parameter>