'use client';

import { useRef } from 'react';
import Button from '@/components/Button';
import type { ShapeStyle } from '@/lib/patterns';

const STYLES: { value: ShapeStyle; label: string }[] = [
  { value: 'paint', label: 'paint' },
  { value: 'weave', label: 'weave' },
];

interface StylePickerProps {
  selected: ShapeStyle;
  onSelect: (style: ShapeStyle) => void;
  stroke?: string;
}

export default function StylePicker({ selected, onSelect }: StylePickerProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') !== 'tab') return;
    const i = STYLES.findIndex((_, idx) => tabRefs.current[idx] === target);
    if (i < 0) return;
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (i + 1) % STYLES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (i - 1 + STYLES.length) % STYLES.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = STYLES.length - 1;
    } else return;
    onSelect(STYLES[next].value);
    tabRefs.current[next]?.focus();
  }

  return (
    <nav
      role="tablist"
      aria-label="Compose style"
      className="flex flex-wrap gap-7 justify-center shrink-0"
      onKeyDown={handleKeyDown}
    >
      {STYLES.map(({ value, label }, idx) => (
        <Button
          key={value}
          ref={(el) => { tabRefs.current[idx] = el; }}
          variant="tab"
          selected={selected === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
}
