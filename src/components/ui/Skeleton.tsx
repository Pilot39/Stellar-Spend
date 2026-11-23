/**
 * Shared skeleton primitive.
 *
 * Single parametrized shimmer block used across features. Supports size
 * (width/height) and shape (radius) props so feature-specific skeleton
 * markup can be replaced by this one primitive.
 *
 * This is the single shimmer implementation for the app. It reuses the
 * `.skeleton` CSS class (from SkeletonBase) when available and falls back to
 * the Tailwind `animate-pulse bg-muted` utilities, so both styling systems
 * render consistently.
 *
 * Accessibility mirrors the previous SkeletonBase behavior: the block is
 * announced as a busy status region by default, and can be hidden from
 * assistive tech via `aria-hidden` when it is purely decorative.
 */
import { cn } from '@/lib/utils';

export type SkeletonShape = 'line' | 'circle' | 'rect';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset shape controlling the border radius. */
  shape?: SkeletonShape;
  /** Explicit width (number is treated as px). */
  width?: number | string;
  /** Explicit height (number is treated as px). */
  height?: number | string;
  /**
   * Accessible label for the loading region. When provided the skeleton is
   * exposed as a busy status region; when omitted it is treated as decorative
   * and hidden from assistive technology.
   */
  label?: string;
  /** Force the element to be hidden from assistive technology. */
  'aria-hidden'?: boolean | 'true' | 'false';
}

const shapeClasses: Record<SkeletonShape, string> = {
  line: 'rounded',
  circle: 'rounded-full',
  rect: 'rounded-md',
};

function toCssSize(value?: number | string): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function Skeleton({
  shape = 'rect',
  width,
  height,
  label,
  className,
  style,
  'aria-hidden': ariaHidden,
  ...props
}: SkeletonProps) {
  const isDecorative = ariaHidden === true || ariaHidden === 'true' || !label;

  return (
    <div
      role={isDecorative ? undefined : 'status'}
      aria-busy={isDecorative ? undefined : true}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : label}
      className={cn(
        'skeleton animate-pulse bg-muted',
        shapeClasses[shape],
        className,
      )}
      style={{ width: toCssSize(width), height: toCssSize(height), ...style }}
      {...props}
    />
  );
}

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short heading describing the empty state. */
  title?: React.ReactNode;
  /** Supporting copy explaining why the state is empty or what to do next. */
  description?: React.ReactNode;
  /** Optional leading icon/illustration. */
  icon?: React.ReactNode;
  /** Optional call-to-action rendered below the copy. */
  action?: React.ReactNode;
}

/**
 * Shared empty-state primitive. Renders a centered icon, title, description
 * and optional action. Used to replace one-off empty-state markup across
 * features.
 */
export function Empty({
  title,
  description,
  icon,
  action,
  className,
  children,
  ...props
}: EmptyProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div aria-hidden="true" className="text-muted-foreground">
          {icon}
        </div>
      ) : null}
      {title ? (
        <p className="text-sm font-medium text-foreground">{title}</p>
      ) : null}
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
</｜｜DSML｜｜ parameter>