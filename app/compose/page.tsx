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
      'Connect horizontal bands over and under to reveal patterns.',
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
      <Breadcrumb
        items={[
          { label: 'home', href: '/' },
          { label: 'start', href: '/start' },
          { label: 'compose', href: '/compose' },
        ]}
        className="px-4 sm:px-6 pt-6 pb-2"
      />
      <div
        className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-32 px-4 sm:px-6 py-6 sm:py-8 overflow-auto"
      >
        <header
          className="flex flex-col w-full max-w-lg lg:max-w-[24rem] lg:min-w-0 lg:shrink text-center lg:text-left"
        >
          <div className="flex flex-col gap-4">
            <h1>Compose</h1>
            <p className="text-body w-full max-w-lg opacity-80 mx-auto lg:mx-0 min-w-0">
              Paint fills flowing shapes with color. Weave threads bands over and under. Take a worry-free moment to create without pressure.
            </p>
          </div>
        </header>
        <div
          className="rounded-2xl p-6 sm:p-10 flex flex-col items-center w-full max-w-[24rem] min-w-0 lg:w-[24rem] lg:min-w-[24rem] lg:max-w-[24rem] lg:shrink-0 box-border text-center shadow-sm"
          style={{
            backgroundColor: 'var(--surface-overlay)',
            color: 'var(--text)',
          }}
        >
          <div
            className="relative w-full min-h-[calc(2rem+0.75rem+19rem)] flex flex-col items-center gap-0"
          >
            <StylePicker selected={style} onSelect={setStyle} />

            <div className="flex flex-col gap-3 items-center text-center min-w-0 flex-1 justify-center min-h-0 py-8">
              <div key={style} className="flex flex-col gap-3 items-center text-center min-w-0 page-enter">
                <h3 className="break-words">
                  {COMPOSE_STYLES[style].label}
                </h3>
                <p className="text-body min-w-0 opacity-80 break-words max-w-full">
                  {COMPOSE_STYLES[style].description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full min-w-0">
            <Button onClick={saveAndStart} className="w-full">
              Start
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
