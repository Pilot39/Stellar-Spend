'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/Icon';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface AsyncBoundaryProps {
  isLoading: boolean;
  isEmpty: boolean;
  error?: string | null;
  children: ReactNode;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  errorContent?: (error: string) => ReactNode;
  className?: string;
  loadingClassName?: string;
  emptyClassName?: string;
  errorClassName?: string;
}

/**
 * AsyncBoundary provides a normalized way to handle loading, error, and empty states
 * across list views (history, transactions, notifications, etc).
 *
 * Usage:
 * <AsyncBoundary
 *   isLoading={isLoading}
 *   isEmpty={items.length === 0}
 *   error={error}
 *   loadingContent={<Skeleton />}
 *   emptyContent={<EmptyState />}
 * >
 *   <ItemList items={items} />
 * </AsyncBoundary>
 */
export function AsyncBoundary({
  isLoading,
  isEmpty,
  error,
  children,
  loadingContent,
  emptyContent,
  errorContent,
  className,
  loadingClassName,
  emptyClassName,
  errorClassName,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error}
      loadingContent={loadingContent}
      emptyContent={emptyContent}
      errorContent={errorContent}
      className={className}
      loadingClassName={loadingClassName}
      emptyClassName={emptyClassName}
      errorClassName={errorClassName}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Default loading skeleton for list items
 */
export function ListLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded" />
      ))}
    </div>
  );
}

/**
 * Default empty state for lists
 */
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function ListEmptyState({
  title = 'No items',
  description = 'Nothing to show here yet',
  icon,
  action,
}: EmptyStateProps) {
  return <Empty title={title} description={description} icon={icon} action={action} />;
}

/**
 * Default error state for lists
 */
export interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ListErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon name="alert-circle" size={32} strokeWidth={1.5} className="mb-4 text-red-400" />
      <h3 className="text-sm font-semibold text-white mb-1">Failed to load</h3>
      <p className="text-xs text-[#777777] mb-4 text-center max-w-xs">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] text-[#c9a962] hover:text-[#dbb76d] transition-colors uppercase tracking-wider"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export { ListLoadingState, ListEmptyState, ListErrorState };
