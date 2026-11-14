import { createElement, type ComponentPropsWithRef, type ElementType } from "react";

// `as` is any element or component (a `td`, an `h1`, a router `Link` or `Form`), and the props of that element or component
// reach it: a ref, `htmlFor`, `href`, `method`, a handler. The element is the outline; the role is the look.
export type As<T extends ElementType, Own> = Own & { as?: T } & Omit<
    ComponentPropsWithRef<T>,
    keyof Own | "as"
  >;

interface TitleOwn {
  // The look, 1 the largest to 6; 4 when omitted. The heading level is `as` (h2 when omitted).
  size?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

interface TextOwn {
  size?: "tiny" | "small" | "lead";
  tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
  weight?: "strong";
  face?: "ui" | "mono" | "prose" | "display";
  align?: "center" | "end";
  className?: string;
}

export type TitleProps<T extends ElementType = "h2"> = As<T, TitleOwn>;
export type TextProps<T extends ElementType = "p"> = As<T, TextOwn>;

// The HTML contract in text.md.
export function Title<T extends ElementType = "h2">({
  size,
  as,
  className,
  ...rest
}: TitleProps<T>) {
  return createElement(as ?? "h2", {
    ...rest,
    className: className ? `cap-title ${className}` : "cap-title",
    "data-size": size === 4 ? undefined : size,
  });
}

export function Text<T extends ElementType = "p">({
  size,
  tone,
  weight,
  face,
  align,
  as,
  className,
  ...rest
}: TextProps<T>) {
  return createElement(as ?? "p", {
    ...rest,
    className: className ? `cap-text ${className}` : "cap-text",
    "data-size": size,
    "data-tone": tone,
    "data-weight": weight,
    "data-face": face,
    "data-align": align,
  });
}
