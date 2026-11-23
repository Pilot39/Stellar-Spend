'use client';

import { useEffect, useCallback } from 'react';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/contexts/NotificationProvider';
import { Icon } from '@/components/Icon';
import { useTranslations } from '@/hooks/useTranslations';

/** Icon size (px) used for the copy/copy-check glyphs. */
const COPY_ICON_SIZE = 14;

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  /** Optional keyboard shortcut (e.g. "c" triggers on Ctrl+Shift+C / Cmd+Shift+C) */
  keyboardShortcut?: string;
  /** When true, only the icon is rendered (label is still exposed to assistive tech) */
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label,
  className = '',
  keyboardShortcut,
  iconOnly = false,
}: CopyButtonProps) {
  const { isCopied, copy } = useClipboard();
  const { showToast } = useToast();
  const { t } = useTranslations();

  const resolvedLabel = label ?? t('copyButton.label');

  const handleCopy = useCallback(async () => {
    const success = await copy(text);
    if (success) {
      showToast(t('copyButton.success'), 'success');
    } else {
      showToast(t('copyButton.error'), 'error');
    }
  }, [copy, text, showToast]);

  // Register optional keyboard shortcut (Ctrl/Cmd + Shift + key)
  useEffect(() => {
    if (!keyboardShortcut) return;

    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.shiftKey && e.key.toLowerCase() === keyboardShortcut.toLowerCase()) {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardShortcut, handleCopy]);

  const accessibleLabel = isCopied
    ? t('copyButton.copiedAria')
    : t('copyButton.ariaLabel', { label: resolvedLabel, text });

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs border border-line hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors rounded ${className}`}
      aria-label={accessibleLabel}
      title={
        isCopied
          ? t('copyButton.copiedAria')
          : keyboardShortcut
            ? t('copyButton.titleWithShortcut', {
                shortcut: keyboardShortcut.toUpperCase(),
              })
            : t('copyButton.title')
      }
    >
      {isCopied ? (
        <Icon name="copy-check" size={COPY_ICON_SIZE} className="text-accent" aria-hidden="true" />
      ) : (
        <Icon name="copy" size={COPY_ICON_SIZE} aria-hidden="true" />
      )}
      {!iconOnly && (
        <span aria-hidden="true">{isCopied ? t('copyButton.copied') : resolvedLabel}</span>
      )}
    </button>
  );
}
