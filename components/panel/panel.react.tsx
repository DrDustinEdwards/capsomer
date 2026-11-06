import type { ReactNode, Ref } from "react";

export interface PanelProps {
  title: ReactNode;
  // The heading level the page's outline needs: h2 under a page h1, h3 inside a section.
  level?: 2 | 3;
  // How many the panel holds, beside the heading: "12".
  count?: number;
  // Where the data comes from and how fresh it is: "Cloudflare. Read 6 minutes ago".
  src?: ReactNode;
  // A link to the full view, at the right of the header: "All columns in Sites".
  more?: ReactNode;
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
export function Panel({ title, level = 2, count, src, more, description, actions, footer, size, headingId, ref, flush = false, id, section, className, children }: PanelProps) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <section ref={ref} className={className ? `cap-panel ${className}` : "cap-panel"} id={id} data-section={section} data-size={size} aria-labelledby={headingId}>
      <header className="cap-panel-head">
        <Heading id={headingId}>{title}</Heading>
        {count != null && <span className="cap-panel-count">{count}</span>}
        {actions != null && <span className="cap-panel-action">{actions}</span>}
        {src != null && <span className="cap-panel-src">{src}</span>}
        {more != null && <span className="cap-panel-more">{more}</span>}
        {description != null && <p className="cap-panel-desc">{description}</p>}
      </header>
      <div className="cap-panel-body" data-flush={flush ? "" : undefined}>
        {children}
      </div>
      {footer != null && <footer className="cap-panel-foot">{footer}</footer>}
    </section>
  );
}
