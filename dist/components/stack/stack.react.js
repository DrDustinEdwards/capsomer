import { createElement } from "react";
// The HTML contract in stack.md. The element's (or component's) own props pass through.
export function Stack({ gap, as, className, ...rest }) {
    return createElement(as ?? "div", {
        ...rest,
        className: className ? `cap-stack ${className}` : "cap-stack",
        "data-gap": gap,
    });
}
