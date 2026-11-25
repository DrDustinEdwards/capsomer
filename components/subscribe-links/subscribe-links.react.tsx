import { useId, type ReactNode } from "react";
import { AwayLink } from "../link/link.react.tsx";

export interface SubscribeLink {
  href: string;
  label: ReactNode;
  icon?: ReactNode;
  // Another site (a podcast app): rel="external" and the link system's away mark.
  away?: boolean;
}

export interface SubscribeLinksProps {
  title?: ReactNode;
  headingId?: string;
  level?: "h2" | "h3";
  links: SubscribeLink[];
  more?: { href: string; label: ReactNode };
  // Draw a link with the app's router link (the "more" page is the site's own).
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
}

export function SubscribeLinks({
  title = "Listen and subscribe",
  headingId,
  level: H = "h2",
  links,
  more,
  renderLink,
}: SubscribeLinksProps) {
  const ownId = useId();
  const id = headingId ?? ownId;
  if (!links.length) return null;
  return (
    <section className="cap-subscribe" aria-labelledby={id}>
      <H className="cap-subscribe-title" id={id}>
        {title}
      </H>
      <ul className="cap-subscribe-list">
        {links.map((l) => (
          <li key={l.href}>
            {l.away ? (
              <AwayLink className="cap-chip cap-subscribe-link" data-size="sm" href={l.href}>
                {l.icon}
                {l.label}
              </AwayLink>
            ) : (
              <a className="cap-chip cap-subscribe-link" data-size="sm" href={l.href}>
                {l.icon}
                {l.label}
              </a>
            )}
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
