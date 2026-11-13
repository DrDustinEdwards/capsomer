import { useId, type ReactNode } from "react";

// A landing page's first section (hero.md): an eyebrow, the page's one h1, a lead, the actions
// and a note, with an aside beside them where there is room (a card, a picture, a product view)
// and an optional decorative layer behind. The look comes from the site's tokens: --hero-title
// size, --hero-align, the surface; the layer is the site's own drawing, aria-hidden.

export interface HeroProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  lead?: ReactNode;
  // More between the lead and the actions: further paragraphs, a price line.
  children?: ReactNode;
  // Buttons or button links; the first is the primary.
  actions?: ReactNode;
  // A short line under the actions ("No card needed").
  note?: ReactNode;
  // Beside the words from 60rem, under them before.
  aside?: ReactNode;
  // Decorative, behind everything; hidden from assistive technology.
  backdrop?: ReactNode;
  // Center the words (no aside). Default start.
  align?: "start" | "center";
  // The words sit on a raised card over the backdrop (bsw's frosted card).
  card?: boolean;
  headingLevel?: "h1" | "h2";
  // The section's id, for a skip or "back to top" link.
  id?: string;
  className?: string;
}

export function Hero(props: HeroProps) {
  const {
    title,
    eyebrow,
    lead,
    children,
    actions,
    note,
    aside,
    backdrop,
    align = "start",
    card = false,
    headingLevel: H = "h1",
    id,
    className,
  } = props;
  const titleId = useId();
  return (
    <section
      id={id}
      className={className ? `cap-hero ${className}` : "cap-hero"}
      aria-labelledby={titleId}
      data-align={align === "center" ? "center" : undefined}
      data-aside={aside ? "" : undefined}
    >
      {backdrop ? (
        <div className="cap-hero-backdrop" aria-hidden="true">
          {backdrop}
        </div>
      ) : null}
      <div className="cap-hero-text" data-card={card ? "" : undefined}>
        {eyebrow ? <p className="cap-hero-eyebrow">{eyebrow}</p> : null}
        <H id={titleId} className="cap-hero-title">
          {title}
        </H>
        {lead ? <p className="cap-hero-lead">{lead}</p> : null}
        {children ? <div className="cap-hero-body">{children}</div> : null}
        {actions ? <div className="cap-hero-actions">{actions}</div> : null}
        {note ? <p className="cap-hero-note">{note}</p> : null}
      </div>
      {aside ? <div className="cap-hero-aside">{aside}</div> : null}
    </section>
  );
}
