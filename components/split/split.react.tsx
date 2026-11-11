import type { ReactNode } from "react";

export interface SplitProps {
  // The block's heading and its id (the section is named by it).
  heading: ReactNode;
  headingId: string;
  // The heading's level on the page.
  level?: "h2" | "h3" | "h4";
  // The picture on the left. Set it from the block's own data, never its position.
  flip?: boolean;
  // The picture: an <img> or a <picture>, placed in the figure.
  media: ReactNode;
  // A caption under the picture.
  caption?: ReactNode;
  // The text column: one element with className "cap-split-text" (a <p>, a <ul>, a <div>).
  children: ReactNode;
}

// The HTML contract in split.md.
export function Split({
  heading,
  headingId,
  level: H = "h3",
  flip,
  media,
  caption,
  children,
}: SplitProps) {
  return (
    <section className="cap-split" aria-labelledby={headingId} data-flip={flip ? "" : undefined}>
      <H className="cap-split-head" id={headingId}>
        {heading}
      </H>
      {children}
      <figure className="cap-split-media">
        {media}
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </section>
  );
}
