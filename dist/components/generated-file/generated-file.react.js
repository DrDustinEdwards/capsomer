import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../button/button.react.js";
import { Panel } from "../panel/panel.react.js";
import { Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { STATE_WORDS, fileMeta, fileState, } from "./generated-file.js";
const TONES = {
    none: "nodata",
    generating: "info",
    ready: "ok",
    stale: "warn",
    failed: "crit",
};
function sentence(state, view, messages, generate) {
    const own = messages?.[state];
    if (own != null)
        return own;
    const made = view.generatedAt !== null ? _jsx(Time, { at: view.generatedAt, format: "exact" }) : null;
    switch (state) {
        case "none":
            return "Nothing has been generated yet.";
        case "generating":
            return view.hasFile
                ? "This can take a minute. The current file stays available until the new one is ready; refresh to see it."
                : "This can take a minute; refresh to see the result.";
        case "ready":
            return made ? _jsxs(_Fragment, { children: ["Made ", made, "."] }) : "Made and stored.";
        case "stale": {
            // With no Generate button there is nothing to press, so the sentence asks for nothing.
            const then = generate ? " Regenerate it to include them." : "";
            return made ? (_jsxs(_Fragment, { children: ["Made ", made, ", before the latest changes.", then] })) : (`Made before the latest changes.${then}`);
        }
        case "failed":
            return `${view.reason ?? "The last run failed."}${generate ? " Try again." : ""}`;
    }
}
const plainForm = (action) => ({ className, children }) => (_jsx("form", { method: "post", action: action, className: className, children: children }));
// The HTML contract in generated-file.md: a panel with the state's word and sentence, the
// download link with its format and size, and the Generate or Regenerate button.
export function GeneratedFile({ title, description, record, now, lockMs, format = "PDF", downloadHref, downloadLabel = `Download the ${format}`, generateLabel = `Generate the ${format}`, regenerateLabel = `Regenerate the ${format}`, action, fields, renderForm, generate = true, busy = false, messages, level = 2, children, }) {
    const view = fileState(record, now, lockMs);
    const { state } = view;
    const running = state === "generating" || busy;
    const label = state === "none" ? generateLabel : regenerateLabel;
    const form = renderForm ?? plainForm(action);
    return (_jsx(Panel, { title: title, level: level, description: description, className: "cap-generated", footer: generate || children != null ? (_jsxs("div", { className: "cap-generated-actions", children: [generate &&
                    form({
                        className: "cap-generated-form",
                        children: (_jsxs(_Fragment, { children: [Object.entries(fields ?? {}).map(([name, value]) => (_jsx("input", { type: "hidden", name: name, value: value }, name))), _jsx(Button, { type: "submit", variant: state === "ready" ? "default" : "primary", pending: running, children: running ? "Generating" : label })] })),
                    }), children] })) : undefined, children: _jsxs("div", { className: "cap-generated-body", "data-state": state, children: [_jsxs("p", { className: "cap-generated-status", role: "status", children: [_jsx(Status, { tone: TONES[state], running: state === "generating", children: STATE_WORDS[state] }), " ", _jsx("span", { className: "cap-generated-says", children: sentence(state, view, messages, generate) })] }), view.hasFile && (_jsxs("p", { className: "cap-generated-file", children: [_jsx("a", { href: downloadHref, "data-link": "file", download: true, children: downloadLabel }), " ", _jsx("span", { className: "cap-link-meta", children: fileMeta(format, view.bytes) })] }))] }) }));
}
