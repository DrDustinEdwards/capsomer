import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover.react.tsx";
import { foldedLevels } from "./breadcrumb.ts";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  // The trail, first level to current page. Fewer than two levels renders nothing: a hub has
  // no trail to show.
  items: BreadcrumbItem[];
  // Keep the first level and the last (maxItems - 1); the rest fold into a popover of links.
  maxItems?: number;
  // The fewest levels that draw a trail (2 by default). A site whose trail leaves out the home page, which its header
  // already links, passes its structured data's minimum less one, so the page and its BreadcrumbList agree.
  minItems?: number;
  label?: string;
  // "direction" draws the trail as the manual's airport direction strip (.cap-direction, components/manual): same
  // links and page, no folding (maxItems is ignored), and the nav carries `className` for the page's own spacing.
  variant?: "direction";
  className?: string;
  // Draw a level's link with the app's router link: receives the class and the content.
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
}

const Dots = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="3" cy="8" r="1.4" fill="currentColor" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    <circle cx="13" cy="8" r="1.4" fill="currentColor" />
  </svg>
);

// The HTML contract in breadcrumb.md. A long trail renders its folded item at once, so the server's HTML has the links.
export function Breadcrumb({
  items,
  maxItems,
  minItems = 2,
  label = "Breadcrumb",
  variant,
  className,
  renderLink,
}: BreadcrumbProps) {
  if (items.length < Math.max(2, minItems)) return null;
  const strip = variant === "direction";
  const folded = new Set(maxItems && !strip ? foldedLevels(items.length, maxItems) : []);
  const link = (item: BreadcrumbItem, className: string) =>
    renderLink ? (
      renderLink({ href: item.href ?? "#", className, children: item.label })
    ) : (
      <a className={className} href={item.href}>
        {item.label}
      </a>
    );
  return (
    <nav
      className={[strip ? "cap-direction" : "cap-breadcrumb", className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <ol className={strip ? undefined : "cap-breadcrumb-list"}>
        {items.map((item, i) => {
          if (folded.has(i)) {
            if (i !== Math.min(...folded)) return null;
            const hidden = items.filter((_, j) => folded.has(j));
            return (
              <li className="cap-breadcrumb-item" data-collapsed="" key={`fold-${i}`}>
                <Popover>
                  <PopoverTrigger
                    className="cap-breadcrumb-ellipsis"
                    aria-label={`Show ${hidden.length} more levels`}
                  >
                    <Dots />
                  </PopoverTrigger>
                  <PopoverContent
                    aria-label="More levels"
                    side="bottom"
                    align="start"
                    size="auto"
                    data-flush=""
                  >
                    <ul className="cap-breadcrumb-more">
                      {hidden.map((h) => (
                        <li key={`${h.href}-${h.label}`}>{link(h, "cap-breadcrumb-more-link")}</li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              </li>
            );
          }
          const last = i === items.length - 1;
          return (
            <li className={strip ? undefined : "cap-breadcrumb-item"} key={`${item.href}-${i}`}>
              {last ? (
                <span className={strip ? undefined : "cap-breadcrumb-page"} aria-current="page">
                  {item.label}
                </span>
              ) : (
                link(item, strip ? "" : "cap-breadcrumb-link")
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
