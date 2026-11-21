import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { markup } from "./trusted-html.js";
/**
 * Stored, already sanitized HTML as an element's children, through the `capsomer` Trusted Types policy.
 * React sets it with `innerHTML` in the browser; `markup()` hands it TrustedHTML, and the same object
 * for the same string, so a re-render does not set it again. No `style` is rendered (style-src 'self').
 */
export function RichText({ html, as: Tag = "div", measure, fallback = null, className, ...rest }) {
    if (!html)
        return _jsx(_Fragment, { children: fallback });
    // A style that reached here past the types is dropped, never rendered.
    const { style: _style, ...attrs } = rest;
    return (_jsx(Tag, { ...attrs, className: className ? `cap-rich-text ${className}` : "cap-rich-text", "data-measure": measure ? "text" : undefined, dangerouslySetInnerHTML: markup(html) }));
}
