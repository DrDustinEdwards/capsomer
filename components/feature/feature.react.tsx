import type { ReactNode } from "react";

export interface FeatureBlockProps {
  title: ReactNode;
  body?: ReactNode;
  media?: ReactNode;
  // A tall preview scrolls in a window; this names that window for a screen reader.
  scrollLabel?: string;
  // "stacked": the text centered over the picture. "beside": text and picture side by side when wide.
  layout?: "stacked" | "beside";
  alignStart?: boolean;
  lifted?: boolean;
  headingLevel?: "h2" | "h3" | "h4";
  id?: string;
}

export function FeatureBlock({
  title,
  body,
  media,
  scrollLabel,
  layout = "stacked",
  alignStart,
  lifted,
  headingLevel: H = "h3",
  id,
}: FeatureBlockProps) {
  return (
    <div
      className="cap-feature"
      id={id}
      data-layout={layout === "beside" ? "beside" : undefined}
      data-align={alignStart ? "start" : undefined}
      data-variant={lifted ? "lifted" : undefined}
    >
      <div className="cap-feature-text">
        <H className="cap-feature-title">{title}</H>
        {body ? <p className="cap-feature-body">{body}</p> : null}
      </div>
      {media ? (
        <div className="cap-feature-media">
          {scrollLabel ? (
            // A window that scrolls is a stop for the keyboard, named for what it holds.
            <div className="cap-feature-scroll" role="region" aria-label={scrollLabel} tabIndex={0}>
              {media}
            </div>
          ) : (
            media
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Features({ children, alternate }: { children: ReactNode; alternate?: boolean }) {
  return (
    <div className="cap-features" data-alternate={alternate ? "" : undefined}>
      {children}
    </div>
  );
}

export interface FeatureCardItem {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  tag?: ReactNode;
  id?: string;
  // The site's own data attributes on the card (a filter's hooks, say). Only data-* names.
  attributes?: Record<`data-${string}`, string>;
}

export function FeatureCard({
  icon,
  title,
  text,
  tag,
  id,
  attributes,
  headingLevel: H = "h3",
}: FeatureCardItem & {
  headingLevel?: "h2" | "h3" | "h4" | "p";
}) {
  return (
    <li {...attributes} id={id} className="cap-feature-card">
      {icon ? (
        <span className="cap-feature-card-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {tag ? (
        <div className="cap-feature-card-head">
          <H className="cap-feature-card-title">{title}</H>
          <span className="cap-feature-card-tag">{tag}</span>
        </div>
      ) : (
        <H className="cap-feature-card-title">{title}</H>
      )}
      {text ? <p className="cap-feature-card-text">{text}</p> : null}
    </li>
  );
}

export function FeatureGrid({
  items,
  headingLevel,
  ordered,
  label,
}: {
  items: FeatureCardItem[];
  headingLevel?: "h2" | "h3" | "h4" | "p";
  ordered?: boolean;
  label?: string;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className="cap-feature-grid" aria-label={label}>
      {items.map((item, i) => (
        <FeatureCard key={item.id ?? i} {...item} headingLevel={headingLevel} />
      ))}
    </List>
  );
}
