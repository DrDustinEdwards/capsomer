import { createElement, type ReactNode } from "react";

interface Base {
  children?: ReactNode;
  className?: string;
  id?: string;
}

export interface TitleProps extends Base {
  // The look, 1 the largest to 6; 4 when omitted. The element is the outline, so `as` is not tied to it.
  size?: 1 | 2 | 3 | 4 | 5 | 6;
  // The heading element: h2 when omitted.
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div";
}

export interface TextProps extends Base {
  size?: "tiny" | "small" | "lead";
  tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
  weight?: "strong";
  face?: "ui" | "mono" | "prose" | "display";
  align?: "center" | "end";
  // The element: a paragraph when omitted.
  as?: "p" | "span" | "div" | "li" | "dd" | "dt" | "small" | "strong" | "em";
}

// The HTML contract in text.md. Any other attribute (a ref, an aria or data attribute) is passed through.
export function Title({ size, as = "h2", className, ...rest }: TitleProps) {
  return createElement(as, {
    ...rest,
    className: className ? `cap-title ${className}` : "cap-title",
    "data-size": size === 4 ? undefined : size,
  });
}

export function Text({ size, tone, weight, face, align, as = "p", className, ...rest }: TextProps) {
  return createElement(as, {
    ...rest,
    className: className ? `cap-text ${className}` : "cap-text",
    "data-size": size,
    "data-tone": tone,
    "data-weight": weight,
    "data-face": face,
    "data-align": align,
  });
}
