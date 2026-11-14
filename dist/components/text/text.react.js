import { createElement } from "react";
// The HTML contract in text.md.
export function Title({ size, as, className, ...rest }) {
    return createElement(as ?? "h2", {
        ...rest,
        className: className ? `cap-title ${className}` : "cap-title",
        "data-size": size === 4 ? undefined : size,
    });
}
export function Text({ size, tone, weight, face, align, as, className, ...rest }) {
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
