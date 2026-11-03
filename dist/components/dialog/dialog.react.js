import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { closeDialog, openDialog, setDialogBusy, wireDialog } from "./dialog.js";
const Ctx = createContext(null);
const CLOSE_ICON = _jsx("path", { d: "M4 4l8 8M12 4l-8 8", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" });
export function Dialog(props) {
    const { open, onOpenChange, placement = "center", size = "md", alert = false, modalLock, destructive, busy, history = false, historyId, closeButton = !alert, closeLabel = "Close", returnTo, initialFocus, described = false, ref, className, children, ...rest } = props;
    const id = useId();
    const own = useRef(null);
    const [hasDescription, setDescribed] = useState(described);
    const labeled = rest["aria-label"] == null && rest["aria-labelledby"] == null;
    const setRefs = useCallback((el) => {
        own.current = el;
        if (typeof ref === "function")
            ref(el);
        else if (ref)
            ref.current = el;
    }, [ref]);
    // Wired once the markup is on the page; the markup itself is complete without it.
    useEffect(() => {
        const d = own.current;
        return d ? wireDialog(d) : undefined;
    }, []);
    useEffect(() => {
        const d = own.current;
        if (!d)
            return;
        if (open && !d.open)
            openDialog(d, document.activeElement, { history, returnTo, focus: initialFocus?.current ?? null });
        else if (!open && d.open)
            closeDialog(d);
    }, [open, history, returnTo, initialFocus]);
    // Close and Cancel say they are refusing while busy.
    useEffect(() => {
        if (own.current)
            setDialogBusy(own.current, !!busy);
    }, [busy]);
    return (_jsx(Ctx.Provider, { value: { title: `${id}-title`, description: `${id}-description`, setDescribed }, children: _jsxs("dialog", { ...rest, ref: setRefs, className: className ? `cap-dialog ${className}` : "cap-dialog", "data-cap": "dialog", "data-placement": placement, "data-size": size, "data-cap-modal-lock": modalLock ? "" : undefined, "data-cap-destructive": destructive ? "" : undefined, "data-cap-history": history ? "" : undefined, "data-cap-history-id": history ? historyId : undefined, role: alert ? "alertdialog" : undefined, "aria-labelledby": rest["aria-labelledby"] ?? (labeled ? `${id}-title` : undefined), "aria-describedby": rest["aria-describedby"] ?? (hasDescription ? `${id}-description` : undefined), "aria-busy": busy || undefined, onClose: () => onOpenChange(false), children: [children, closeButton && _jsx(DialogClose, { label: closeLabel })] }) }));
}
export function DialogHeader({ className, divider, ...rest }) {
    return _jsx("div", { ...rest, className: className ? `cap-dialog-header ${className}` : "cap-dialog-header", "data-divider": divider ? "" : undefined });
}
export function DialogTitle({ className, ...rest }) {
    const ids = useContext(Ctx);
    return _jsx("h2", { id: ids?.title, ...rest, className: className ? `cap-dialog-title ${className}` : "cap-dialog-title" });
}
export function DialogDescription({ className, ...rest }) {
    const ids = useContext(Ctx);
    const set = ids?.setDescribed;
    useEffect(() => {
        set?.(true);
        return () => set?.(false);
    }, [set]);
    return _jsx("p", { id: ids?.description, ...rest, className: className ? `cap-dialog-description ${className}` : "cap-dialog-description" });
}
// An icon tile beside the title, as Alert Dialog's media.
export function DialogMedia({ className, tone, ...rest }) {
    return _jsx("div", { "aria-hidden": "true", ...rest, className: className ? `cap-dialog-media ${className}` : "cap-dialog-media", "data-tone": tone });
}
// The part that scrolls when the content is taller than the screen.
export function DialogBody({ className, flush, ...rest }) {
    return _jsx("div", { ...rest, className: className ? `cap-dialog-body ${className}` : "cap-dialog-body", "data-flush": flush ? "" : undefined });
}
export function DialogFooter({ className, align, ...rest }) {
    return _jsx("div", { ...rest, className: className ? `cap-dialog-footer ${className}` : "cap-dialog-footer", "data-align": align });
}
// A Close part. With no children it is the corner icon button; with children it is a button
// that closes (a Cancel in the footer: `<DialogClose part="cancel">Cancel</DialogClose>`).
export function DialogClose({ label = "Close", part = "close", children, className, onClick, ...rest }) {
    if (children != null) {
        return (_jsx("button", { type: "button", ...rest, className: className ? `cap-btn ${className}` : "cap-btn", "data-cap-part": part, onClick: onClick, children: children }));
    }
    return (_jsx("button", { type: "button", ...rest, className: `cap-btn cap-dialog-close${className ? ` ${className}` : ""}`, "data-variant": "quiet", "data-icon-only": "", "data-cap-part": part, "aria-label": label, onClick: onClick, children: _jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", "aria-hidden": "true", focusable: "false", children: CLOSE_ICON }) }));
}
// The state a trigger and a Dialog share: `const d = useDialog(); <button onClick={d.show}>`
// and `<Dialog {...d.props}>`. Focus goes back to the button that was focused when show ran.
export function useDialog(initial = false) {
    const [open, setOpen] = useState(initial);
    const show = useCallback(() => setOpen(true), []);
    const hide = useCallback(() => setOpen(false), []);
    const toggle = useCallback(() => setOpen((o) => !o), []);
    return { open, show, hide, toggle, props: { open, onOpenChange: setOpen } };
}
