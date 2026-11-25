import { useId } from "react";
import { Link } from "../link/link.react.tsx";
import { Signs } from "../manual/manual.react.tsx";
import { seriesPlace, type SeriesPart } from "./series-nav.ts";

export type { SeriesPart };

export interface SeriesNavProps {
  name: string;
  href: string;
  parts: readonly SeriesPart[];
  current: string;
}

// The series as a box, "Part 2 of 3", every part with this one marked and not a link, then the parts either side as signs. Renders nothing when this page is not one of the parts.
export function SeriesNav({ name, href, parts, current }: SeriesNavProps) {
  const headingId = useId();
  const { index, previous, next } = seriesPlace(parts, current);
  if (index < 0) return null;
  return (
    <nav className="cap-series" aria-labelledby={headingId}>
      <h2 className="cap-series-title" id={headingId}>
        Part {index + 1} of {parts.length}: <Link to={href}>{name}</Link>
      </h2>
      <ol className="cap-series-parts">
        {parts.map((part, i) => (
          <li key={part.href} aria-current={i === index ? "page" : undefined}>
            {i === index ? <span>{part.title}</span> : <Link to={part.href}>{part.title}</Link>}
          </li>
        ))}
      </ol>
      <Signs
        className="cap-series-steps"
        label={`Parts of ${name}`}
        prev={previous ? { ...previous, label: "Previous part" } : null}
        next={next ? { ...next, label: "Next part" } : null}
      />
    </nav>
  );
}
