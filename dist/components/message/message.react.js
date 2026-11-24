import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from "react";
import { kindGlyph, currentUndo, isUndoKey, messageKind, lasting, newMessage, resolveFocus, syncTimers, undoBusy, undoDone, undoFailed, withMessage, } from "./message.js";
import { markup } from "../trusted-html/trusted-html.js";
const MessageContext = createContext(null);
export function MessageProvider({ children, region = true, undoKey = true }) {
    const [messages, setMessages] = useState([]);
    // The truth between renders: an Undo that finishes later reads the list as it is then.
    const live = useRef([]);
    const nextId = useRef(1);
    const origin = useRef(null);
    const regionRef = useRef(null);
    const timers = useRef(new Map());
    // Where focus goes after the render that removes the button that had it.
    const settle = useRef(null);
    const commit = useCallback((next, s) => {
        if (s?.to || regionRef.current?.contains(document.activeElement))
            settle.current = s ?? {};
        live.current = next;
        setMessages(next);
        syncTimers(timers.current, next, (id) => 
        // oxlint-disable-next-line react/immutability -- the timer calls commit long after it is defined
        commit(live.current.filter((x) => x.id !== id), { origin: true }));
    }, []);
    useEffect(() => {
        const t = timers.current;
        return () => {
            for (const id of t.values())
                window.clearTimeout(id);
            t.clear();
        };
    }, []);
    const say = useCallback((text, opts = {}) => {
        const active = document.activeElement;
        if (active && active !== document.body && !regionRef.current?.contains(active))
            origin.current = active;
        commit(withMessage(live.current, newMessage(nextId.current++, text, opts)));
    }, [commit]);
    const fail = useCallback((text) => say(text, { failure: true }), [say]);
    const dismiss = useCallback(() => commit([], { origin: true }), [commit]);
    const dismissOne = useCallback((id) => {
        if (live.current.find((m) => m.id === id)?.busy)
            return;
        commit(live.current.filter((m) => m.id !== id), { origin: true });
    }, [commit]);
    const runUndo = useCallback(async (id) => {
        const m = id === undefined ? currentUndo(live.current) : live.current.find((x) => x.id === id);
        if (!m?.undo || m.busy)
            return;
        const run = m.undo;
        commit(undoBusy(live.current, m.id));
        try {
            await run();
        }
        catch (err) {
            // The message stays too, so it can say why.
            if (live.current.some((x) => x.id === m.id))
                commit(undoFailed(live.current, m.id, err));
            return;
        }
        const to = resolveFocus(m.returnFocus);
        // The Undo may have said something itself, which replaced this message.
        if (!live.current.some((x) => x.id === m.id))
            return;
        commit(undoDone(live.current, m, () => nextId.current++), { to, id: m.id });
    }, [commit]);
    // After a render that removed the focused button, focus goes where the caller said, else
    // to that message's Dismiss, else back to the control that caused the message, else the
    // main region.
    useEffect(() => {
        const s = settle.current;
        if (!s)
            return;
        settle.current = null;
        if (s.to)
            return s.to.focus();
        const region = regionRef.current;
        if (region?.contains(document.activeElement))
            return;
        const back = origin.current instanceof HTMLElement && origin.current.isConnected ? origin.current : null;
        if (s.origin)
            return (back ?? document.querySelector("main"))?.focus();
        const own = s.id === undefined
            ? null
            : region?.querySelector(`[data-id="${s.id}"] [data-cap-part="dismiss"]`);
        const any = own ?? region?.querySelector("[data-cap-part='dismiss']");
        if (any)
            return any.focus();
        (back ?? document.querySelector("main"))?.focus();
    }, [messages]);
    // `z` runs the current Undo.
    const hasUndo = !!currentUndo(messages);
    useEffect(() => {
        if (!undoKey || !hasUndo)
            return;
        const onKey = (e) => {
            if (!isUndoKey(e))
                return;
            e.preventDefault();
            void runUndo();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [undoKey, hasUndo, runUndo]);
    const value = useMemo(() => ({ say, fail, dismiss, messages, runUndo, dismissOne, regionRef }), [say, fail, dismiss, messages, runUndo, dismissOne]);
    return (_jsxs(MessageContext.Provider, { value: value, children: [children, region ? _jsx(MessageRegion, {}) : null] }));
}
export function useMessage() {
    const api = useOptionalMessage();
    if (!api)
        throw new Error("useMessage needs a <MessageProvider> above it.");
    return api;
}
// The same API, or null when no <MessageProvider> is above: for a component that says its
// results in the page's region when there is one and works without it (a form that posts).
// One object while the provider's callbacks hold, so an effect that depends on it does not re-run each render.
export function useOptionalMessage() {
    const ctx = useContext(MessageContext);
    const { say, fail, dismiss } = ctx ?? {};
    return useMemo(() => (say && fail && dismiss ? { say, fail, dismiss } : null), [say, fail, dismiss]);
}
// The region itself. One per page. It has no data-cap attribute, so the plain behavior
// module never attaches to a region React owns.
export function MessageRegion() {
    const ctx = useContext(MessageContext);
    if (!ctx)
        throw new Error("MessageRegion needs a <MessageProvider> above it.");
    const { messages, runUndo, dismissOne, regionRef } = ctx;
    return (_jsx("div", { className: "cap-message", role: "status", "aria-label": "Results and failures", "aria-atomic": "false", ref: regionRef, children: messages.map((m) => (_jsxs("div", { className: "cap-message-item", "data-cap-part": "item", "data-id": m.id, "data-lasting": lasting(m) ? "" : undefined, "data-kind": messageKind(m), children: [_jsx("svg", { className: "cap-message-glyph", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: markup(kindGlyph(messageKind(m))) }), _jsxs("p", { className: "cap-message-text", "data-cap-part": "text", children: [_jsx("span", { "data-cap-part": "said", role: m.failure ? "alert" : undefined, children: m.text }), m.warning !== null ? (_jsxs("span", { className: "cap-message-warning", children: [" ", _jsx("b", { children: "Warning:" }), " ", m.warning] })) : null, m.error !== null ? (_jsx("span", { className: "cap-message-error", role: "alert", children: m.error })) : null] }), m.undo ? (_jsxs("button", { type: "button", className: "cap-link-btn cap-message-undo", "data-cap-part": "undo", "aria-busy": m.busy || undefined, onClick: () => void runUndo(m.id), children: [_jsx("span", { children: m.busy ? "Undoing..." : "Undo" }), " ", _jsx("kbd", { "aria-hidden": "true", children: "z" })] })) : null, !m.clears ? (_jsx("button", { type: "button", className: "cap-btn cap-message-dismiss", "data-cap-part": "dismiss", "aria-disabled": m.busy || undefined, onClick: () => dismissOne(m.id), children: "Dismiss" })) : null] }, m.id))) }));
}
