import { useId } from "react";
import { isHttpUrl, isSameOriginPath } from "@dustinedwards/site-runtime/url";
import { Link } from "../link/link.react.tsx";
import { Time } from "../time/time.react.tsx";

export interface RelatedItem {
  // A path on this site or an http(s) address elsewhere. A mention's source is always treated as elsewhere. Anything else renders as text.
  href: string | null;
  title: string;
  excerpt?: string | null;
  date?: string | number | Date | null;
}

export type RelatedKind = "internal" | "external" | "mentions";

export interface RelatedLinksProps {
  title: string;
  // internal: site pages, in a nav. external: pages the author chose, in a section. In both a site path is
  // a router link and an address elsewhere has rel="noopener noreferrer". mentions: a stranger's links,
  // rel="nofollow ugc noopener noreferrer".
  kind: RelatedKind;
  items: readonly RelatedItem[];
}

const REL = { external: "noopener noreferrer", mentions: "nofollow ugc noopener noreferrer" };

// Every string is a React child, never markup, since a mention's words are a stranger's. Renders nothing for an empty list.
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
          // A stranger's address passes only as an absolute http(s) URL; a site path passes the same check a
          // redirect's Location does, so "/\t/host" (read by a browser as "//host") is refused.
          const href = item.href ?? "";
          const local = kind !== "mentions" && isSameOriginPath(href);
          const linked = local || isHttpUrl(href);
          return (
            <li key={`${i}:${item.href ?? item.title}`}>
              {!linked ? (
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
              {kind === "mentions" && item.date ? (
                <span className="cap-related-date">
                  <Time at={item.date} format="date" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Box>
  );
}
