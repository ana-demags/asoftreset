'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Breadcrumb from '@/components/Breadcrumb';

export default function StartPage() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex flex-col relative z-[1] overflow-x-hidden"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <Breadcrumb
        items={[{ label: 'home', href: '/' }, { label: 'start', href: '/start' }]}
        className="px-4 sm:px-6 pt-6 pb-2"
      />
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md sm:max-w-none flex flex-col gap-6 sm:gap-10 items-center page-enter">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center items-center">
          <Button variant="card" onClick={() => router.push('/breathe')}>
            <div className="flex flex-col gap-3 w-full text-left">
              <h2
                className="whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 'var(--text-heading-2)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                Breathe
              </h2>
              <p className="text-body opacity-80 max-w-[20rem]">
                A guided breathing practice to slow down and recenter.
              </p>
            </div>
          </Button>
          <Button variant="card" onClick={() => router.push('/compose')}>
            <div className="flex flex-col gap-3 w-full text-left">
              <h2
                className="whitespace-nowrap"
                style={{
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  fontSize: 'var(--text-heading-2)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                Compose
              </h2>
              <p className="text-body opacity-80 max-w-[20rem]">
                A rule-free yet defined space to color, weave, and rest.
              </p>
            </div>
          </Button>
        </div>
      </div>
      </div>
    </main>
  );
}
