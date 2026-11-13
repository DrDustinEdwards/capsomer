import type { ReactNode } from "react";

// A marquee's HTML contract (marquee.md): the items twice, the second copy hidden and inert.
export function Marquee({
  label,
  items,
  direction,
}: {
  label: string;
  items: ReactNode[];
  direction?: "reverse";
}) {
  // The loop's length is the site's --marquee-duration (120s), set in CSS: a style attribute would
  // break style-src 'self'.
  return (
    <div className="cap-marquee" data-direction={direction}>
      <div className="cap-marquee-track">
        <ul className="cap-marquee-list" aria-label={label}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <ul className="cap-marquee-list" aria-hidden="true" inert>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The group's one visible Pause control; put it in the .cap-marquee-group with the marquees.
export function MarqueePause({ children = "Pause the logos" }: { children?: ReactNode }) {
  return (
    <label className="cap-marquee-pause">
      <input type="checkbox" />
      {children}
    </label>
  );
}
