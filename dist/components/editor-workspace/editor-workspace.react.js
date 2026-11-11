import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Editor workspace in React: the layout switch and its remembered choice, the two panes, the
// sandboxed preview, the preview's refresh once typing pauses, Ctrl or Cmd+S, and the chrome that
// steps back while someone types (editor-workspace.ts).
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, } from "react";
import { Segmented } from "../segmented/segmented.react.js";
import { LAYOUT_KEY, onSaveKey, readLayout, storeLayout, storedLayout, typingRecede, } from "./editor-workspace.js";
// One store for every hook reading a key, so two switches on a page stay in step. When storage is
// refused the choice is kept for this page in memory.
const memory = new Map();
const listeners = new Set();
const subscribe = (listener) => {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
};
// The layout remembered in this browser under `key`; Write on the server and in the render that
// hydrates, so they agree, then the stored one.
export function useWorkspaceLayout(key = LAYOUT_KEY) {
    const layout = useSyncExternalStore(subscribe, () => storedLayout(key) ?? memory.get(key) ?? "write", () => "write");
    const choose = useCallback((next) => {
        memory.set(key, next);
        storeLayout(next, key);
        for (const l of listeners)
            l();
    }, [key]);
    return [layout, choose];
}
// Ctrl or Cmd+S calls `save` in place of the browser's save-page; `save` decides whether a save
// may run now. The latest `save` is called, so it may close over fresh state.
export function useSaveShortcut(save) {
    const latest = useRef(save);
    useLayoutEffect(() => {
        latest.current = save;
    });
    useEffect(() => onSaveKey(() => latest.current()), []);
}
// The chrome steps back while someone types in a writing surface (`.cm-editor`, or any element
// with data-cap-typing-surface), and returns on a mouse move or when focus enters it.
export function useTypingRecede(surface) {
    useEffect(() => typingRecede(surface ? { surface } : {}), [surface]);
}
// A stamp that changes `delay` ms after `value` stops changing: the preview's refresh, so the
// site renders the text once the typing pauses, not on every key.
export function usePausedStamp(value, delay = 2000, initial = "") {
    const [stamp, setStamp] = useState(initial);
    // The value the stamp was last taken for: a mount (or StrictMode's second mount) is no change.
    const seen = useRef(value);
    useEffect(() => {
        if (Object.is(seen.current, value))
            return;
        const timer = window.setTimeout(() => {
            seen.current = value;
            setStamp(Date.now().toString(36));
        }, delay);
        return () => window.clearTimeout(timer);
    }, [value, delay]);
    return stamp;
}
// Write, Split, Preview: the Segmented control, small, its legend hidden.
export function LayoutSwitch({ value, onChange, legend = "Layout", labels = {}, }) {
    return (_jsx("div", { "data-cap-layout": "", children: _jsx(Segmented, { legend: legend, hideLegend: true, size: "sm", value: value, onChange: (v) => onChange(readLayout(v)), options: [
                { value: "write", label: labels.write ?? "Write" },
                { value: "split", label: labels.split ?? "Split" },
                { value: "preview", label: labels.preview ?? "Preview" },
            ] }) }));
}
// The two panes: one column, or side by side in Split once the workspace is 48rem wide.
export function EditorWorkspace({ layout, write, preview, writeLabel = "Write", writeId = "write", }) {
    return (_jsx("div", { className: "cap-workspace", children: _jsxs("div", { className: "cap-workspace-body", "data-layout": layout, children: [layout !== "preview" ? (_jsx("section", { className: "cap-workspace-pane", "data-pane": "write", id: writeId, "aria-label": writeLabel, children: write })) : null, layout !== "write" ? preview : null] }) }));
}
// The site's own page in a frame with an empty sandbox: it runs no script and has an opaque
// origin, so a post's markup cannot reach the app.
export function PreviewPane({ src, title, label = "Preview", name }) {
    return (_jsx("section", { className: "cap-preview-pane", "data-pane": "preview", "aria-label": label, children: _jsx("iframe", { title: title, src: src, name: name, sandbox: "" }) }));
}
export { LAYOUTS, LAYOUT_KEY, previewUrl, readLayout } from "./editor-workspace.js";
