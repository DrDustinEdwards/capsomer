import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useId, useState } from "react";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
export function DetailPanel({ open, onClose, id, title, identifier, kind, badge, history = false, closeLabel = "Close", children }) {
    // The panel's address is "#detail-<id>"; the shared dialog reads the prefix from the attribute.
    const mark = useCallback((el) => {
        if (el && el.hasAttribute("data-cap-history"))
            el.dataset.capHistory = "detail";
    }, []);
    return (_jsxs(Dialog, { ref: mark, open: open, onOpenChange: () => onClose(), placement: "right", size: "md", className: "cap-detail", id: id, history: history, historyId: id, closeLabel: closeLabel, children: [_jsx(DialogHeader, { divider: true, children: _jsxs("div", { className: "cap-detail-heading", children: [kind ? _jsx("p", { className: "cap-detail-kind", children: kind }) : null, _jsxs("div", { className: "cap-detail-titlerow", children: [_jsx(DialogTitle, { children: title }), badge] }), identifier ? _jsx("p", { className: "cap-detail-id", children: identifier }) : null] }) }), _jsx(DialogBody, { className: "cap-detail-body", children: children })] }));
}
export function DetailSection({ title, children }) {
    const id = useId();
    return (_jsxs("section", { className: "cap-detail-section", "aria-labelledby": id, children: [_jsx("h3", { className: "cap-detail-section-title", id: id, children: title }), children] }));
}
// A command to run, in a sunken mono block, with a Copy button and a line that says
// whether it was copied.
export function DetailCommand({ text, copyLabel = "Copy command", what = "Command" }) {
    const id = useId();
    const [said, setSaid] = useState("");
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setSaid(`${what} copied.`);
        }
        catch {
            const el = document.getElementById(id);
            if (el) {
                const range = document.createRange();
                range.selectNodeContents(el);
                window.getSelection()?.removeAllRanges();
                window.getSelection()?.addRange(range);
            }
            setSaid(`Could not reach the clipboard. ${what} is selected: copy it with Ctrl C or ⌘ C.`);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("pre", { className: "cap-detail-cmd", id: id, children: text }), _jsxs("div", { className: "cap-detail-controls", children: [_jsx("button", { type: "button", className: "cap-btn", onClick: () => void copy(), children: copyLabel }), _jsx("span", { className: "cap-detail-copied", role: "status", children: said })] })] }));
}
