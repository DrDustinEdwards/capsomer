import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The HTML contract in ai-sample.md. The page keeps the state (its fetcher); this draws it.
export function AiSample({ title, live, children, button, busyLabel = "Generating...", hint, busy, result, failed = "Generation failed. Try again.", onGenerate, onChange, }) {
    const submit = (e) => {
        e.preventDefault();
        onGenerate(new FormData(e.currentTarget));
    };
    return (_jsxs("form", { className: "cap-ai-sample", onSubmit: submit, onChange: onChange, children: [_jsxs("div", { className: "cap-ai-sample-head", children: [_jsx("p", { className: "cap-ai-sample-title", children: title }), live ? _jsx("span", { className: "cap-ai-sample-live", children: live }) : null] }), _jsxs("div", { className: "cap-ai-sample-controls", children: [children, _jsxs("div", { className: "cap-ai-sample-action", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", disabled: busy, "aria-busy": busy ? "true" : undefined, children: busy ? _jsx("span", { className: "cap-btn-label", children: busyLabel }) : button }), hint ? _jsx("p", { className: "cap-ai-sample-hint", children: hint }) : null] })] }), _jsx("div", { className: "cap-ai-sample-out", "aria-live": "polite", children: busy || !result ? null : "error" in result || result.fields.length === 0 ? (_jsx("p", { className: "cap-ai-sample-error", children: failed })) : (_jsxs("div", { className: "cap-ai-sample-result", children: [result.fields.flatMap((f) => [
                            _jsx("p", { className: "cap-ai-sample-label", children: f.label }, `${f.label}-l`),
                            _jsx("div", { className: "cap-ai-sample-field", "data-variant": f.mono ? "mono" : undefined, children: f.value }, `${f.label}-v`),
                        ]), result.note ? _jsx("p", { className: "cap-ai-sample-note", children: result.note }) : null] })) })] }));
}
