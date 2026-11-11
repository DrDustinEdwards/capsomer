import type { ReactNode } from "react";

export interface SubscribeLink {
  href: string;
  // The destination's name; a site may add its own away cue after it.
  label: ReactNode;
  // The app's mark, decorative (aria-hidden): an <svg>.
  icon?: ReactNode;
  // Another site (a podcast app): rel="external" and the link system's away mark.
  away?: boolean;
}

export interface SubscribeLinksProps {
  title?: ReactNode;
  // The heading's id, which names the section.
  headingId?: string;
  level?: "h2" | "h3";
  links: SubscribeLink[];
  // The page with every way to follow ("More ways to listen"), last.
  more?: { href: string; label: ReactNode };
  // Draw a link with the app's router link (the "more" page is the site's own).
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
}

// The HTML contract in subscribe-links.md. Nothing renders without a link.
export function SubscribeLinks({
  title = "Listen and subscribe",
  headingId = "subscribe",
  level: H = "h2",
  links,
  more,
  renderLink,
}: SubscribeLinksProps) {
  if (!links.length) return null;
  return (
    <section className="cap-subscribe" aria-labelledby={headingId}>
      <H className="cap-subscribe-title" id={headingId}>
        {title}
      </H>
      <ul className="cap-subscribe-list">
        {links.map((l) => (
          <li key={l.href}>
            <a
              className="cap-chip cap-subscribe-link"
              data-size="sm"
              href={l.href}
              {...(l.away ? { rel: "external", "data-link": "away" } : {})}
            >
              {l.icon}
              {l.label}
            </a>
          </li>
        ))}
        {more ? (
          <li>
            {renderLink ? (
              renderLink({ href: more.href, className: "cap-subscribe-more", children: more.label })
            ) : (
              <a className="cap-subscribe-more" href={more.href}>
                {more.label}
              </a>
            )}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
