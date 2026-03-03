'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="min-h-dvh w-full relative flex flex-col items-center justify-center sm:block overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="flex flex-col items-center gap-8 sm:gap-10 px-10 py-12 sm:absolute sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:w-fit sm:bg-white sm:rounded-tl-[56px] sm:rounded-tr-[56px] sm:pt-20 sm:pb-[184px] sm:px-24 page-enter"
      >
        <h1
          className="h1-home-breath-subtle whitespace-nowrap text-center"
          style={{
            fontSize: 'var(--text-display)',
            lineHeight: 'var(--leading-display)',
            letterSpacing: '-0.032em',
            fontWeight: 400,
          }}
        >
          a soft reset
        </h1>
        <div className="w-full max-w-xl min-w-0 flex flex-col items-center gap-8 sm:gap-10">
          <p
            className="text-center w-full"
            style={{
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Take a moment to welcome a sense of calm. Lean on short breathing exercises and puzzles designed to ease the mind.
          </p>
          <div className="flex flex-row gap-4 w-full justify-center">
            <Button variant="secondary" onClick={() => router.push('/about')}>
              About
            </Button>
            <Button onClick={() => router.push('/start')}>
              Unwind
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
