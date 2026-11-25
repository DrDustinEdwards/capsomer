import type { ReactElement, ReactNode } from "react";
import { pageItems, statusText } from "./pagination.ts";

export {
  pageCountOf,
  pageEnvelope,
  pageHref,
  pageRelLinks,
  parsePage,
  showingRange,
  statusText,
  type PageEnvelope,
} from "./pagination.ts";

export interface PageLinkProps {
  href: string;
  className: string;
  rel?: string;
  "data-kind"?: "prev" | "next";
  "aria-label"?: string;
  "aria-current"?: "page";
  children: ReactNode;
}

const plainPageLink = ({ href, children, ...rest }: PageLinkProps) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export interface PaginationProps {
  page: number;
  pageCount: number;
  // Links (server-rendered): the address of a page. Without it the pager is buttons and onPageChange says which.
  hrefFor?: (page: number) => string;
  onPageChange?: (page: number) => void;
  total?: number;
  perPage?: number;
  noun?: string;
  prevLabel?: string;
  nextLabel?: string;
  label?: string;
  renderLink?: (props: PageLinkProps) => ReactNode;
  // "steps": Previous and Next with "Page 3 of 16" between, no numbers. With a moving total pass pageCount 0 and `hasNext`.
  form?: "numbers" | "steps";
  hasNext?: boolean;
}

// The HTML contract in pagination.md. One page or none renders nothing: there is nowhere to go.
export function Pagination({
  page,
  pageCount: known,
  hrefFor,
  onPageChange,
  total,
  perPage,
  noun = "items",
  prevLabel = "Previous",
  nextLabel = "Next",
  label = "Pagination",
  renderLink = plainPageLink,
  form = "numbers",
  hasNext,
}: PaginationProps): ReactElement | null {
  const open = hasNext !== undefined && form === "steps" && !(known > 0);
  const pageCount = open ? (hasNext ? page + 1 : page) : known;
  if (pageCount <= 1) return null;
  const links = typeof hrefFor === "function";
  const control = (
    to: number,
    className: string,
    content: string,
    extra: { kind?: "prev" | "next"; current?: boolean; name?: string; rel?: string },
  ) => {
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
        renderLink({
          className: common.className,
          "data-kind": common["data-kind"],
          "aria-label": common["aria-label"],
          "aria-current": common["aria-current"],
          href: hrefFor(to),
          rel: extra.rel,
          children: content,
        })
      );
    }
    return (
      <button
        type="button"
        {...common}
        aria-disabled={off ? true : undefined}
        onClick={() => (!off && !extra.current ? onPageChange?.(to) : undefined)}
      >
        {content}
      </button>
    );
  };
  return (
    <nav
      className="cap-pagination"
      aria-label={label}
      data-form={form === "steps" ? "steps" : undefined}
    >
      {perPage && total != null ? (
        <p className="cap-pagination-status" role={links ? undefined : "status"}>
          {statusText(page, perPage, total, noun)}
        </p>
      ) : null}
      <ul className="cap-pagination-list">
        <li key="prev">
          {control(page - 1, "cap-page", prevLabel, { kind: "prev", rel: "prev" })}
        </li>
        {(form === "steps" ? [] : pageItems(page, pageCount)).map((it) =>
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
          {open ? `Page ${page}` : `Page ${page} of ${pageCount}`}
        </li>
        <li key="next">
          {control(page + 1, "cap-page", nextLabel, { kind: "next", rel: "next" })}
        </li>
      </ul>
    </nav>
  );
}
