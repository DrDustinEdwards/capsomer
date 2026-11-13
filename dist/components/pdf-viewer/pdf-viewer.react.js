import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { DEFAULT_SCALE, start } from "./pdf-viewer.js";
// The HTML contract in pdf-viewer.md, rendered in its loading state; the behavior starts once.
export function PdfViewer({ src, title, pdfjs = "/pdfjs/" }) {
    const ref = useRef(null);
    useEffect(() => (ref.current ? start(ref.current) : undefined), [src]);
    const label = title ? `PDF viewer, ${title}` : "PDF viewer";
    return (_jsxs("div", { ref: ref, className: "cap-pdf", role: "group", "aria-label": label, "data-cap": "pdf-viewer", "data-src": src, "data-pdfjs": pdfjs, children: [_jsxs("div", { className: "cap-pdf-bar", children: [_jsxs("div", { className: "cap-btn-group", role: "group", "aria-label": "Pages", children: [_jsx("button", { type: "button", disabled: true, className: "cap-btn", "data-size": "sm", "aria-label": "Previous page", "data-pdf": "prev", children: "Previous" }), _jsx("button", { type: "button", disabled: true, className: "cap-btn", "data-size": "sm", "aria-label": "Next page", "data-pdf": "next", children: "Next" })] }), _jsx("p", { className: "cap-pdf-status", "aria-live": "polite", "data-pdf": "status", children: "Loading" }), _jsxs("div", { className: "cap-pdf-zoom", role: "group", "aria-label": "Zoom", children: [_jsx("button", { type: "button", disabled: true, className: "cap-btn", "data-size": "sm", "aria-label": "Zoom out", "data-pdf": "zoom-out", children: "Zoom out" }), _jsxs("span", { className: "cap-pdf-zoom-value", "data-pdf": "zoom", children: [Math.round(DEFAULT_SCALE * 100), "%"] }), _jsx("button", { type: "button", disabled: true, className: "cap-btn", "data-size": "sm", "aria-label": "Zoom in", "data-pdf": "zoom-in", children: "Zoom in" })] })] }), _jsx("div", { 
                // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the page takes focus so the arrow and zoom keys reach it
                tabIndex: 0, className: "cap-pdf-page", role: "group", "aria-label": `${label}. Use the arrow keys to change page and the plus and minus keys to zoom.`, children: _jsx("canvas", {}) }), _jsx("p", { className: "cap-pdf-fallback", children: _jsx("a", { href: src, children: "Open the PDF" }) })] }));
}
