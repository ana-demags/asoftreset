'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen w-full relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-fit bg-white rounded-tl-[56px] rounded-tr-[56px] shadow-sm flex flex-col items-center gap-10 pt-20 pb-40 px-24 page-enter"
      >
        <h1
          className="whitespace-nowrap text-center"
          style={{
            fontSize: 'var(--text-display)',
            lineHeight: 'var(--leading-display)',
            letterSpacing: '-0.032em',
            fontWeight: 400,
          }}
        >
          a soft reset
        </h1>
        <p
          className="text-center max-w-lg"
          style={{
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-body)',
          }}
        >
          Take a moment to welcome a sense of calm. Lean on short breathing exercises and puzzles designed to ease the mind.
        </p>
        <Button onClick={() => router.push('/start')}>
          Unwind
        </Button>
      </div>
    </div>
  );
}
