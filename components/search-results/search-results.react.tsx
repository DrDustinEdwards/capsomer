import type { ReactNode } from "react";
import { snippetParts } from "./search-results.ts";

export interface SnippetProps {
  text: string;
  open?: string;
  close?: string;
}

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
  kind?: ReactNode;
  context?: ReactNode;
  snippet?: string;
  why?: ReactNode;
  level?: 2 | 3;
}

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
  count: string;
  children?: ReactNode;
  facets?: ReactNode;
  sort?: ReactNode;
  // What shows when nothing matched: a sentence and something to try (related tags, recent items).
  empty?: ReactNode;
  pager?: ReactNode;
  label?: string;
}

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
