import { useId, type ReactNode } from "react";

/** One work that cites this one, as a scholarly index reports it. Every field but the title may be missing. */
export interface CitingWork {
  title: string | null;
  // A bare DOI name ("10.5555/example"), linked through doi.org. `href` wins when both are given.
  doi?: string | null;
  href?: string | null;
  venue?: string | null;
  year?: number | string | null;
}

/** "Cited by 40", or "Cited by 25 of 40" when the list holds fewer than the count. */
export function citedByHeading(total: number, shown: number): string {
  return total > shown ? `Cited by ${shown} of ${total}` : `Cited by ${total}`;
}

const workHref = (w: CitingWork) => w.href ?? (w.doi ? `https://doi.org/${w.doi}` : null);

export interface CitedByCountProps {
  // The count the index reports. Below 1 nothing is drawn: a cold cache must not look like a measured zero.
  count: number | null | undefined;
  // The index's page of citing works, when there is one.
  href?: string | null;
  // Where the count comes from and when it was read: "OpenAlex", "2026-11-01" or a Time.
  source: string;
  readAt?: ReactNode;
}

// The one-line count near a record's head: "Cited by 12  OpenAlex, read 2026-11-01".
export function CitedByCount({ count, href, source, readAt }: CitedByCountProps) {
  if (typeof count !== "number" || !(count >= 1)) return null;
  const words = `Cited by ${count}`;
  return (
    <p className="cap-cited-by-count">
      {href ? <a href={href}>{words}</a> : words}{" "}
      <span className="cap-cited-by-source">
        {source}, read {readAt ?? "an unrecorded date"}
      </span>
    </p>
  );
}

export interface CitedByProps {
  // The true count, which may be more than `works` holds.
  total: number;
  works: readonly CitingWork[];
  source: string;
  readAt?: ReactNode;
  // How the list is ordered, said after the source: "Newest first."
  order?: string;
  headingLevel?: 2 | 3 | 4;
}

// The list of works that cite a record, under a heading that gives the count, with where the list
// came from and when. Nothing is drawn for an empty list.
export function CitedBy({ total, works, source, readAt, order, headingLevel = 2 }: CitedByProps) {
  const id = useId();
  if (works.length === 0) return null;
  const H = `h${headingLevel}` as const;
  return (
    <section className="cap-cited-by" aria-labelledby={id}>
      <H className="cap-cited-by-title" id={id}>
        {citedByHeading(total, works.length)}
      </H>
      <p className="cap-cited-by-source">
        {source}, read {readAt ?? "an unrecorded date"}.{order ? ` ${order}` : ""}
      </p>
      <ol className="cap-cited-by-list">
        {works.map((w, i) => {
          const href = workHref(w);
          const title = w.title ?? w.doi ?? "Untitled";
          return (
            <li key={`${href ?? title}-${i}`}>
              {href ? <a href={href}>{title}</a> : title}
              {w.venue ? <span className="cap-cited-by-source">, {w.venue}</span> : null}
              {w.year ? <span className="cap-cited-by-source">, {w.year}</span> : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
