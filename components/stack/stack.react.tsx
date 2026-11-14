import { createElement, type ElementType } from "react";
import type { As } from "../text/text.react.tsx";

interface StackOwn {
  // The space between the children, on the spacing scale (1 to 9); the layout's own gap when omitted.
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  className?: string;
}

export type StackProps<T extends ElementType = "div"> = As<T, StackOwn>;

// The HTML contract in stack.md. The element's (or component's) own props pass through.
export function Stack<T extends ElementType = "div">({
  gap,
  as,
  className,
  ...rest
}: StackProps<T>) {
  return createElement(as ?? "div", {
    ...rest,
    className: className ? `cap-stack ${className}` : "cap-stack",
    "data-gap": gap,
  });
}
