import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef } from "react";
import { enhance, renderCompare, renderPatch, setView, VIEWS } from "./draft-compare.js";
// Renders exactly the markup renderCompare writes, so a server render (renderToString) and the
// browser agree, and the same behavior module wires it.
export function DraftCompare({ before, after, labels, view, onViewChange, context, runs, similarity, id }) {
    const own = useId().replace(/[^a-zA-Z0-9]/g, "");
    const host = useRef(null);
    const first = useRef(view ?? "side");
    const controlled = view !== undefined;
    const key = JSON.stringify([before, after, labels, runs, context, similarity, id, controlled]);
    // The view is not part of the html's identity: the radios hold it, in CSS, so choosing one
    // does not rebuild the page's folds and focus.
    const html = useMemo(() => renderCompare(before, after, { id: id ?? `compare-${own}`, view: first.current, context, labels, runs, similarity, remember: !controlled }), [key, own]);
    useEffect(() => {
        const el = host.current;
        return el ? enhance(el) : undefined;
    }, [html]);
    useEffect(() => {
        const section = host.current?.querySelector(".cap-compare");
        if (section && view)
            setView(section, view);
    }, [view, html]);
    useEffect(() => {
        const el = host.current;
        if (!el || !onViewChange)
            return undefined;
        const onChange = (e) => {
            const t = e.target;
            if (t.matches(".cap-compare-bar input[type='radio']") && VIEWS.includes(t.value))
                onViewChange(t.value);
        };
        el.addEventListener("change", onChange);
        return () => el.removeEventListener("change", onChange);
    }, [onViewChange, html]);
    return _jsx("div", { ref: host, dangerouslySetInnerHTML: { __html: html } });
}
// The patch mode: a unified patch by line, with a literal plus or minus on each changed line.
// Pure markup, so a server render and the browser agree; there is no behavior to attach.
export function DraftPatch({ patch, title, id }) {
    const own = useId().replace(/[^a-zA-Z0-9]/g, "");
    const html = useMemo(() => renderPatch(patch, { id: id ?? `patch-${own}`, title }), [patch, title, id, own]);
    return _jsx("div", { dangerouslySetInnerHTML: { __html: html } });
}
