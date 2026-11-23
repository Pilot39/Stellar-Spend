import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import type { FeeMethod, GasFeeOptions } from './types';

const FEE_METHODS: FeeMethod[] = ['USDC', 'XLM'];

export interface FeeMethodSelectorProps {
  feeMethod: FeeMethod;
  gasFees: GasFeeOptions | null;
  isLoading: boolean;
  disabled?: boolean;
  onChange: (method: FeeMethod) => void;
}

export function FeeMethodSelector({
  feeMethod,
  gasFees,
  isLoading,
  disabled,
  onChange,
}: FeeMethodSelectorProps) {
  const buttonRefs = useRef<Record<FeeMethod, HTMLButtonElement | null>>({
    USDC: null,
    XLM: null,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % FEE_METHODS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + FEE_METHODS.length) % FEE_METHODS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = FEE_METHODS.length - 1;
    }
    const nextMethod = FEE_METHODS[nextIndex];
    onChange(nextMethod);
    buttonRefs.current[nextMethod]?.focus();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span
        id="fee-method-label"
        className="text-[10px] tracking-[0.18em] text-[#777777] uppercase"
      >
        Gas Fee Method
      </span>
      {isLoading ? (
        <div className="flex gap-2">
          <Skeleton width="50%" height={44} aria-label="Loading fee option…" />
          <Skeleton width="50%" height={44} aria-label="Loading fee option…" />
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby="fee-method-label"
          aria-disabled={disabled || undefined}
          className="flex gap-2"
        >
          {FEE_METHODS.map((m, index) => {
            const fee = m === 'USDC' ? gasFees?.usdcFee : gasFees?.xlmFee;
            const active = feeMethod === m;
            return (
              <button
                key={m}
                ref={(el) => {
                  buttonRefs.current[m] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${m} fee method`}
                tabIndex={active ? 0 : -1}
                onClick={() => onChange(m)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                disabled={disabled}
                className={cn(
                  'flex-1 py-2.5 px-3 min-h-[44px] text-xs tracking-widest border transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  active
                    ? 'border-[#c9a962] bg-[#c9a962]/10 text-[#c9a962]'
                    : 'border-[#333333] bg-[#0a0a0a] text-[#777777] hover:border-[#c9a962]/50',
                )}
              >
                <span className="block font-semibold">{m}</span>
                {fee && <span className="block text-[10px] mt-0.5 opacity-80">{fee}</span>}
              </button>
            );
          })}
        </div>
      )}
      <p id="fee-method-description" className="text-[10px] text-[#666666] leading-relaxed">
        {feeMethod === 'XLM'
          ? 'XLM will be used to cover Stellar network fees.'
          : 'A small USDC amount will be deducted to cover network fees.'}
      </p>
    </div>
  );
}
