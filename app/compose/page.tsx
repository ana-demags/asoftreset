'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Breadcrumb from '@/components/Breadcrumb';
import StylePicker from '@/components/StylePicker';
import type { ShapeStyle } from '@/lib/patterns';

const COMPOSE_STYLES: Record<
  ShapeStyle,
  { label: string; description: string }
> = {
  paint: {
    label: 'Paint',
    description:
      'Reach a mini flow state by coloring organic shapes.',
  },
  weave: {
    label: 'Weave',
    description:
      'Connect bands over and under to reveal patterns.',
  },
};

export default function ComposeSetupPage() {
  const router = useRouter();
  const [style, setStyle] = useState<ShapeStyle>('paint');

  useEffect(() => {
    const s = localStorage.getItem('style') as string | null;
    if (s) setStyle((s === 'blobs' ? 'paint' : s === 'weaving' ? 'weave' : s) as ShapeStyle);
  }, []);

  function saveAndStart() {
    localStorage.setItem('style', style);
    router.push(style === 'weave' ? '/compose/weave' : '/compose/paint');
  }

  return (
    <main
      className="min-h-screen flex flex-col relative z-[1] min-w-0"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <div className="flex flex-col flex-1 min-h-0 page-enter">
        <Breadcrumb
          items={[
            { label: 'home', href: '/' },
            { label: 'start', href: '/start' },
            { label: 'compose', href: '/compose' },
          ]}
          className="px-4 sm:px-6 pt-6 pb-4"
        />
        <div
          className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-start lg:justify-center gap-6 lg:gap-32 px-4 sm:px-6 pt-8 pb-6 sm:py-8 overflow-auto"
        >
          <header
          className="flex flex-col w-full max-w-lg lg:max-w-[24rem] lg:min-w-0 lg:shrink text-center lg:text-left"
        >
          <div className="flex flex-col gap-2">
            <h1 className="min-h-[1.2em]" aria-label="Compose">
              {'Compose'.split('').map((char, i) => (
                <span
                  key={i}
                  className={
                    i % 2 === 0
                      ? 'h1-compose-letter-left'
                      : 'h1-compose-letter-right'
                  }
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {char}
                </span>
              ))}
            </h1>
            <p className="text-body w-full max-w-lg mx-auto lg:mx-0 min-w-0">
              Take a moment to create without pressure.
            </p>
          </div>
          </header>
          <div className="w-full max-w-[24rem] sm:w-[24rem] sm:min-w-[24rem] lg:w-[24rem] lg:min-w-[24rem] lg:max-w-[24rem] shrink-0 flex flex-col items-center">
            <div
              className="rounded-2xl p-8 sm:p-10 w-full box-border text-center shadow-sm shrink-0 flex flex-col items-center gap-13 sm:gap-8"
              style={{
                backgroundColor: 'var(--surface-overlay)',
                color: 'var(--text)',
              }}
            >
              {/* Mobile: hug. sm+: keep spacing with gap. No fixed height. */}
              <div className="flex flex-col items-center w-full min-w-0 shrink-0">
                <StylePicker selected={style} onSelect={setStyle} />
              </div>
              <div key={style} className="flex flex-col gap-3 items-center text-center min-w-0 shrink-0 mt-8 mb-8 sm:mt-12 sm:mb-12">
                <h3 className="break-words">
                  {COMPOSE_STYLES[style].label}
                </h3>
                <p className="text-body min-w-0 break-words max-w-full">
                  {COMPOSE_STYLES[style].description}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full min-w-0 shrink-0">
                <Button onClick={saveAndStart} className="w-full">
                  Start
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
