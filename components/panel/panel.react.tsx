import type { ReactNode, Ref } from "react";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { Table } from "../table/table.react.tsx";

export interface PanelProps {
  // The heading. A panel with no title and nothing else for its header is a bare surface: the
  // body alone, no header band.
  title?: ReactNode;
  // The heading level the page's outline needs: h2 under a page h1, h3 inside a section.
  level?: 2 | 3;
  // How many the panel holds, beside the heading: "12".
  count?: number;
  // A short line of figures beside the heading, for more than one count: "12 total · 3 active".
  meta?: ReactNode;
  // Where the data comes from and how fresh it is: "Cloudflare. Read 6 minutes ago".
  src?: ReactNode;
  // A link to the full view, at the right of the header: "All columns in Sites".
  more?: ReactNode;
  // The same link from its address alone: `moreLabel` ("View all" by default) linking there.
  moreHref?: string;
  moreLabel?: string;
  // The panel's data is being read again: the source line shows "Reading again" with a spinner, and
  // the panel is aria-busy, so what it shows reads as the old answer until the new one lands.
  reading?: boolean;
  // The whole panel is one link (a card leading somewhere): the panel is an <a>, so it may hold no
  // other link or control.
  href?: string;
  // shadcn's CardDescription: a muted line under the heading.
  description?: ReactNode;
  // Controls that belong to the whole panel, placed after the title.
  actions?: ReactNode;
  // A tinted band under the body for the panel's own actions or a link (shadcn's CardFooter).
  footer?: ReactNode;
  // "sm" tightens the panel's spacing (shadcn's Card size="sm").
  size?: "sm";
  // The heading's id. Given, the panel is wired to its title with aria-labelledby, which
  // makes the section a named region (a landmark): give it to the panels a person should be
  // able to jump to, not to all eight on a page.
  headingId?: string;
  // The panel's <section>, for focus, scrolling or measuring.
  ref?: Ref<HTMLElement>;
  // A list or a table that runs to the panel's edges: the body has no padding.
  flush?: boolean;
  id?: string;
  // The name the anchor bar gives this panel. With an id, the bar links to the panel.
  section?: string;
  className?: string;
  children: ReactNode;
}

// A panel is a plain <section> with a heading, not a named region, unless it is given a
// headingId: a page of panels would otherwise fill the landmark list.
export function Panel({
  title,
  level = 2,
  count,
  meta,
  src,
  more,
  moreHref,
  moreLabel = "View all",
  reading,
  href,
  description,
  actions,
  footer,
  size,
  headingId,
  ref,
  flush = false,
  id,
  section,
  className,
  children,
}: PanelProps) {
  const Heading = level === 3 ? "h3" : "h2";
  const source = reading ? <Spinner size="sm" label="Reading again" /> : src;
  const moreLink = more ?? (moreHref ? <a href={moreHref}>{moreLabel}</a> : null);
  const head =
    title != null ||
    count != null ||
    meta != null ||
    actions != null ||
    source != null ||
    moreLink != null ||
    description != null;
  const inner = (
    <>
      {head ? (
        <header className="cap-panel-head">
          {title != null && <Heading id={headingId}>{title}</Heading>}
          {count != null && <span className="cap-panel-count">{count}</span>}
          {meta != null && <span className="cap-panel-count">{meta}</span>}
          {actions != null && <span className="cap-panel-action">{actions}</span>}
          {source != null && <span className="cap-panel-src">{source}</span>}
          {moreLink != null && <span className="cap-panel-more">{moreLink}</span>}
          {description != null && <p className="cap-panel-desc">{description}</p>}
        </header>
      ) : null}
      <div className="cap-panel-body" data-flush={flush ? "" : undefined}>
        {children}
      </div>
      {footer != null && <footer className="cap-panel-foot">{footer}</footer>}
    </>
  );
  const cls = className ? `cap-panel ${className}` : "cap-panel";
  if (href)
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        id={id}
        data-section={section}
        data-size={size}
        aria-busy={reading || undefined}
      >
        {inner}
      </a>
    );
  return (
    <section
      ref={ref}
      className={cls}
      id={id}
      data-section={section}
      data-size={size}
      aria-labelledby={title != null ? headingId : undefined}
      aria-busy={reading || undefined}
    >
      {inner}
    </section>
  );
}

export interface TablePanelProps extends Omit<PanelProps, "flush" | "headingId" | "children"> {
  title: ReactNode;
  // The heading's id: the table's scrolling region is named by it.
  headingId: string;
  // Nothing to list: the panel shows `empty` (an Empty) in place of the table.
  isEmpty: boolean;
  empty: ReactNode;
  // Narrow screens stack each row into label and value pairs (the table's data-reflow).
  reflow?: boolean;
  // The table's caption, visually hidden: the heading names the region, the caption the table.
  caption: ReactNode;
  // The table's thead and tbody; Table draws the region, the table and the caption.
  children: ReactNode;
}

// An admin page's table in its panel: the heading names the table's scrolling region, a reread
// shows "Reading again" and marks the panel busy, and an empty answer is the Empty, never an empty
// table. Six of Foxhound's admin pages each wrote this frame.
export function TablePanel({
  headingId,
  isEmpty,
  empty,
  reflow,
  caption,
  children,
  ...panel
}: TablePanelProps) {
  return (
    <Panel {...panel} headingId={headingId} flush>
      {isEmpty ? (
        empty
      ) : (
        <Table caption={caption} captionHidden labelledBy={headingId} reflow={reflow}>
          {children}
        </Table>
      )}
    </Panel>
  );
}
