import { createElement } from "react";
import type { ElementProps } from "../text/text.react.tsx";

export type StackProps = ElementProps & {
  // The space between the children, on the spacing scale (1 to 9); the layout's own gap when omitted.
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
};

// The HTML contract in stack.md. The element's own props pass through.
export function Stack({ gap, as = "div", className, ...rest }: StackProps) {
  return createElement(as, {
    ...rest,
    className: className ? `cap-stack ${className}` : "cap-stack",
    "data-gap": gap,
  });
}
