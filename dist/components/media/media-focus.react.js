import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// The focal point of one image (MediaInspector; ported from Carrel's focus picker): the point a site's
// crops are cut around (site-runtime ./image, the file's `focus`). Click the picture, or move the point
// with the arrow keys, and see the crops the site may cut. The two fields are the control itself, so
// the form works with no script, posting `intent=focus` with `x` and `y` in percent (the content kit
// reads them) or `clear=yes`; the picture and the previews follow them. The point is placed through
// custom properties set from a ref, never a style attribute in the markup.
import { useEffect, useRef, useState } from "react";
import { focusPercents } from "./media-crop.js";
// The crops shown beside the picture, as a site's pages commonly ask for them.
const PREVIEWS = [
    { label: "Square", ratio: "1:1" },
    { label: "Wide", ratio: "16:9" },
    { label: "Tall", ratio: "4:5" },
];
const clamp = (n) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 10) / 10)) : 50);
export function focusWords(focus) {
    if (!focus)
        return "None: the site guesses";
    const p = focusPercents(focus);
    return `${p.x}% across, ${p.y}% down`;
}
export function MediaFocus({ name, src, focus, action, Form, ident, base, }) {
    const [point, setPoint] = useState(() => focusPercents(focus));
    const frame = useRef(null);
    useEffect(() => {
        frame.current?.style.setProperty("--cap-focus-x", `${point.x}%`);
        frame.current?.style.setProperty("--cap-focus-y", `${point.y}%`);
    }, [point.x, point.y]);
    const set = (x, y) => setPoint({ x: clamp(x), y: clamp(y) });
    return (_jsxs(Form, { method: "post", action: action, className: "cap-media-field-form", "aria-label": "Focal point", children: [ident, _jsxs("p", { className: "cap-field-help", children: ["The part of the picture the site keeps when it crops it to fit. Click the picture to move it. ", focus ? "" : "None yet: the site guesses."] }), _jsxs("div", { className: "cap-media-focus", ref: frame, children: [_jsxs("button", { type: "button", className: "cap-media-focus-frame", "aria-label": `Focal point of ${name}: ${point.x}% across, ${point.y}% down. Click the picture, or use the arrow keys, to move it.`, onClick: (event) => {
                            const box = event.currentTarget.getBoundingClientRect();
                            set(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
                        }, onKeyDown: (event) => {
                            const step = event.shiftKey ? 10 : 2;
                            const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                            const move = moves[event.key];
                            if (!move)
                                return;
                            event.preventDefault();
                            // The inspector's own arrows (another file) must not run as well.
                            event.stopPropagation();
                            set(point.x + move[0], point.y + move[1]);
                        }, children: [_jsx("img", { src: src, alt: "" }), _jsx("span", { className: "cap-media-focus-mark", "aria-hidden": "true" })] }), _jsx("ul", { className: "cap-media-focus-previews", "aria-label": "How the site's crops would look", children: PREVIEWS.map((p) => (_jsxs("li", { "data-ratio": p.ratio, children: [_jsx("img", { src: src, alt: "", loading: "lazy" }), _jsx("span", { children: p.label })] }, p.label))) })] }), _jsxs("div", { className: "cap-media-focus-fields", children: [_jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-fx`, children: "From the left (%)" }), _jsx("input", { className: "cap-input", id: `${base}-fx`, type: "number", name: "x", min: 0, max: 100, step: 0.1, value: point.x, onChange: (e) => set(Number(e.target.value), point.y) })] }), _jsxs("div", { className: "cap-field", children: [_jsx("label", { className: "cap-field-label", htmlFor: `${base}-fy`, children: "From the top (%)" }), _jsx("input", { className: "cap-input", id: `${base}-fy`, type: "number", name: "y", min: 0, max: 100, step: 0.1, value: point.y, onChange: (e) => set(point.x, Number(e.target.value)) })] })] }), _jsxs("div", { className: "cap-media-tool-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: "Save focal point" }), focus ? (_jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", "data-variant": "quiet", name: "clear", value: "yes", children: ["Clear it", _jsx("span", { className: "cap-sr-only", children: " and let the site guess" })] })) : null] })] }));
}
