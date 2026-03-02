'use client';

import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

const pairings = [
  {
    id: 'geist',
    name: 'Gambarino + Geist',
    bodyFont: 'var(--font-geist-sans)',
    description:
      'Quiet and unobtrusive. Stays in the background so Gambarino and the content lead; good for a minimal, restful feel.',
  },
  {
    id: 'inter',
    name: 'Gambarino + Inter',
    bodyFont: 'var(--font-inter)',
    description:
      'Open source, designed for screens. Neutral and highly readable with a soft, refined tone—close sibling to Geist in spirit.',
  },
  {
    id: 'dm-sans',
    name: 'Gambarino + DM Sans',
    bodyFont: 'var(--font-dm-sans)',
    description:
      'Warm and approachable without being soft. Supports a gentle, mindful tone and stays easy to read at length.',
  },
  {
    id: 'plus-jakarta-sans',
    name: 'Gambarino + Plus Jakarta Sans',
    bodyFont: 'var(--font-plus-jakarta-sans)',
    description:
      'Refined, premium sans with a modern editorial feel. Clean proportions and subtle character; reads high-end without shouting.',
  },
  {
    id: 'sora',
    name: 'Gambarino + Sora',
    bodyFont: 'var(--font-sora)',
    description:
      'Geometric and polished. Minimal, tech-forward sans with a sophisticated look—in the same high-end lane as Geist and Inter.',
  },
] as const;

export default function TypescalePage() {
  return (
    <main
      className="min-h-screen flex flex-col relative z-[1]"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <Breadcrumb
        items={[{ label: 'home', href: '/' }, { label: 'typescale', href: '/typescale' }]}
        className="px-6 pt-6 pb-2"
      />
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-16 flex-1 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1
            className="tracking-tight"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-heading-1)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Typescale
          </h1>
          <p
            style={{
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Gambarino for display & headings · pairings for body text below
          </p>
        </header>

        <section className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Display · clamp(3rem, 18vw, 16rem) · 256px max · --text-display
            </span>
            <p
              className="tracking-tight"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-display)',
                lineHeight: 'var(--leading-display)',
                color: 'var(--heading)',
              }}
            >
              The quick brown fox
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Heading 1 · 6rem · --text-heading-1
            </span>
            <h1
              className="tracking-tight"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-heading-1)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Heading 2 · 4rem · --text-heading-2
            </span>
            <h2
              className="tracking-tight"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-heading-2)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Heading 3 · 2.5rem · --text-heading-3
            </span>
            <h3
              className="tracking-tight"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-heading-3)',
                lineHeight: 'var(--leading-tight)',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Body · 1.5rem (24px) · --text-body
            </span>
            <p
              style={{
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-body)',
              }}
            >
              The quick brown fox jumps over the lazy dog. Body text uses a
              comfortable line height so longer passages stay readable. Use this
              size for paragraphs, lists, and descriptions.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="opacity-50 uppercase tracking-widest"
              style={{ fontSize: '0.75rem' }}
            >
              Body small · 1.25rem (20px) · --text-body-sm
            </span>
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                lineHeight: 'var(--leading-body)',
              }}
            >
              The quick brown fox jumps over the lazy dog. Smaller body text for
              captions, labels, and secondary content. Still readable at 20px.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-14">
          <h2
            className="tracking-tight"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-heading-2)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            Pairings for calm
          </h2>
          <p
            style={{
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-body)',
              opacity: 0.8,
            }}
          >
            Headings stay in Gambarino; body text uses a sans that supports
            relaxation and mindfulness. Geist and Inter lead; the rest are
            similarly high-end—refined, readable, polished sans serifs.
          </p>
          {pairings.map((pairing) => (
            <article
              key={pairing.id}
              className="flex flex-col gap-4 pb-14 border-b border-[var(--foreground)]/10 last:border-0 last:pb-0"
            >
              <span
                className="opacity-50 uppercase tracking-widest"
                style={{ fontSize: '0.75rem', fontFamily: pairing.bodyFont }}
              >
                {pairing.name}
              </span>
              <h3
                className="tracking-tight"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--text-heading-3)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                The quick brown fox jumps over the lazy dog
              </h3>
              <p
                style={{
                  fontFamily: pairing.bodyFont,
                  fontSize: 'var(--text-body)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                {pairing.description} Sample body in this pairing: The quick
                brown fox jumps over the lazy dog. Notice how it feels next to
                Gambarino—whether it supports a calm, unhurried read.
              </p>
              <p
                style={{
                  fontFamily: pairing.bodyFont,
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                Smaller body (--text-body-sm). Captions and secondary content
                stay in the same sans for a consistent, restful spread.
              </p>
            </article>
          ))}
        </section>

        <p
          className="pt-8 border-t border-[var(--foreground)]/10"
          style={{
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-body)',
            opacity: 0.6,
          }}
        >
          <Link href="/" className="underline hover:no-underline">
            Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
