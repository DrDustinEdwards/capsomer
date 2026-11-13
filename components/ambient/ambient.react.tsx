import { useEffect, useRef } from "react";
import { drawHexes, pauseOffscreen, type HexOptions } from "./ambient.ts";

export interface AmbientProps extends HexOptions {
  variant: "hex-field" | "blobs" | "equalizer";
  // The equalizer only: left out under 48rem (`data-hide="phone"`).
  hideOnPhone?: boolean;
}

const SPANS = { blobs: 4, equalizer: 28, "hex-field": 0 } as const;

// The HTML contract in ambient.md, `data-cap="ambient"` included, so a page that is server-rendered
// and never hydrated still has a layer its `enhance()` finds. Always aria-hidden: it carries no
// information.
export function Ambient({ variant, count, phoneCount, random, hideOnPhone }: AmbientProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    // A layer the page's enhance() already took is left to it.
    if (!el || el.dataset.capReady !== undefined) return;
    el.dataset.capReady = "";
    // The hexagons are drawn in the browser only, into a field React leaves empty.
    if (variant === "hex-field") drawHexes(el, { count, phoneCount, random });
    const stop = pauseOffscreen(el);
    return () => {
      stop();
      delete el.dataset.capReady;
    };
  }, [variant, count, phoneCount, random]);
  return (
    <div
      ref={ref}
      className="cap-ambient"
      data-cap="ambient"
      data-variant={variant}
      data-hide={hideOnPhone && variant === "equalizer" ? "phone" : undefined}
      aria-hidden="true"
    >
      {Array.from({ length: SPANS[variant] }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
