'use client';

import Link from 'next/link';

const title = 'a soft reset';
const h1Style = {
  fontSize: 'var(--text-display)',
  lineHeight: 'var(--leading-display)',
  letterSpacing: '-0.032em',
  fontWeight: 400,
} as const;

/* Stagger delays for letter-by-letter (ms). */
function letterDelays(word: string, baseMs: number) {
  let i = 0;
  return word.split('').map(() => ({ delay: (i++ * baseMs) / 1000 }));
}

export default function DemoH1AnimationsPage() {
  const letters = title.split('');
  const delays = letterDelays(title, 80);

  return (
    <div
      className="min-h-dvh w-full py-16 px-6 sm:px-12"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="max-w-2xl mx-auto space-y-16">
        <header className="flex flex-col gap-2">
          <Link
            href="/"
            className="link-h2 text-body w-fit"
            style={{ fontSize: 'var(--text-body)' }}
          >
            ← Back to home
          </Link>
          <p
            className="text-small"
            style={{
              color: 'var(--text)',
              fontSize: 'var(--text-body-sm)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            H1 animation ideas for “a soft reset” and “Resetting” — calm and relaxing. Respects{' '}
            <code>prefers-reduced-motion</code>.
          </p>
        </header>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            1. Fade & settle
          </h2>
          <p className="text-body text-[var(--text)]">
            Gentle fade-in with a slight upward move and scale. One-shot.
          </p>
          <h1
            className="demo-h1-fade-settle whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            2. Breath (letter-spacing)
          </h2>
          <p className="text-body text-[var(--text)]">
            Slow in/out of letter-spacing, like breathing. Loops.
          </p>
          <h1
            className="demo-h1-breath-spacing whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            3. Exhale (subtle scale)
          </h2>
          <p className="text-body text-[var(--text)]">
            Very subtle scale pulse. Loops.
          </p>
          <h1
            className="demo-h1-exhale-scale whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            4. Mist clear
          </h2>
          <p className="text-body text-[var(--text)]">
            Opacity eases from soft to full. One-shot.
          </p>
          <h1
            className="demo-h1-mist-clear whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            5. Letters settle in
          </h2>
          <p className="text-body text-[var(--text)]">
            Each character fades in with a small upward drift; staggered. One-shot.
          </p>
          <h1
            className="demo-h1-letter-in whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {letters.map((char, i) => (
              <span
                key={i}
                style={{
                  animationDelay: `${delays[i].delay}s`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            6. Drift & settle
          </h2>
          <p className="text-body text-[var(--text)]">
            Whole line drifts in gently from the left and settles. One-shot.
          </p>
          <h1
            className="demo-h1-drift-settle whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            7. Reset breathe (spacing + opacity)
          </h2>
          <p className="text-body text-[var(--text)]">
            Combines gentle letter-spacing and a tiny opacity breath. Loops.
          </p>
          <h1
            className="demo-h1-reset-breathe whitespace-nowrap text-center"
            style={{ ...h1Style, color: 'var(--heading)' }}
          >
            {title}
          </h1>
        </section>

        {/* ——— "Resetting" text ideas ——— */}
        <hr style={{ borderColor: 'var(--border-subtle)', marginTop: '2rem' }} />
        <h2
          style={{
            fontFamily: 'var(--font-figtree), sans-serif',
            fontWeight: 600,
            fontSize: 'var(--text-heading-2)',
            color: 'var(--heading)',
            marginTop: '2rem',
          }}
        >
          “Resetting” text ideas
        </h2>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            R1. Resetting… (animated ellipsis)
          </h2>
          <p className="text-body text-[var(--text)]">
            The word “Resetting” plus three dots that cycle: . → .. → ... slowly. Loops.
          </p>
          <h1
            className="demo-resetting-dots demo-resetting-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            Resetting
            <span className="dot1">.</span>
            <span className="dot2">.</span>
            <span className="dot3">.</span>
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            R2. Resetting with cursor
          </h2>
          <p className="text-body text-[var(--text)]">
            Word with a soft blinking block cursor after it. Loops.
          </p>
          <h1
            className="demo-resetting-cursor demo-resetting-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            Resetting
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            R3. Blur to sharp
          </h2>
          <p className="text-body text-[var(--text)]">
            “Resetting” starts slightly blurred and eases into focus — like the mind settling. One-shot.
          </p>
          <h1
            className="demo-resetting-blur demo-resetting-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            Resetting
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            R4. Letters settle in
          </h2>
          <p className="text-body text-[var(--text)]">
            R-e-s-e-t-t-i-n-g appears one letter at a time with a gentle upward settle. One-shot.
          </p>
          <h1
            className="demo-resetting-letter-in demo-resetting-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            {'Resetting'.split('').map((char, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                {char}
              </span>
            ))}
          </h1>
        </section>

        {/* ——— "Starting over" / "Undoing" ——— */}
        <hr style={{ borderColor: 'var(--border-subtle)', marginTop: '2rem' }} />
        <h2
          style={{
            fontFamily: 'var(--font-figtree), sans-serif',
            fontWeight: 600,
            fontSize: 'var(--text-heading-2)',
            color: 'var(--heading)',
            marginTop: '2rem',
          }}
        >
          Starting over / Undoing
        </h2>
        <p
          className="text-body text-[var(--text)]"
          style={{ marginBottom: '2rem' }}
        >
          Copy and motion that hint at reset: beginning again, undoing, clearing the slate.
        </p>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            S1. Phrase crossfade
          </h2>
          <p className="text-body text-[var(--text)]">
            “a soft reset” and “starting over” take turns; slow crossfade. Loops.
          </p>
          <h1
            className="demo-starting-over-crossfade demo-starting-over-word text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            <span className="line line1">a soft reset</span>
            <span className="line line2">starting over</span>
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            S2. Rewind into place
          </h2>
          <p className="text-body text-[var(--text)]">
            “starting over” appears from the end to the start — like undoing into place. One-shot.
          </p>
          <h1
            className="demo-starting-over-rewind demo-starting-over-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            {(() => {
              const phrase = 'starting over';
              const chars = phrase.split('');
              const n = chars.length;
              return chars.map((char, i) => (
                <span key={i} style={{ animationDelay: `${((n - 1 - i) * 65) / 1000}s` }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ));
            })()}
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            S3. “starting over” — gentle settle
          </h2>
          <p className="text-body text-[var(--text)]">
            Headline on its own with a soft fade-in and slight upward settle. One-shot.
          </p>
          <h1
            className="demo-starting-over-settle demo-starting-over-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            starting over
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            S4. “undoing” — soft pulse
          </h2>
          <p className="text-body text-[var(--text)]">
            Single word with a very gentle opacity breath. Loops.
          </p>
          <h1
            className="demo-undoing-pulse demo-starting-over-word whitespace-nowrap text-center"
            style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            undoing
          </h1>
        </section>

        <section className="space-y-4">
          <h2 style={{ fontFamily: 'var(--font-figtree), sans-serif', fontWeight: 600, fontSize: 'var(--text-heading-3)' }}>
            S5. Headline + subline (static)
          </h2>
          <p className="text-body text-[var(--text)]">
            “Starting over” as h1 with a short subline that nudges the idea of undo / begin again.
          </p>
          <div className="text-center space-y-3">
            <h1
              className="demo-starting-over-word whitespace-nowrap"
              style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              starting over
            </h1>
            <p
              className="text-body"
              style={{
                color: 'var(--text)',
                fontStyle: 'italic',
                letterSpacing: 'var(--tracking-body)',
              }}
            >
              A moment to undo.
            </p>
          </div>
          <div className="text-center space-y-3 pt-6 border-t border-[var(--border-subtle)]">
            <h1
              className="demo-starting-over-word whitespace-nowrap"
              style={{ color: 'var(--heading)', fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              a soft reset
            </h1>
            <p
              className="text-body"
              style={{
                color: 'var(--text)',
                letterSpacing: 'var(--tracking-body)',
              }}
            >
              Beginning again.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
