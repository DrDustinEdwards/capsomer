// The count-up: a figure that counts from zero to its value when it arrives, over 600ms with a
// cubic ease out. The server renders the final figure, so the page reads right before any script
// runs, and a reader who asks for reduced motion sees it still. Text only changes; nothing moves.

import { reducedMotion } from "../hooks/hooks.ts";
import { ratio } from "../meter/meter.ts";

export const DURATION_MS = 600;

export function easeOutCubic(t: number): number {
  const x = ratio(t, 1);
  return 1 - Math.pow(1 - x, 3);
}

// Calls onProgress with 0..1 (eased) on each frame until done. Returns a function that stops it.
export function countUp(
  onProgress: (progress: number) => void,
  duration = DURATION_MS,
): () => void {
  if (reducedMotion()) {
    onProgress(1);
    return () => undefined;
  }
  let frame = 0;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    onProgress(easeOutCubic(t));
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

// The figure's words: an Intl.NumberFormat from data-currency and data-decimals.
export function formatter(el: HTMLElement): (n: number) => string {
  const currency = el.dataset.currency;
  const decimals = Number(el.dataset.decimals ?? 0);
  const f = new Intl.NumberFormat(el.lang || document.documentElement.lang || "en-US", {
    ...(currency ? { style: "currency", currency } : {}),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (n) => f.format(n);
}

// A page with no React: every [data-cap="count-up"] with data-value counts up once it is seen.
export function enhance(root: ParentNode = document): () => void {
  const stops: Array<() => void> = [];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const to = Number(el.dataset.value);
      const format = formatter(el);
      stops.push(countUp((p) => (el.textContent = format(to * p))));
    }
  });
  for (const el of root.querySelectorAll<HTMLElement>(
    '[data-cap="count-up"][data-value]:not([data-cap-ready])',
  )) {
    if (!Number.isFinite(Number(el.dataset.value))) continue;
    el.dataset.capReady = "";
    io.observe(el);
  }
  return () => {
    io.disconnect();
    stops.forEach((f) => f());
  };
}
