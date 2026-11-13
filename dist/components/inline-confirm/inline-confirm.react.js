import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { useHydrated } from "../hooks/hooks.react.js";
// A two-step action in place, for a row's one risky button: the button gives way to the
// question with the confirm and Cancel beside it. It works with no script (the first step is
// a link to the page with the question open), and with script opens in place. Focus follows
// the swap: opening lands on Cancel, never on the confirm, so a second Enter cannot act;
// Cancel returns to the first button.
export function InlineConfirm({ label, labelDetail, question, confirmLabel, cancelLabel = "Cancel", openHref, closeHref, defaultOpen = false, pending = false, pendingLabel, tone = "danger", size = "sm", form = "form", method = "post", action, children, }) {
    const ready = useHydrated();
    const [open, setOpen] = useState(defaultOpen);
    // Opened by the page's address: Cancel takes focus when it first shows.
    const [byAddress] = useState(defaultOpen);
    const moved = useRef(false);
    const opener = useRef(null);
    const cancel = useRef(null);
    const qid = useId();
    useEffect(() => {
        if (!moved.current)
            return;
        moved.current = false;
        (open ? cancel.current : opener.current)?.focus();
    }, [open]);
    const swap = (to) => {
        moved.current = true;
        setOpen(to);
    };
    const btn = { className: "cap-btn", "data-size": size === "sm" ? "sm" : undefined };
    const words = (_jsxs(_Fragment, { children: [label, labelDetail ? _jsx("span", { className: "cap-sr-only", children: labelDetail }) : null] }));
    if (!open)
        return ready ? (_jsx("button", { type: "button", ...btn, "data-variant": "quiet", ref: opener, onClick: () => swap(true), children: words })) : (_jsx("a", { href: openHref, ...btn, "data-variant": "quiet", children: words }));
    const Form = form;
    return (_jsxs(Form, { method: method, action: action, className: "cap-inline-confirm", "aria-labelledby": qid, children: [children, _jsx("span", { className: "cap-inline-confirm-question", id: qid, children: question }), _jsxs("span", { className: "cap-inline-confirm-actions", children: [_jsx("button", { type: "submit", ...btn, "data-variant": tone === "danger" ? "danger" : "primary", "aria-describedby": qid, "aria-busy": pending || undefined, "aria-disabled": pending || undefined, onClick: (e) => {
                            if (pending)
                                e.preventDefault();
                        }, children: pending ? (pendingLabel ?? confirmLabel) : confirmLabel }), pending ? null : ready ? (_jsx("button", { type: "button", ...btn, "data-variant": "quiet", ref: cancel, 
                        // oxlint-disable-next-line jsx-a11y/no-autofocus -- a confirm opened by the page's address lands on Cancel, so Enter cannot act
                        autoFocus: byAddress, onClick: () => swap(false), children: cancelLabel })) : (_jsx("a", { href: closeHref, ...btn, "data-variant": "quiet", children: cancelLabel }))] })] }));
}
