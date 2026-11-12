import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState, } from "react";
import { COPIED_MS, COPY_FAILED_MS, copyText, distinct, messageFor, shareLink, } from "./copy.js";
// The copy state for a React control: run() copies (or shares) and keeps the outcome and its
// message for as long as the message should show. A repeat restarts it. Never throws.
export function useCopy(messages = {}) {
    const [state, setState] = useState();
    const [message, setMessage] = useState("");
    const timer = useRef(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    const show = useCallback((outcome) => {
        clearTimeout(timer.current);
        const own = outcome === "copied" ? messages.copied : outcome === "failed" ? messages.failed : undefined;
        const text = own ?? messageFor(outcome);
        setState(undefined);
        setMessage("");
        if (!text)
            return;
        requestAnimationFrame(() => {
            setState(outcome === "failed" ? "failed" : "done");
            setMessage(distinct(text));
        });
        timer.current = setTimeout(() => {
            setState(undefined);
            setMessage("");
        }, outcome === "failed" ? COPY_FAILED_MS : COPIED_MS);
    }, [messages.copied, messages.failed]);
    const copy = useCallback(async (text) => {
        const ok = await copyText(text);
        show(ok ? "copied" : "failed");
        return ok;
    }, [show]);
    const share = useCallback(async (data) => {
        const outcome = await shareLink(data);
        show(outcome);
        return outcome;
    }, [show]);
    return { copy, share, state, message };
}
export const COPY_ICON = (_jsxs("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [_jsx("rect", { x: "5.5", y: "5.5", width: "8", height: "8", rx: "1.5" }), _jsx("path", { d: "M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" })] }));
export const DONE_ICON = (_jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "1.75", children: _jsx("path", { d: "M3 8.5l3 3 7-7" }) }));
// A copy (or share) button with its status bubble beside it: the HTML contract in copy.md.
export function CopyButton(props) {
    const { text, share, children, copiedMessage, failedMessage, variant = "quiet", size, onCopied, className, ...rest } = props;
    const { copy, share: doShare, state, message, } = useCopy({
        copied: copiedMessage,
        failed: failedMessage,
    });
    const onClick = async () => {
        if (share) {
            const outcome = await doShare(share);
            onCopied?.(outcome !== "failed");
            return;
        }
        const value = typeof text === "function" ? text() : (text ?? "");
        onCopied?.(await copy(value));
    };
    return (_jsxs("span", { className: className ? `cap-copy ${className}` : "cap-copy", children: [_jsxs("button", { ...rest, type: "button", className: "cap-btn cap-copy-button", "data-variant": variant, "data-size": size, "data-state": state, onClick: () => void onClick(), children: [_jsx("span", { className: "cap-copy-icon", children: COPY_ICON }), _jsx("span", { className: "cap-copy-done", children: DONE_ICON }), children] }), _jsx("span", { className: "cap-copy-tip", role: "status", children: message })] }));
}
