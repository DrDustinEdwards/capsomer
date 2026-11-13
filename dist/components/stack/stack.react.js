import { createElement } from "react";
// The HTML contract in stack.md. Any other attribute (a ref, an aria or data attribute) is passed through.
export function Stack({ gap, as = "div", className, ...rest }) {
    return createElement(as, {
        ...rest,
        className: className ? `cap-stack ${className}` : "cap-stack",
        "data-gap": gap,
    });
}
