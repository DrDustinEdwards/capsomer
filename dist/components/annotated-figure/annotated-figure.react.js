import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { attach, viewBox } from "./annotated-figure.js";
// One drawing: the art, every target, then every leader and label over them, so no fill ever covers
// a leader.
export function AnnotatedDrawing(props) {
    const { id, layout, view, title, description, art, callouts, after } = props;
    const t = `${id}-title`;
    const d = `${id}-desc`;
    return (_jsxs("svg", { className: "cap-annotated-figure-drawing", "data-layout": layout, viewBox: viewBox(view), role: "group", "aria-labelledby": `${t} ${d}`, children: [_jsx("title", { id: t, children: title }), _jsx("desc", { id: d, children: description }), art, callouts.map((c) => (_jsx("g", { className: "cap-annotated-figure-target", "data-callout": c.id, role: "img", "aria-label": c.name, children: c.target }, c.id))), callouts.map((c) => (_jsxs("g", { className: "cap-annotated-figure-leader", "data-callout": c.id, children: [c.leader.map(([x1, y1, x2, y2], j) => (_jsx("line", { x1: x1, y1: y1, x2: x2, y2: y2 }, j))), _jsx("text", { className: "cap-annotated-figure-label", x: c.text.x, y: c.text.y, textAnchor: c.text.anchor, "aria-hidden": "true", children: c.label })] }, c.id))), after] }));
}
// The HTML contract in annotated-figure.md. The lighting is the behavior module's, attached in an
// effect: it only sets data-lit, which React does not render, so React's render stays true.
export function AnnotatedFigure({ id, draw = false, caption, children }) {
    const ref = useRef(null);
    useEffect(() => {
        const figure = ref.current;
        if (!figure || figure.hasAttribute("data-cap-ready"))
            return;
        figure.dataset.capReady = "";
        const off = attach(figure);
        return () => {
            off();
            delete figure.dataset.capReady;
        };
    }, []);
    return (_jsxs("figure", { ref: ref, id: id, className: "cap-annotated-figure", "data-cap": "annotated-figure", "data-draw": draw ? "" : undefined, children: [children, caption ? _jsx("figcaption", { className: "cap-annotated-figure-caption", children: caption }) : null] }));
}
// The key: one ruled box per callout, its number, its drawing, its name and a note.
export function AnnotatedKey({ for: figure, label, entries }) {
    return (_jsx("section", { className: "cap-annotated-key", "aria-label": label, "data-for": figure, children: _jsx("div", { className: "cap-annotated-key-entries", children: entries.map((e) => (_jsxs("figure", { className: "cap-annotated-key-entry", "data-callout": e.id, children: [e.art ? (_jsx("svg", { className: "cap-annotated-key-art", viewBox: `0 0 ${e.size ?? 76} ${e.size ?? 76}`, role: "img", "aria-label": e.artLabel ?? e.name, children: e.art })) : null, _jsxs("figcaption", { children: [_jsx("span", { className: "cap-annotated-key-num", children: e.number }), _jsx("b", { className: "cap-annotated-key-name", children: e.name }), e.note ? _jsx("span", { className: "cap-annotated-key-note", children: e.note }) : null] })] }, e.id))) }) }));
}
