import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { Button } from "../button/button.react.js";
// The HTML contract in ai-sample.md, its `data-cap` hooks included, so a server-rendered page that
// never hydrates still has a form its `enhance()` wires. The page keeps the state (its fetcher);
// this draws it.
export function AiSample({ title, live, children, button, busyLabel = "Generating...", hint, busy, result, failed = "Generation failed. Try again.", onGenerate, onChange, }) {
    const ref = useRef(null);
    // Hydrated, React runs it: marked taken, so the page's enhance() leaves it alone.
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        el.dataset.capReady = "";
        return () => {
            delete el.dataset.capReady;
        };
    }, []);
    const submit = (e) => {
        e.preventDefault();
        if (!busy)
            onGenerate(new FormData(e.currentTarget));
    };
    return (_jsxs("form", { ref: ref, className: "cap-ai-sample", "data-cap": "ai-sample", onSubmit: submit, onChange: onChange, children: [_jsxs("div", { className: "cap-ai-sample-head", children: [_jsx("p", { className: "cap-eyebrow", "data-variant": "mono", children: title }), live ? _jsx("span", { className: "cap-ai-sample-live", children: live }) : null] }), _jsxs("div", { className: "cap-ai-sample-controls", children: [children, _jsxs("div", { className: "cap-ai-sample-action", children: [_jsx(Button, { type: "submit", variant: "primary", pending: busy, pendingLabel: busyLabel, "data-ai-sample-generate": "", "data-busy-label": busyLabel, children: button }), hint ? _jsx("p", { className: "cap-ai-sample-hint", children: hint }) : null] })] }), _jsx("div", { className: "cap-ai-sample-out", "aria-live": "polite", children: busy || !result ? null : "error" in result || result.fields.length === 0 ? (_jsx("p", { className: "cap-ai-sample-error", children: failed })) : (_jsxs("div", { className: "cap-ai-sample-result", children: [result.fields.flatMap((f) => [
                            _jsx("p", { className: "cap-eyebrow cap-ai-sample-label", "data-variant": "mono", children: f.label }, `${f.label}-l`),
                            _jsx("div", { className: "cap-ai-sample-field", "data-variant": f.mono ? "mono" : undefined, children: f.value }, `${f.label}-v`),
                        ]), result.note ? _jsx("p", { className: "cap-ai-sample-note", children: result.note }) : null] })) })] }));
}
