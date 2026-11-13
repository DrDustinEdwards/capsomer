import { Children, useEffect, useRef, type ReactNode } from "react";
import { attach, partsOf } from "./carousel.ts";

// The carousel's HTML contract (carousel.md), wired by carousel.ts once mounted. Each child is one
// slide. The server renders the first slide in view, every slide's label and every marker, so the
// track scrolls and snaps before hydration.
export function Carousel({
  label,
  slideLabel = (n, total) => `${n} of ${total}`,
  markerLabel = (n) => `Go to slide ${n}`,
  status,
  prevLabel = "Previous slide",
  nextLabel = "Next slide",
  trackLabel = "Slides",
  perView,
  peek,
  loop = true,
  children,
}: {
  label: string;
  slideLabel?: (n: number, total: number) => string;
  markerLabel?: (n: number) => string;
  status?: string;
  prevLabel?: string;
  nextLabel?: string;
  trackLabel?: string;
  perView?: 2 | 3;
  peek?: boolean;
  loop?: boolean;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const slides = Children.toArray(children);
  useEffect(() => {
    const parts = root.current && partsOf(root.current);
    return parts ? attach(parts) : undefined;
  }, [slides.length]);

  return (
    <section
      ref={root}
      className="cap-carousel"
      aria-roledescription="carousel"
      aria-label={label}
      data-per-view={perView}
      data-peek={peek ? "" : undefined}
      data-loop={loop ? undefined : "off"}
      data-cap-status={status}
    >
      <div className="cap-carousel-viewport">
        <div className="cap-carousel-controls">
          <button type="button" data-cap-dir="prev" aria-label={prevLabel}>
            <Chevron back />
          </button>
          <button type="button" data-cap-dir="next" aria-label={nextLabel}>
            <Chevron />
          </button>
        </div>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region takes focus so the keyboard can scroll it (WCAG 2.1.1). */}
        <div className="cap-carousel-track" tabIndex={0} role="group" aria-label={trackLabel}>
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={slideLabel(i + 1, slides.length)}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      <p className="cap-carousel-status cap-sr-only" role="status" aria-live="polite" />
      <nav className="cap-carousel-markers" aria-label={`Choose a slide: ${label}`}>
        {slides.map((_, i) => (
          <button key={i} type="button" aria-label={markerLabel(i + 1)} aria-current={i === 0} />
        ))}
      </nav>
    </section>
  );
}

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={back ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
    </svg>
  );
}
