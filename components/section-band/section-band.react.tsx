import type { ReactNode } from "react";

export interface SectionBandProps {
  children: ReactNode;
  // "slant": diagonal top and bottom edges with a translucent wedge along each.
  cut?: "slant";
  // Pull the band over its neighbours by the slant's depth.
  overlap?: boolean;
  id?: string;
  label?: string;
}

// The HTML contract in section-band.md.
export function SectionBand({ children, cut, overlap, id, label }: SectionBandProps) {
  return (
    <section
      className="cap-section-band"
      data-cut={cut}
      data-overlap={overlap ? "" : undefined}
      id={id}
      aria-label={label}
    >
      {children}
    </section>
  );
}
