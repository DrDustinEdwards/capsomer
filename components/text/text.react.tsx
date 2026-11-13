import { createElement, type ComponentPropsWithRef } from "react";

// The element's own props pass through (a ref, tabIndex, htmlFor, scope, an aria or data attribute, a handler). `as` is any
// intrinsic element: the element is the outline, the role is the look.
type Own<Tag extends keyof React.JSX.IntrinsicElements> = Omit<
  ComponentPropsWithRef<Tag>,
  "color"
> & { as?: Tag };

export type TitleProps = Own<"h2"> & {
  // The look, 1 the largest to 6; 4 when omitted. The heading level is `as` (h2 when omitted).
  size?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: keyof React.JSX.IntrinsicElements;
};

export type TextProps = Own<"p"> & {
  size?: "tiny" | "small" | "lead";
  tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
  weight?: "strong";
  face?: "ui" | "mono" | "prose" | "display";
  align?: "center" | "end";
  // The element: a paragraph when omitted.
  as?: keyof React.JSX.IntrinsicElements;
};

// The HTML contract in text.md.
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
