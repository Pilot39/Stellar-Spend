'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /** Element that should receive focus when the trap activates. Defaults to the first focusable element. */
  initialFocusRef?: { current: HTMLElement | null };
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void;
  /** Restore focus to the previously focused element when the trap deactivates. Defaults to true. */
  restoreFocus?: boolean;
}

export interface UseFocusTrapResult {
  /** Whether the trap is currently active. */
  isActive: boolean;
  /** Returns the focusable elements currently inside the container. */
  getFocusableElements: () => HTMLElement[];
}

/**
 * Traps keyboard focus within `ref` while `active` is true.
 * Tab/Shift+Tab wrap around within the container, Escape invokes `onEscape`,
 * and focus is optionally restored to the previously focused element on close.
 */
export function useFocusTrap(
  ref: { current: HTMLElement | null },
  active: boolean,
  options: UseFocusTrapOptions = {},
): UseFocusTrapResult {
  const { initialFocusRef, onEscape, restoreFocus = true } = options;
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const getFocusableElements = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const initial = initialFocusRef?.current ?? getFocusableElements()[0] ?? el;
    initial.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => {
      el.removeEventListener('keydown', onKeyDown);
      if (restoreFocus && previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [ref, active, initialFocusRef, restoreFocus]);

  return {
    isActive: active,
    getFocusableElements: () => {
      const el = ref.current;
      if (!el) return [];
      return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    },
  };
}

/**
 * Restores focus to the element that was focused when `active` became true,
 * once `active` goes back to false (e.g. when a modal closes).
 */
export function useFocusRestore(active: boolean): void {
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (active) {
      triggerRef.current = document.activeElement;
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [active]);
}
