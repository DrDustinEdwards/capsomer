import type { ReactNode, Ref } from "react";
import { Spinner } from "../skeleton/skeleton.react.tsx";
import { Table } from "../table/table.react.tsx";

export interface PanelProps {
  // The heading. A panel with no title and nothing else for its header is a bare surface with no header band.
  title?: ReactNode;
  level?: 2 | 3;
  count?: number;
  meta?: ReactNode;
  src?: ReactNode;
  more?: ReactNode;
  moreHref?: string;
  moreLabel?: string;
  // The data is being read again: the source line shows "Reading again" and the panel is aria-busy.
  reading?: boolean;
  // The whole panel is one link (an <a>), so it may hold no other link or control.
  href?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  size?: "sm";
  // Given, the panel is wired to its title with aria-labelledby and becomes a named landmark; give it only to panels worth jumping to.
  headingId?: string;
  ref?: Ref<HTMLElement>;
  flush?: boolean;
  id?: string;
  section?: string;
  className?: string;
  children: ReactNode;
}

// A panel is a plain <section>, not a named region, unless given a headingId: a page of panels would fill the landmark list.
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
    moreLink != null;
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
  headingId: string;
  isEmpty: boolean;
  empty: ReactNode;
  reflow?: boolean;
  caption: ReactNode;
  children: ReactNode;
}

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
