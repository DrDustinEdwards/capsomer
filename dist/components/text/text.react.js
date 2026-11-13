import { createElement } from "react";
// The HTML contract in text.md.
export function Title({ size, as = "h2", className, ...rest }) {
    return createElement(as, {
        ...rest,
        className: className ? `cap-title ${className}` : "cap-title",
        "data-size": size === 4 ? undefined : size,
    });
}
export function Text({ size, tone, weight, face, align, as = "p", className, ...rest }) {
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
