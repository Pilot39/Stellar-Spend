'use client';

import { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { t } from '@/lib/i18n';

const SECONDS_PER_MINUTE = 60;
const STAR_RATINGS = [1, 2, 3, 4, 5] as const;
const MAX_RATING = 5;
const SKELETON_ROW_COUNT = 3;
const SORT_OPTIONS = ['rate', 'fee', 'time'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];
type QuoteBadge = 'Best Rate' | 'Fastest' | 'Lowest Fee';

export interface ProviderQuote {
  id: string;
  provider: string;
  rate: number;
  bridgeFee: string;
  payoutFee: string;
  totalFee: string;
  estimatedTime: number; // seconds
  destinationAmount: string;
  currency: string;
  rating: number; // 1-5
  badge?: QuoteBadge;
}

interface QuoteComparisonProps {
  quotes: ProviderQuote[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex gap-0.5"
      role="img"
      aria-label={t('quoteComparison.ratingLabel', { rating, max: MAX_RATING })}
    >
      {STAR_RATINGS.map((s) => (
        <span
          key={s}
          aria-hidden="true"
          className={cn('text-[10px]', s <= rating ? 'text-accent' : 'text-line')}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatTime(seconds: number): string {
  if (seconds < SECONDS_PER_MINUTE) {
    return t('quoteComparison.timeSeconds', { seconds });
  }
  const mins = Math.round(seconds / SECONDS_PER_MINUTE);
  return t('quoteComparison.timeMinutes', { minutes: mins });
}

function getSortLabel(option: SortOption): string {
  switch (option) {
    case 'rate':
      return t('quoteComparison.sortBestRate');
    case 'fee':
      return t('quoteComparison.sortLowestFee');
    case 'time':
      return t('quoteComparison.sortFastest');
  }
}

function QuoteComparison({ quotes, selectedId, onSelect, isLoading }: QuoteComparisonProps) {
  const [sortBy, setSortBy] = useState<SortOption>('rate');

  const sorted = useMemo(
    () =>
      [...quotes].sort((a, b) => {
        if (sortBy === 'rate') return b.rate - a.rate;
        if (sortBy === 'fee') return parseFloat(a.totalFee) - parseFloat(b.totalFee);
        return a.estimatedTime - b.estimatedTime;
      }),
    [quotes, sortBy],
  );

  if (isLoading) {
    return (
      <div className="py-4" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{t('quoteComparison.loadingQuotes')}</span>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
          <div key={i} aria-hidden="true" className="skeleton h-[72px] mb-2 rounded" />
        ))}
      </div>
    );
  }

  if (!quotes.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Sort controls */}
      <div
        className="flex gap-1.5 items-center"
        role="group"
        aria-label={t('quoteComparison.sortBy')}
      >
        <span className="text-[11px] text-muted" aria-hidden="true">
          {t('quoteComparison.sortBy')}
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSortBy(opt)}
            aria-pressed={sortBy === opt}
            className={cn(
              'text-[11px] px-2 py-[3px] border bg-transparent cursor-pointer capitalize',
              sortBy === opt ? 'border-accent text-accent' : 'border-line text-muted',
            )}
          >
            {getSortLabel(opt)}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div
        aria-hidden="true"
        className="grid grid-cols-[1fr_80px_80px_70px_60px_32px] gap-2 px-3 py-1.5 text-[10px] text-muted tracking-[0.06em] uppercase border-b border-line"
      >
        <span>{t('quoteComparison.columnProvider')}</span>
        <span>{t('quoteComparison.columnYouReceive')}</span>
        <span>{t('quoteComparison.columnTotalFee')}</span>
        <span>{t('quoteComparison.columnEstTime')}</span>
        <span>{t('quoteComparison.columnRating')}</span>
        <span />
      </div>

      {/* Rows */}
      <div role="radiogroup" aria-label={t('quoteComparison.selectProvider')}>
        {sorted.map((q) => {
          const isSelected = q.id === selectedId;
          return (
            <button
              key={q.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${q.provider}, ${t('quoteComparison.youReceiveLabel', {
                amount: formatNumber(parseFloat(q.destinationAmount)),
                currency: q.currency,
              })}, ${t('quoteComparison.totalFeeLabel', { amount: q.totalFee, currency: 'USDC' })}, ${t(
                'quoteComparison.estTimeLabel',
                { time: formatTime(q.estimatedTime) },
              )}, ${t('quoteComparison.ratingLabel', { rating: q.rating, max: MAX_RATING })}${
                q.badge ? `, ${q.badge}` : ''
              }`}
              onClick={() => onSelect(q.id)}
              className={cn(
                'grid grid-cols-[1fr_80px_80px_70px_60px_32px] gap-2 px-3 py-2.5 border cursor-pointer text-left items-center transition-[border-color,background-color] duration-150 w-full mb-2',
                isSelected
                  ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_8%,var(--panel))]'
                  : 'border-line bg-panel',
              )}
            >
              {/* Provider name + badge */}
              <div className="flex flex-col gap-[3px]">
                <span className="text-[13px] text-text font-medium">{q.provider}</span>
                {q.badge && (
                  <span className="text-[9px] px-[5px] py-px bg-accent text-black rounded-[2px] w-fit tracking-[0.05em] uppercase">
                    {q.badge}
                  </span>
                )}
              </div>

              {/* Destination amount */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-text">
                  {formatNumber(parseFloat(q.destinationAmount))}
                </span>
                <span className="text-[10px] text-muted">{q.currency}</span>
              </div>

              {/* Fees breakdown */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] text-text">
                  {t('quoteComparison.totalFeeAmount', { amount: q.totalFee, currency: 'USDC' })}
                </span>
                <span className="text-[10px] text-muted">
                  {t('quoteComparison.feeBreakdown', {
                    bridgeFee: q.bridgeFee,
                    payoutFee: q.payoutFee,
                  })}
                </span>
              </div>

              {/* Estimated time */}
              <span className="text-[13px] text-text">{formatTime(q.estimatedTime)}</span>

              {/* Rating */}
              <StarRating rating={q.rating} />

              {/* Selection indicator */}
              <div
                aria-hidden="true"
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  isSelected ? 'border-accent bg-accent' : 'border-line bg-transparent',
                )}
              >
                {isSelected && (
                  <span className="text-[8px] text-black leading-none">
                    {t('quoteComparison.selectedIndicator')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuoteComparison);
