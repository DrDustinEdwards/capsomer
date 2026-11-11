import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Alert } from "../banner/banner.react.js";
import { Button } from "../button/button.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { ENGINE_NAME, canRetry, otherEngine, retryLabel, } from "./ai-job-buttons.js";
// A few buttons that each post one AI job, and what came of it: the message with a link to the
// draft it saved, or the error, and a button that runs the same job on the other engine.
export function AiJobButtons({ action, buttons, fields, Form = PlainForm, answer = null, pending = false, engineNames = ENGINE_NAME, openLabel = "Open it", }) {
    const hidden = Object.entries(fields ?? {}).map(([name, value]) => (_jsx("input", { type: "hidden", name: name, value: value }, name)));
    return (_jsxs("div", { className: "cap-ai-jobs", "data-cap": "ai-job-buttons", children: [_jsxs(Form, { method: "post", action: action, className: "cap-ai-jobs-row", "aria-label": "AI jobs", children: [hidden, buttons.map((b) => (_jsx(Button, { type: "submit", name: "job", value: b.job, size: "sm", pending: pending, children: b.label }, b.job)))] }), answer && canRetry(answer) ? (_jsxs(Form, { method: "post", action: action, className: "cap-ai-jobs-row", "aria-label": "Run it again", children: [hidden, _jsx("input", { type: "hidden", name: "job", value: answer.job }), _jsx(Button, { type: "submit", name: "engine", value: otherEngine(answer.engine), size: "sm", pending: pending, children: retryLabel(answer.engine, engineNames) })] })) : null, answer?.error ? _jsx(Alert, { tone: "crit", children: answer.error }) : null, answer?.message ? (_jsxs(Alert, { tone: "ok", children: [answer.message, answer.href ? (_jsxs(_Fragment, { children: [" ", _jsx("a", { href: answer.href, children: openLabel })] })) : null] })) : null] }));
}
