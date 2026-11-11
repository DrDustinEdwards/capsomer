import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSyncExternalStore } from "react";
import { isSaved, savedRaw, subscribeSaved, toggleSaved } from "./save-toggle.js";
const ICON = _jsx("path", { d: "M4 2.5h8v11L8 10.5l-4 3z" });
// The HTML contract in save-toggle.md. The server and hydration render "Save"; the stored state
// follows once the page runs, and so does another tab's change.
export function SaveToggle({ storageKey, id, label = "Save", savedLabel = "Saved", }) {
    const saved = isSaved(useSyncExternalStore(subscribeSaved, () => savedRaw(storageKey), () => "[]"), id);
    return (_jsxs("button", { type: "button", className: "cap-chip cap-save", "data-size": "sm", "aria-pressed": saved, onClick: () => toggleSaved(storageKey, id), children: [_jsx("svg", { className: "cap-save-icon", viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: ICON }), _jsx("span", { className: "cap-save-label", children: saved ? savedLabel : label })] }));
}
