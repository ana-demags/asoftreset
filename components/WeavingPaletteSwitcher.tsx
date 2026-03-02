'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import {
  WEAVING_PALETTES,
  WEAVING_PALETTE_ORDER,
  type WeavingPaletteName,
} from '@/lib/weaving';

interface WeavingPaletteSwitcherProps {
  value: WeavingPaletteName;
  onChange: (name: WeavingPaletteName) => void;
  stroke: string;
  'aria-label'?: string;
}

export default function WeavingPaletteSwitcher({
  value,
  onChange,
  stroke,
  'aria-label': ariaLabel = 'palette',
}: WeavingPaletteSwitcherProps) {
  /** Only one tooltip visible at a time: hover or focus */
  const [activePreview, setActivePreview] = useState<WeavingPaletteName | null>(null);
  const count = WEAVING_PALETTE_ORDER.length;

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-x-6 gap-y-1 pr-4">
      {WEAVING_PALETTE_ORDER.map((name, index) => {
        const palette = WEAVING_PALETTES[name];
        const showTooltip = activePreview === name;
        const isFirstOrSecond = index < 2;
        const isLast = index === count - 1;
        const positionClass = isFirstOrSecond
          ? 'left-0 translate-x-0'
          : isLast
            ? 'right-0 translate-x-0'
            : 'left-1/2 -translate-x-1/2';
        const tooltipMaxWidth = 'max-w-[min(200px,90vw)]';

        const tooltipEl = (
          <div
            role="img"
            aria-hidden
            className={`absolute bottom-full mb-1.5 px-6 py-6 rounded-full flex gap-1 items-center flex-wrap justify-center bg-white border border-black/10 shadow-md pointer-events-none transition-opacity duration-150 z-10 hidden lg:flex ${positionClass} ${tooltipMaxWidth} ${showTooltip ? 'opacity-100' : 'opacity-0'}`}
            style={{ minWidth: 'max-content' }}
          >
            {palette.colors.map((c, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: `hsl(${c.h}, ${c.s}%, ${c.l}%)` }}
              />
            ))}
          </div>
        );

        const buttonEl = (
          <Button
            variant="tab"
            selected={value === name}
            onClick={() => onChange(name)}
            onFocus={() => setActivePreview(name)}
            onBlur={() => setActivePreview(null)}
            aria-label={`${name} palette`}
          >
            {palette.name}
          </Button>
        );

        if (isLast) {
          return (
            <div
              key={name}
              className="relative shrink-0 lg:flex-1 lg:min-w-0 lg:flex lg:justify-end"
            >
              {tooltipEl}
              <div
                className="relative shrink-0"
                onMouseEnter={() => setActivePreview(name)}
                onMouseLeave={() => setActivePreview(null)}
              >
                {buttonEl}
              </div>
            </div>
          );
        }

        return (
          <div
            key={name}
            className="relative"
            onMouseEnter={() => setActivePreview(name)}
            onMouseLeave={() => setActivePreview(null)}
          >
            {tooltipEl}
            {buttonEl}
          </div>
        );
      })}
    </div>
  );
}
