import { createElement } from "react";
// The HTML contract in stack.md. The element's own props pass through.
export function Stack({ gap, as = "div", className, ...rest }) {
    return createElement(as, {
        ...rest,
        className: className ? `cap-stack ${className}` : "cap-stack",
        "data-gap": gap,
    });
}
