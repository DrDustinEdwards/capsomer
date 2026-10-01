import type { ReactNode } from "react";

export interface PanelProps {
  title: ReactNode;
  // The heading level the page's outline needs: h2 under a page h1, h3 inside a section.
  level?: 2 | 3;
  // Where the data comes from and how fresh it is: "Cloudflare. Read 6 minutes ago".
  src?: ReactNode;
  // Controls that belong to the whole panel, placed after the title.
  actions?: ReactNode;
  // A list or a table that runs to the panel's edges: the body has no padding.
  flush?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

// A panel is a plain <section> with a heading, not a named region: a page of panels
// would otherwise fill the landmark list.
export function Panel({ title, level = 2, src, actions, flush = false, id, className, children }: PanelProps) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <section className={className ? `cap-panel ${className}` : "cap-panel"} id={id}>
      <header className="cap-panel-head">
        <Heading>{title}</Heading>
        {actions}
        {src != null && <span className="cap-panel-src">{src}</span>}
      </header>
      <div className="cap-panel-body" data-flush={flush ? "" : undefined}>
        {children}
      </div>
    </section>
  );
}
