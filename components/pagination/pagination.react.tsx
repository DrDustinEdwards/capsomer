import { pageItems, statusText } from "./pagination.ts";

export interface PaginationProps {
  page: number;
  pageCount: number;
  // Links (server-rendered): the address of a page. Without it the pager is buttons and
  // onPageChange says which page was chosen.
  hrefFor?: (page: number) => string;
  onPageChange?: (page: number) => void;
  // With both, the "Showing 21 to 40 of 312 posts" line is shown.
  total?: number;
  perPage?: number;
  // What the items are, in the plural: "posts".
  noun?: string;
  // Newer and Older for a newest-first list.
  prevLabel?: string;
  nextLabel?: string;
  label?: string;
}

// The HTML contract in pagination.md. One page or none renders nothing: there is nowhere to go.
export function Pagination({ page, pageCount, hrefFor, onPageChange, total, perPage, noun = "items", prevLabel = "Previous", nextLabel = "Next", label = "Pagination" }: PaginationProps) {
  if (pageCount <= 1) return null;
  const links = typeof hrefFor === "function";
  const control = (to: number, className: string, content: string, extra: { kind?: "prev" | "next"; current?: boolean; name?: string; rel?: string }) => {
    const common = {
      className,
      "data-kind": extra.kind,
      "aria-label": extra.name,
      "aria-current": extra.current ? ("page" as const) : undefined,
    };
    const off = !extra.current && (to < 1 || to > pageCount);
    if (links) {
      return off ? (
        <a {...common} role="link" aria-disabled="true">
          {content}
        </a>
      ) : (
        <a {...common} href={hrefFor(to)} rel={extra.rel}>
          {content}
        </a>
      );
    }
    return (
      <button type="button" {...common} aria-disabled={off ? true : undefined} onClick={() => (!off && !extra.current ? onPageChange?.(to) : undefined)}>
        {content}
      </button>
    );
  };
  return (
    <nav className="cap-pagination" aria-label={label}>
      {perPage && total != null ? (
        <p className="cap-pagination-status" role={links ? undefined : "status"}>
          {statusText(page, perPage, total, noun)}
        </p>
      ) : null}
      <ul className="cap-pagination-list">
        <li key="prev">{control(page - 1, "cap-page", prevLabel, { kind: "prev", rel: "prev" })}</li>
        {pageItems(page, pageCount).map((it) =>
          typeof it === "number" ? (
            <li className="cap-pagination-num" key={it}>
              {control(it, "cap-page", String(it), { current: it === page, name: `Page ${it}` })}
            </li>
          ) : (
            <li className="cap-pagination-num" key={it}>
              <span className="cap-page-gap">
                <span aria-hidden="true">{"…"}</span>
                <span className="cap-sr-only">More pages</span>
              </span>
            </li>
          ),
        )}
        <li className="cap-pagination-where" key="where">
          Page {page} of {pageCount}
        </li>
        <li key="next">{control(page + 1, "cap-page", nextLabel, { kind: "next", rel: "next" })}</li>
      </ul>
    </nav>
  );
}
