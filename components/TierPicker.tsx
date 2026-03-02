'use client';

import Button from '@/components/Button';

export const TIERS = [
  { value: 5,  label: '5 min',  count: 12 },
  { value: 10, label: '10 min', count: 22 },
  { value: 15, label: '15 min', count: 34 },
] as const;

export type Tier = (typeof TIERS)[number]['value'];

interface TierPickerProps {
  selected: Tier;
  onSelect: (tier: Tier) => void;
  stroke?: string;
}

export default function TierPicker({ selected, onSelect }: TierPickerProps) {
  return (
    <nav
      role="tablist"
      aria-label="Session length"
      className="flex flex-wrap gap-7 justify-center shrink-0"
    >
      {TIERS.map(({ value, label }) => (
        <Button
          key={value}
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
