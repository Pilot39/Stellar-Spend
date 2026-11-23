'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api/client';

const INTERVAL = 30_000;
export const QUOTE_TTL_SECONDS = INTERVAL / 1_000; // 30

export interface UseFxRateResult {
  rate: number | null;
  flash: boolean;
  secondsUntilRefresh: number;
  isStale: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useFxRate(): UseFxRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(QUOTE_TTL_SECONDS);
  const [isStale, setIsStale] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  function resetCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSecondsUntilRefresh(QUOTE_TTL_SECONDS);
    setIsStale(false);
    countdownRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          setIsStale(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
  }

  async function fetchRate() {
    if (document.visibilityState === 'hidden') return;
    try {
      const { rate: r } = await apiGet<{ rate: number }>('/api/offramp/rate', {
        cache: 'no-store',
      });
      if (!mountedRef.current) return;
      if (typeof r === 'number' && r > 0) {
        setRate(r);
        setError(null);
        setFlash(true);
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setFlash(false);
        }, 600);
        resetCountdown();
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error('Failed to fetch FX rate'));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    fetchRate();
    resetCountdown();
    timerRef.current = setInterval(fetchRate, INTERVAL);

    function onVisibility() {
      if (document.visibilityState === 'visible') fetchRate();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rate, flash, secondsUntilRefresh, isStale, isLoading, error };
}
