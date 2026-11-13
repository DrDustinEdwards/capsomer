import { createElement, type HTMLAttributes, type Ref } from "react";

// The props of any element the roles are put on: its global and ARIA attributes, handlers, a ref, and the few element-specific
// ones a heading, label or table cell takes. `as` is any intrinsic element: the element is the outline, the role is the look.
export type ElementProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  as?: keyof React.JSX.IntrinsicElements;
  htmlFor?: string;
  scope?: "col" | "row";
  colSpan?: number;
};

export type TitleProps = ElementProps & {
  // The look, 1 the largest to 6; 4 when omitted. The heading level is `as` (h2 when omitted).
  size?: 1 | 2 | 3 | 4 | 5 | 6;
};

export type TextProps = ElementProps & {
  size?: "tiny" | "small" | "lead";
  tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
  weight?: "strong";
  face?: "ui" | "mono" | "prose" | "display";
  align?: "center" | "end";
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
