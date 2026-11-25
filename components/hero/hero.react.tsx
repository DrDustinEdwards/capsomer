import { useId, type ReactNode } from "react";

// A landing page's first section (hero.md): the page's one h1, a lead and the actions, an optional aside and a decorative layer.

export interface HeroProps {
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  backdrop?: ReactNode;
  align?: "start" | "center";
  card?: boolean;
  headingLevel?: "h1" | "h2";
  id?: string;
  className?: string;
}

export function Hero(props: HeroProps) {
  const {
    title,
    lead,
    children,
    actions,
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
        <H id={titleId} className="cap-hero-title">
          {title}
        </H>
        {lead ? <p className="cap-hero-lead">{lead}</p> : null}
        {children ? <div className="cap-hero-body">{children}</div> : null}
        {actions ? <div className="cap-hero-actions">{actions}</div> : null}
      </div>
      {aside ? <div className="cap-hero-aside">{aside}</div> : null}
    </section>
  );
}
