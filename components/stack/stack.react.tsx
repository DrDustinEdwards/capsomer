import { createElement, type ReactNode } from "react";

export interface StackProps {
  children?: ReactNode;
  // The space between the children, on the spacing scale (1 to 9); the layout's own gap when omitted.
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  as?:
    | "div"
    | "section"
    | "ul"
    | "ol"
    | "li"
    | "form"
    | "fieldset"
    | "article"
    | "header"
    | "footer";
  className?: string;
  id?: string;
}

// The HTML contract in stack.md. Any other attribute (a ref, an aria or data attribute) is passed through.
export function Stack({ gap, as = "div", className, ...rest }: StackProps) {
  return createElement(as, {
    ...rest,
    className: className ? `cap-stack ${className}` : "cap-stack",
    "data-gap": gap,
  });
}
