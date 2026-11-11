import type { ReactNode } from "react";

export interface EyebrowProps {
  children: ReactNode;
  // "mono": the mono face. Omitted: the interface face.
  variant?: "mono";
  tone?: "muted" | "accent" | "text";
  // The element: a paragraph by default; a span inside a line; a heading when it names a section on its own.
  as?: "p" | "span" | "h2" | "h3" | "div";
  id?: string;
}

// The HTML contract in eyebrow.md.
export function Eyebrow({ children, variant, tone, as: Tag = "p", id }: EyebrowProps) {
  return (
    <Tag
      className="cap-eyebrow"
      data-variant={variant}
      data-tone={tone === "muted" ? undefined : tone}
      id={id}
    >
      {children}
    </Tag>
  );
}
