'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROUTE_ENTER_MS = 400;
const EASE_LINEAR = 'linear';

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setMounted(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(t);
  }, [pathname]);

  const style: React.CSSProperties = reducedMotion
    ? {}
    : {
        transition: `opacity ${ROUTE_ENTER_MS}ms ${EASE_LINEAR}, transform ${ROUTE_ENTER_MS}ms ${EASE_LINEAR}`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(4px)',
      };

  return <div style={style}>{children}</div>;
}
