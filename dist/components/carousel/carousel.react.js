import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, useEffect, useRef } from "react";
import { Icon, iconChevronLeft, iconChevronRight } from "../icons/icons.react.js";
import { attach, partsOf } from "./carousel.js";
// The carousel's HTML contract (carousel.md), wired by carousel.ts once mounted. Each child is one
// slide. The server renders the first slide in view, every slide's label and every marker, so the
// track scrolls and snaps before hydration.
export function Carousel({ label, slideLabel = (n, total) => `${n} of ${total}`, markerLabel = (n) => `Go to slide ${n}`, status, prevLabel = "Previous slide", nextLabel = "Next slide", trackLabel = "Slides", perView, peek, loop = true, children, }) {
    const root = useRef(null);
    const slides = Children.toArray(children);
    useEffect(() => {
        const parts = root.current && partsOf(root.current);
        return parts ? attach(parts) : undefined;
    }, [slides.length]);
    return (_jsxs("section", { ref: root, className: "cap-carousel", "aria-roledescription": "carousel", "aria-label": label, "data-per-view": perView, "data-peek": peek ? "" : undefined, "data-loop": loop ? undefined : "off", "data-cap-status": status, children: [_jsxs("div", { className: "cap-carousel-viewport", children: [_jsxs("div", { className: "cap-carousel-controls", children: [_jsx("button", { type: "button", "data-cap-dir": "prev", "aria-label": prevLabel, children: _jsx(Icon, { d: iconChevronLeft }) }), _jsx("button", { type: "button", "data-cap-dir": "next", "aria-label": nextLabel, children: _jsx(Icon, { d: iconChevronRight }) })] }), _jsx("div", { className: "cap-carousel-track", tabIndex: 0, role: "group", "aria-label": trackLabel, children: slides.map((slide, i) => (_jsx("div", { role: "group", "aria-roledescription": "slide", "aria-label": slideLabel(i + 1, slides.length), children: slide }, i))) })] }), _jsx("p", { className: "cap-carousel-status cap-sr-only", role: "status", "aria-live": "polite" }), _jsx("nav", { className: "cap-carousel-markers", "aria-label": `Choose a slide: ${label}`, children: slides.map((_, i) => (_jsx("button", { type: "button", "aria-label": markerLabel(i + 1), "aria-current": i === 0 }, i))) })] }));
}
