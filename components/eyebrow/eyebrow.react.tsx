import type { ReactNode } from "react";

export interface EyebrowProps {
  children: ReactNode;
  // "mono": the mono face. Omitted: the interface face.
  variant?: "mono";
  tone?: "muted" | "dim" | "accent" | "text";
  // The element: a paragraph by default; a span inside a line; a heading when it names a section on its own.
  as?: "p" | "span" | "h2" | "h3" | "div";
  id?: string;
  className?: string;
}

// The HTML contract in eyebrow.md. A label that carries a fact ("Sample data", "Account"), never a
// kicker over a heading that only restates it (DEFAULTS.md, let the layout explain).
export function Eyebrow({ children, variant, tone, as: Tag = "p", id, className }: EyebrowProps) {
  return (
    <Tag
      className={className ? `cap-eyebrow ${className}` : "cap-eyebrow"}
      data-variant={variant}
      data-tone={tone === "muted" ? undefined : tone}
      id={id}
    >
      {children}
    </Tag>
  );
}
