import { useEffect, useRef } from "react";
import { drawHexes, pauseOffscreen, type HexOptions } from "./ambient.ts";

export interface AmbientProps extends HexOptions {
  variant: "hex-field" | "blobs" | "equalizer";
}

const SPANS = { blobs: 4, equalizer: 28, "hex-field": 0 } as const;

// The HTML contract in ambient.md. Always aria-hidden: it carries no information.
export function Ambient({ variant, count, phoneCount, random }: AmbientProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The hexagons are drawn in the browser only, into a field React leaves empty.
    if (variant === "hex-field") drawHexes(el, { count, phoneCount, random });
    return pauseOffscreen(el);
  }, [variant, count, phoneCount, random]);
  return (
    <div ref={ref} className="cap-ambient" data-variant={variant} data-cap-ready="" aria-hidden="true">
      {Array.from({ length: SPANS[variant] }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
