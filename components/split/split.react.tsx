import type { ReactNode } from "react";

export interface SplitProps {
  heading: ReactNode;
  headingId: string;
  level?: "h2" | "h3" | "h4";
  // The picture on the left. Set it from the block's own data, never its position.
  flip?: boolean;
  media: ReactNode;
  caption?: ReactNode;
  // The text column: one element with className "cap-split-text" (a <p>, a <ul>, a <div>).
  children: ReactNode;
}

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
