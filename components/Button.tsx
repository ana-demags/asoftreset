'use client';

import { forwardRef } from 'react';

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--foreground)]';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'card'
  | 'tab'
  | 'toggle'
  | 'toggle-pill';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  /** For tab, toggle, toggle-pill: visual selected state and aria-pressed */
  selected?: boolean;
  /** For toggle/toggle-pill: text and border color (e.g. var(--text) or pal.stroke) */
  stroke?: string;
  /** Ghost/toggle size: body (default) or small */
  size?: 'body' | 'small';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    selected = false,
    stroke = 'var(--text)',
    size = 'body',
    className = '',
    style,
    children,
    ...rest
  },
  ref
) {
  const baseClass = 'cursor-pointer transition-all duration-200 ease-out motion-reduce:transition-none';

  /** Button label text: typescale (body / body-sm) + medium weight. Single source of truth for all variants. */
  const labelStyle = {
    fontSize: 'var(--text-body)',
    lineHeight: 'var(--leading-body)',
    letterSpacing: 'var(--tracking-body)',
    fontWeight: 500,
  } as const;
  const labelStyleSmall = {
    fontSize: 'var(--text-small)',
    lineHeight: 'var(--leading-body)',
    letterSpacing: 'var(--tracking-body)',
    fontWeight: 500,
  } as const;

  if (variant === 'primary') {
    return (
      <button
        ref={ref}
        type="button"
        className={`h-16 px-12 rounded-full transition-opacity hover:opacity-90 ${focusRing} ${baseClass} ${className}`}
        style={{
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)',
          ...labelStyle,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        ref={ref}
        type="button"
        className={`h-16 px-12 rounded-full border transition-opacity hover:opacity-70 ${focusRing} ${baseClass} ${className}`}
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text)',
          ...labelStyle,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        ref={ref}
        type="button"
        className={`transition-opacity hover:opacity-70 ${focusRing} ${baseClass} ${className}`}
        style={{
          color: 'var(--text)',
          ...(size === 'small' ? labelStyleSmall : labelStyle),
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <button
        ref={ref}
        type="button"
        className={`h-[480px] w-[400px] flex flex-col justify-end items-start rounded-2xl p-6 shadow-sm hover:scale-[1.02] hover:shadow-lg motion-reduce:hover:scale-100 motion-reduce:hover:shadow-none ${focusRing} ${baseClass} ${className}`}
        style={{
          backgroundColor: 'var(--surface-overlay)',
          color: 'var(--text)',
          ...labelStyle,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'tab') {
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={selected}
        className={`whitespace-nowrap transition-colors ${focusRing} ${baseClass} ${selected ? 'underline underline-offset-2' : ''} hover:underline hover:underline-offset-2 ${className}`}
        style={{
          ...labelStyle,
          color: 'var(--text)',
          textDecorationColor: 'var(--text)',
          opacity: selected ? 1 : 0.5,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={`transition-opacity hover:opacity-80 min-h-[34px] px-1 -mx-1 rounded ${focusRing} ${baseClass} ${className}`}
        style={{
          ...labelStyle,
          color: stroke,
          opacity: selected ? 1 : 0.55,
          textDecoration: selected ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  if (variant === 'toggle-pill') {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={`px-3 h-8 rounded-full border transition-all hover:opacity-80 ${focusRing} ${baseClass} ${className}`}
        style={
          selected
            ? { color: stroke, borderColor: stroke, ...labelStyle, ...style }
            : { color: stroke, borderColor: 'transparent', opacity: 0.5, ...labelStyle, ...style }
        }
        {...rest}
      >
        {children}
      </button>
    );
  }

  return null;
});

export default Button;
