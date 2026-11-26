// The markdown editor's plain-DOM kit: element and icon builders, the toolbar glyphs, and the
// context the chrome's pieces (link palette, slash menu, image prompt) are built from.
import { place } from "../popover/popover.js";
const SVG_NS = "http://www.w3.org/2000/svg";
export function el(tag, props = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props))
        node.setAttribute(k, v);
    node.append(...kids);
    return node;
}
export function icon(paths) {
    const svg = document.createElementNS(SVG_NS, "svg");
    for (const [k, v] of Object.entries({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true",
        focusable: "false",
    })) {
        svg.setAttribute(k, v);
    }
    for (const d of paths) {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", d);
        svg.append(p);
    }
    return svg;
}
export const GLYPH = {
    bold: ["M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z"],
    italic: ["M15 4h-5M14 20H9M14 4 10 20"],
    link: [
        "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1",
        "M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
    ],
    heading: ["M6 4v16M18 4v16M6 12h12"],
    code: ["m8 6-6 6 6 6M16 6l6 6-6 6"],
    footnote: ["M4 6h10M4 12h10M4 18h7", "M18 5v6M21 8h-6"],
    image: [
        "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
        "m3 16 5-5 5 5",
        "M15.5 8.5h.01",
    ],
};
// A floating panel is the shared `.cap-popover` (popover.css), shown with the Popover API in
// the top layer so the editor's clipping frame cannot cut it off, and placed by popover.ts's
// `place()` against a virtual anchor: the box of the character at `pos`. It follows the
// window's scroll and resize while it is open.
export function floating(c, panel, pos) {
    const anchor = {
        getBoundingClientRect: () => {
            const at = c.surface()?.coords(pos);
            return at
                ? new DOMRect(at.left, at.top, 0, at.bottom - at.top)
                : c.host.getBoundingClientRect();
        },
    };
    panel.showPopover();
    place(anchor, panel, { side: "bottom", align: "start" });
    let frame = 0;
    const follow = () => {
        if (frame)
            return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            if (panel.isConnected)
                place(anchor, panel, { side: "bottom", align: "start" });
        });
    };
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", follow, true);
        window.removeEventListener("resize", follow);
    };
}
export function dismiss(panel) {
    try {
        if (panel.matches(":popover-open"))
            panel.hidePopover();
    }
    catch {
        // Already gone.
    }
    panel.remove();
}
