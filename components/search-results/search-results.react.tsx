import type { ReactNode } from "react";
import { snippetParts } from "./search-results.ts";

export interface SnippetProps {
  // Text with each match between the markers (MARK_OPEN, MARK_CLOSE), as FTS5's snippet() writes it.
  text: string;
  open?: string;
  close?: string;
}

// The snippet with its matches marked. React escapes every run; nothing in it is markup.
export function Snippet({ text, open, close }: SnippetProps) {
  return (
    <>
      {snippetParts(text, open, close).map((p, i) =>
        p.match ? <mark key={i}>{p.text}</mark> : p.text,
      )}
    </>
  );
}

export interface SearchResultProps {
  href: string;
  title: ReactNode;
  // What kind of thing it is ("Post", "Guide"), a badge before the title.
  kind?: ReactNode;
  // Where it sits ("in Getting started", a path), under the title.
  context?: ReactNode;
  // The snippet, with its matches between the markers.
  snippet?: string;
  // Why it matched and anything else worth a word ("Matched on the title", a year).
  why?: ReactNode;
  // The title's heading level in the page's outline.
  level?: 2 | 3;
}

// One result: the kind, the title as a link, where it sits, the snippet and why it matched.
export function SearchResult({
  href,
  title,
  kind,
  context,
  snippet,
  why,
  level = 2,
}: SearchResultProps) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <li className="cap-search-result">
      <div className="cap-search-head">
        {kind != null ? (
          <span className="cap-pill" data-variant="outline">
            {kind}
          </span>
        ) : null}
        <Heading className="cap-search-title">
          <a href={href}>{title}</a>
        </Heading>
      </div>
      {context != null ? <p className="cap-search-context">{context}</p> : null}
      {snippet ? (
        <p className="cap-search-snippet">
          <Snippet text={snippet} />
        </p>
      ) : null}
      {why != null ? <p className="cap-search-why">{why}</p> : null}
    </li>
  );
}

export interface SearchResultsProps {
  // The count line ("24 results"): resultsText writes it. Always rendered, empty before a
  // search, so the live region exists before it first speaks.
  count: string;
  // Results, a SearchResult each.
  children?: ReactNode;
  // Filters, beside the results on a wide screen and above them on a narrow one.
  facets?: ReactNode;
  // The sort links, above the results.
  sort?: ReactNode;
  // What shows when nothing matched: a sentence and something to try (related tags, recent items).
  empty?: ReactNode;
  // The pages, under the results.
  pager?: ReactNode;
  label?: string;
}

// The page around the results: the count, the sort, the list or the empty state, the pages and
// the facets.
export function SearchResults({
  count,
  children,
  facets,
  sort,
  empty,
  pager,
  label = "Search results",
}: SearchResultsProps) {
  const has = Array.isArray(children)
    ? children.length > 0
    : children != null && children !== false;
  return (
    <div className="cap-search" data-facets={facets ? "" : undefined}>
      <div className="cap-search-main">
        <p className="cap-search-count" aria-live="polite">
          {count}
        </p>
        {has && sort ? <div className="cap-search-sort">{sort}</div> : null}
        {has ? (
          <ol className="cap-search-list" aria-label={label}>
            {children}
          </ol>
        ) : (
          empty
        )}
        {has ? pager : null}
      </div>
      {facets ? (
        <aside className="cap-search-facets" aria-label="Filter results">
          {facets}
        </aside>
      ) : null}
    </div>
  );
}
