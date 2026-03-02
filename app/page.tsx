'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12 relative z-[1] overflow-x-hidden"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <div className="w-full max-w-lg flex flex-col gap-10 items-center page-enter">
        <h1
          className="tracking-tight whitespace-nowrap text-center"
          style={{
            fontSize: 'var(--text-display)',
            lineHeight: 'var(--leading-display)',
          }}
        >
          asoftreset
        </h1>
        <p
          className="text-center max-w-md"
          style={{
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-body)',
          }}
        >
          Guided breathing and calming pattern activites designed to help you find flow and unwind.
        </p>
        <Button onClick={() => router.push('/start')}>
          Get started
        </Button>
      </div>
    </main>
  );
}
