import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SHARE_NAMES, shareHref } from "./share-row.js";
// The services' marks, drawn on a 14px grid in currentColor. X's and LinkedIn's are the paths
// Foxhound carried from Recova's ShareBar.
const MARKS = {
    x: (_jsx("path", { d: "M10.93.5h2.12L8.36 6.14 14 13.5h-3.89L6.72 8.87 2.76 13.5H.64l5.02-5.95L0 .5h3.99l3.06 4.56L10.93.5Zm-.74 11.7h1.17L3.9 1.69H2.65l7.54 10.51Z" })),
    linkedin: (_jsx("path", { d: "M12.833 0H1.163C.52 0 0 .507 0 1.133v11.734C0 13.493.52 14 1.163 14h11.67C13.48 14 14 13.493 14 12.867V1.133C14 .507 13.48 0 12.833 0ZM4.153 11.9H2.073V5.25h2.08v6.65ZM3.113 4.34a1.205 1.205 0 1 1 0-2.41 1.205 1.205 0 0 1 0 2.41ZM11.9 11.9H9.82V8.667c0-.777-.014-1.777-1.083-1.777-1.083 0-1.25.846-1.25 1.72V11.9H5.41V5.25h1.997v.91h.028c.277-.524.956-1.077 1.966-1.077 2.103 0 2.492 1.384 2.492 3.184V11.9H11.9Z" })),
    bluesky: (_jsx("path", { d: "M3.03 1.6C4.64 2.8 6.37 5.25 7 6.56c.63-1.31 2.36-3.76 3.97-4.96C12.13.73 14 .06 14 2.2c0 .43-.25 3.6-.39 4.11-.5 1.79-2.33 2.25-3.96 1.97 2.85.49 3.58 2.1 2.01 3.7-2.97 3.05-4.27-.76-4.6-1.74L7 10.06l-.06.18c-.33.98-1.63 4.79-4.6 1.74-1.57-1.6-.84-3.21 2.01-3.7-1.63.28-3.46-.18-3.96-1.97C.25 5.8 0 2.63 0 2.2 0 .06 1.87.73 3.03 1.6Z" })),
    facebook: (_jsx("path", { d: "M14 7a7 7 0 1 0-8.09 6.92V9.03H4.13V7h1.78V5.46c0-1.75 1.04-2.72 2.64-2.72.77 0 1.57.14 1.57.14v1.72h-.88c-.87 0-1.14.54-1.14 1.09V7h1.94l-.31 2.03H8.1v4.89A7 7 0 0 0 14 7Z" })),
    email: (_jsx("path", { d: "M1 3h12v8H1zm.8.8L7 7.9l5.2-4.1", fill: "none", stroke: "currentColor", strokeWidth: "1.2", strokeLinejoin: "round" })),
};
// The HTML contract in share-row.md.
export function ShareRow({ url, title, targets = ["x", "linkedin"], label = "Share", children, }) {
    return (_jsxs("div", { className: "cap-share", role: "group", "aria-label": "Share this page", children: [_jsx("span", { className: "cap-share-label", "aria-hidden": "true", children: label }), targets.map((t) => (_jsxs("a", { className: "cap-share-link", href: shareHref(t, url, title), "aria-label": `Share on ${SHARE_NAMES[t]}`, ...(t === "email" ? {} : { rel: "external noopener" }), children: [_jsx("svg", { viewBox: "0 0 14 14", width: "14", height: "14", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: MARKS[t] }), SHARE_NAMES[t]] }, t))), children] }));
}
