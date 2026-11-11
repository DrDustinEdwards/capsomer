import { useId } from "react";
import { Link } from "../link/link.react.tsx";
import { httpHref, longDate, sitePath } from "./related-links.ts";

export interface RelatedItem {
  // A path on this site ("/writing/getting-started") or an http(s) address elsewhere. A mention's
  // source is always treated as elsewhere. An address that is neither renders as text.
  href: string | null;
  title: string;
  // Mentions: the sender's words, as text.
  excerpt?: string | null;
  // Mentions: when it was approved.
  date?: string | number | Date | null;
}

export type RelatedKind = "internal" | "external" | "mentions";

export interface RelatedLinksProps {
  // "Further reading", "Linked from", "Mentions".
  title: string;
  // internal: pages on this site, in a nav. external: pages the author chose, in a section.
  // In both a site path is a router link and an address elsewhere has rel="noopener noreferrer".
  // mentions: a stranger's links, rel="nofollow ugc noopener noreferrer", with excerpt and date.
  kind: RelatedKind;
  items: readonly RelatedItem[];
}

const REL = { external: "noopener noreferrer", mentions: "nofollow ugc noopener noreferrer" };

// The HTML contract in related-links.md. Every string is a React child, never markup, since a
// mention's words are a stranger's. Renders nothing for an empty list.
export function RelatedLinks({ title, kind, items }: RelatedLinksProps) {
  const headingId = useId();
  if (items.length === 0) return null;
  const Box = kind === "internal" ? "nav" : "section";
  return (
    <Box className="cap-related" data-kind={kind} aria-labelledby={headingId}>
      <h2 className="cap-related-title" id={headingId}>
        {title}
      </h2>
      <ul className="cap-related-list">
        {items.map((item, i) => {
          const local = kind !== "mentions" && sitePath(item.href);
          const href = local ? item.href : httpHref(item.href);
          const date = kind === "mentions" ? longDate(item.date) : null;
          return (
            <li key={`${i}:${item.href ?? item.title}`}>
              {!href ? (
                <span className="cap-related-name">{item.title}</span>
              ) : local ? (
                <Link className="cap-related-name" to={href}>
                  {item.title}
                </Link>
              ) : (
                <a
                  className="cap-related-name"
                  href={href}
                  rel={kind === "mentions" ? REL.mentions : REL.external}
                >
                  {item.title}
                </a>
              )}
              {kind === "mentions" && item.excerpt ? (
                <p className="cap-related-excerpt">{item.excerpt}</p>
              ) : null}
              {date ? (
                <time className="cap-related-date" dateTime={date.iso}>
                  {date.text}
                </time>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Box>
  );
}
