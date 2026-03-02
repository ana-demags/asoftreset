'use client';

import type { Palette } from '@/lib/palettes';

interface ColorPickerProps {
  palette: Palette;
  selected: string;
  onSelect: (color: string) => void;
  /** Larger swatches for touch-friendly use (e.g. in a bottom sheet) */
  size?: 'default' | 'large';
}

export default function ColorPicker({ palette, selected, onSelect, size = 'default' }: ColorPickerProps) {
  const swatchClass = size === 'large'
    ? 'w-11 h-11 rounded-full border-2 transition-transform'
    : 'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-transform';
  const gapClass = size === 'large' ? 'gap-4' : 'gap-2';

  return (
    <div role="group" aria-label="color palette" className={`flex ${gapClass} items-center`}>
      {palette.colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          aria-label={color}
          aria-pressed={selected === color}
          style={{ backgroundColor: color }}
          className={[
            swatchClass,
            selected === color
              ? 'scale-110 border-current'
              : 'border-transparent hover:scale-105',
          ].join(' ')}
        />
      ))}
    </div>
  );
}
