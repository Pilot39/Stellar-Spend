'use client';

import { useToast } from '@/contexts/NotificationProvider';
import { Icon } from '@/components/Icon';
import { useTranslations } from '@/lib/i18n';

const TOAST_CLOSE_ICON_SIZE = 16;
const TOAST_CLOSE_ICON_STROKE_WIDTH = 2;

const TOAST_TYPE_STYLES: Record<string, string> = {
  success: 'bg-green-900/80 border-green-600 text-green-100',
  error: 'bg-red-900/80 border-red-600 text-red-100',
  warning: 'bg-yellow-900/80 border-yellow-600 text-yellow-100',
  default: 'bg-panel/80 border-line text-text',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const t = useTranslations();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label={t('toast.regionLabel')}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-4 py-3 rounded border min-w-[300px] max-w-[400px]
            animate-scale-in shadow-lg backdrop-blur-sm
            ${TOAST_TYPE_STYLES[toast.type] ?? TOAST_TYPE_STYLES.default}
          `}
          role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
              aria-label={t('toast.closeLabel')}
            >
              <Icon
                name="close"
                size={TOAST_CLOSE_ICON_SIZE}
                strokeWidth={TOAST_CLOSE_ICON_STROKE_WIDTH}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
