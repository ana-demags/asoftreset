import Breadcrumb from '@/components/Breadcrumb';

export default function AboutPage() {
  return (
    <main
      className="min-h-screen flex flex-col relative z-[1]"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <Breadcrumb
        items={[{ label: 'home', href: '/' }, { label: 'about', href: '/about' }]}
        className="px-6 sm:px-12 pt-6 pb-2"
      />
      <div className="flex-1 flex items-center justify-center px-6 pt-6 pb-12 sm:py-12">
        <div className="w-full max-w-2xl flex flex-col page-enter">

          <h1
            className="mb-8"
            style={{
              fontSize: 'var(--text-heading-1)',
              lineHeight: 'var(--leading-display)',
              letterSpacing: '-0.032em',
              fontWeight: 400,
            }}
          >
            A note on the why
          </h1>

          <div className="flex flex-col gap-8 mb-8">
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>
            This was made by someone who needed it too. It’s a small, intentional space, built for moments when the noise gets loud and you need somewhere quiet to land. A one-minute breathing exercise. A pattern to follow. Nothing to worry about or get right. It’s what I kept coming back to when my thoughts needed a gentle place to go. I hope it offers you that same gentleness.            </p>

          </div>

          <div className="flex flex-col gap-1">
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>With care,</p>
            <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}>Ana</p>
          </div>

        </div>
      </div>
    </main>
  );
}
