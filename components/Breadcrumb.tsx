'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/** Breadcrumb link: underline on hover and focus; clear focus ring. */
const linkClass =
  'text-body text-inherit no-underline transition-opacity duration-150 hover:opacity-70 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--foreground)] focus-visible:opacity-100 focus-visible:underline';
/** Current page: always underlined to show active. */
const currentClass = 'underline';
const separatorClass = 'text-body opacity-50 select-none';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Optional class for the nav wrapper (e.g. padding). */
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`shrink-0 ${className}`}
    >
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1"
        style={{
          fontSize: 'var(--text-body)',
          lineHeight: 'var(--leading-body)',
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href + i} className="flex items-center gap-x-2">
              {i > 0 && <span className={separatorClass} aria-hidden>/</span>}
              {isLast ? (
                <span aria-current="page" className={currentClass}>{item.label}</span>
              ) : (
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
