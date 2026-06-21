import { useEffect, useRef, useState } from 'react';
import { Txt } from './ui';

/**
 * Counts up to `value` with an ease-out, re-animating whenever it changes (so a
 * new win makes the streak tick upward). Pure RAF — works identically on web and
 * native, no animated-text hacks. Starts from 0 on first appearance for delight.
 */
export function AnimatedNumber({
  value,
  variant = 'display',
  className,
  duration = 750,
}: {
  value: number;
  variant?: 'display' | 'displaySm' | 'title';
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let start: number | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      setDisplay(Math.round(from + (to - from) * easeOutCubic(t)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <Txt variant={variant} className={className}>
      {String(display)}
    </Txt>
  );
}
