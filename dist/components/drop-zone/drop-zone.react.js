import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { attachDropZone } from "./drop-zone.js";
export function DropZone({ accept, maxBytes, maxFiles, multiple = false, name, disabled, scope = "zone", paste, title, hint, acceptedList = true, onAccepted, onRejected, id, }) {
    const own = useId();
    const base = id ?? own;
    const root = useRef(null);
    // The behavior module does the dropping, pasting and checking; the callbacks reach it through a ref.
    const latest = useRef({ onAccepted, onRejected });
    useLayoutEffect(() => {
        latest.current = { onAccepted, onRejected };
    });
    useEffect(() => {
        const el = root.current;
        if (!el)
            return;
        const detach = attachDropZone(el);
        const tell = (e) => {
            const { accepted, rejected } = e.detail;
            if (e.type === "cap-drop-accepted")
                latest.current.onAccepted?.(accepted, rejected);
            else
                latest.current.onRejected?.(rejected, accepted);
        };
        el.addEventListener("cap-drop-accepted", tell);
        el.addEventListener("cap-drop-rejected", tell);
        return () => {
            el.removeEventListener("cap-drop-accepted", tell);
            el.removeEventListener("cap-drop-rejected", tell);
            detach();
        };
    }, [scope, paste]);
    return (_jsxs("div", { ref: root, className: "cap-drop", "data-cap": "drop-zone", "data-scope": scope === "page" ? "page" : undefined, "data-max-bytes": maxBytes, "data-max-files": maxFiles, "data-paste": paste ? "" : undefined, "data-accepted-list": acceptedList ? undefined : "off", children: [_jsxs("label", { className: "cap-drop-label", children: [_jsx("input", { className: "cap-drop-input", type: "file", name: name, multiple: multiple || (maxFiles ?? 1) > 1, accept: accept, disabled: disabled, "data-cap-part": "input", "aria-labelledby": `${base}-title`, "aria-describedby": `${base}-hint` }), _jsx("span", { className: "cap-drop-icon", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" }) }) }), _jsxs("span", { className: "cap-drop-title", id: `${base}-title`, children: [_jsx("span", { className: "cap-drop-idle", children: title ?? (_jsxs(_Fragment, { children: [multiple ? "Drop files here, or " : "Drop a file here, or ", _jsx("span", { className: "cap-drop-browse", children: "browse" })] })) }), _jsx("span", { className: "cap-drop-over", children: "Drop to upload" })] }), _jsx("span", { className: "cap-drop-hint", id: `${base}-hint`, children: hint })] }), acceptedList ? (_jsx("div", { className: "cap-drop-status", role: "status", "data-cap-part": "status" })) : null, _jsx("div", { className: "cap-drop-rejections", role: "alert", "data-cap-part": "rejections" }), scope === "page" ? (_jsx("div", { className: "cap-drop-overlay", "aria-hidden": "true", children: _jsx("div", { children: _jsx("p", { className: "cap-drop-overlay-title", children: "Drop to upload" }) }) })) : null] }));
}
