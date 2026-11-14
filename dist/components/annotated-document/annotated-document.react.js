import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { bring } from "./annotated-document.js";
const VIEWS = { original: "Original", edited: "Simple markup", all: "All markup" };
// The HTML contract in annotated-document.md. The view and the lit note are React state, and the
// linking is done here with the behavior module's `bring`, so `enhance()` is not needed (or used).
export function AnnotatedDocument({ children, notes, name, label = "Markup view", views = VIEWS, view = "edited", docLabel = "Document", notesLabel = "Notes", hideNotesInOriginal, viewAlign, kind, }) {
    const own = useId();
    const [shown, setShown] = useState(view);
    // The note that is lit, and where it was chosen from (its passages or the rail).
    const [lit, setLit] = useState(null);
    const doc = useRef(null);
    const rail = useRef(null);
    // The passages are the app's children, not elements this component renders, so they are marked
    // through the DOM after the render.
    useEffect(() => {
        const box = doc.current;
        if (!box)
            return;
        const marks = [...box.querySelectorAll("mark[data-note]")];
        for (const m of marks)
            m.toggleAttribute("data-lit", m.dataset.note === lit?.id);
        if (!lit)
            return;
        const first = marks.find((m) => m.dataset.note === lit.id);
        const note = rail.current?.querySelector(`.cap-annotated-note[data-note="${CSS.escape(lit.id)}"]`);
        if (lit.from === "note" && first)
            bring(box, first, 40);
        if (lit.from === "passage" && note && rail.current)
            bring(rail.current, note, 12);
    }, [lit, children]);
    const toggle = (id, from) => setLit((cur) => (cur?.id === id ? null : { id, from }));
    // A passage clicked lights its note: a pointer shortcut only, every passage is reached from the
    // keyboard through its note.
    useEffect(() => {
        const box = doc.current;
        if (!box)
            return;
        const onClick = (e) => {
            const id = e.target.closest("mark[data-note]")?.dataset.note;
            if (id && notes.some((n) => n.id === id))
                setLit((cur) => (cur?.id === id ? null : { id, from: "passage" }));
        };
        box.addEventListener("click", onClick);
        return () => box.removeEventListener("click", onClick);
    }, [notes]);
    return (_jsxs("div", { className: "cap-annotated", "data-hide-notes": hideNotesInOriginal ? "original" : undefined, "data-view-align": viewAlign, "data-kind": kind, children: [_jsxs("fieldset", { className: "cap-seg cap-annotated-view", children: [_jsx("legend", { className: "cap-sr-only", children: label }), _jsx("div", { className: "cap-seg-options", children: ["original", "edited", "all"].map((v) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: name ?? own, value: v, checked: v === shown, onChange: () => {
                                        setShown(v);
                                        setLit(null);
                                    } }), " ", views[v]] }, v))) })] }), _jsxs("div", { className: "cap-annotated-layout", children: [_jsx("div", { ref: doc, className: "cap-annotated-doc", role: "region", "aria-label": docLabel, tabIndex: 0, children: children }), _jsx("ul", { ref: rail, className: "cap-annotated-notes", "aria-label": notesLabel, children: notes.map((n) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "cap-annotated-note", "data-note": n.id, "data-tone": n.tone, "aria-pressed": lit?.id === n.id, onClick: () => toggle(n.id, "note"), children: [n.icon ? (_jsx("span", { className: "cap-annotated-note-icon", "aria-hidden": "true", children: n.icon })) : null, _jsx("span", { className: "cap-annotated-note-kind", children: n.kind }), _jsx("span", { className: "cap-annotated-note-text", children: n.text })] }) }, n.id))) })] })] }));
}
