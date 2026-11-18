import { useId, type ReactNode } from "react";

// The closing call to action of a page (cta-band.md): a heading, one sentence and the actions, in
// a band set apart from the page. Named by its heading, so it is a region a screen reader lists.

export interface CtaBandProps {
  title: ReactNode;
  children?: ReactNode;
  // Buttons or button links; the first is the primary.
  actions: ReactNode;
  // A quieter band: no fill, a rule above.
  quiet?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}

export function CtaBand({
  title,
  children,
  actions,
  quiet = false,
  headingLevel: H = "h2",
  className,
}: CtaBandProps) {
  const titleId = useId();
  return (
    <section
      className={className ? `cap-cta-band ${className}` : "cap-cta-band"}
      aria-labelledby={titleId}
      data-quiet={quiet ? "" : undefined}
    >
      <H id={titleId} className="cap-cta-band-title">
        {title}
      </H>
      {children ? <p className="cap-cta-band-text">{children}</p> : null}
      <div className="cap-cta-band-actions">{actions}</div>
    </section>
  );
}
