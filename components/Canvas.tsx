'use client';

import { forwardRef, useEffect, useRef } from 'react';

interface CanvasProps {
  onResize?: (width: number, height: number) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLCanvasElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLCanvasElement>) => void;
  /** Set to 0 to include canvas in tab order for keyboard access */
  tabIndex?: number;
  /** When true, focus ring is shown (keyboard users only) */
  keyboardModality?: boolean;
  /** When true, no outline ring (e.g. weaving uses dashed bar as focus indicator) */
  hideFocusRing?: boolean;
  canvasStyle?: React.CSSProperties;
  className?: string;
  'aria-label'?: string;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ onResize, onPointerDown, onPointerUp, onKeyDown, onFocus, onBlur, tabIndex, keyboardModality, hideFocusRing, canvasStyle, className, 'aria-label': ariaLabel }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (ref && 'current' in ref && ref.current) {
            const dpr = window.devicePixelRatio || 1;
            ref.current.width = Math.round(width * dpr);
            ref.current.height = Math.round(height * dpr);
            ref.current.style.width = `${width}px`;
            ref.current.style.height = `${height}px`;
          }
          onResize?.(width, height);
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, [onResize, ref]);

    const isFocusable = tabIndex === 0;
    return (
      <div
        ref={containerRef}
        className={[className, isFocusable ? 'focusable-canvas' : '', keyboardModality ? 'keyboard-modality' : '', hideFocusRing ? 'hide-focus-ring' : ''].filter(Boolean).join(' ')}
        style={{ width: '100%', height: '100%' }}
      >
        <canvas
          ref={ref}
          aria-label={ariaLabel}
          tabIndex={tabIndex}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          style={canvasStyle}
        />
      </div>
    );
  },
);

Canvas.displayName = 'Canvas';
export default Canvas;
