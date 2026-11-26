import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState, useLayoutEffect, } from "react";
import { BulkBar } from "../bulk-bar/bulk-bar.react.js";
import { ConfirmDialog, ConfirmPage } from "../confirm-dialog/confirm-dialog.react.js";
import { useOptionalMessage } from "../message/message.react.js";
import { isUndoKey, kindGlyph } from "../message/message.js";
import { intentForm, outcomesOf, } from "./content.js";
import { markup } from "../trusted-html/trusted-html.js";
import { useHydrated } from "../hooks/hooks.react.js";
// The loop every content list runs: posts go through the host's `submit`, or the browser's form post
// without it; results are said in the message region or the list's own box; a `confirm` answer is
// a dialog with script and a page without.
// The last result in the page. Undo is a form that posts the inverse, so it works with no script.
export function ResultBox({ result, action, Form, keyHint, }) {
    const kind = result ? (result.ok ? "ok" : "failure") : null;
    return (_jsx("div", { className: "cap-message cap-content-result", role: "status", "aria-label": "Results and failures", "aria-atomic": "false", children: result && kind ? (_jsxs("div", { className: "cap-message-item", "data-cap-part": "item", "data-kind": kind, "data-lasting": result.ok ? undefined : "", children: [_jsx("svg", { className: "cap-message-glyph", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: markup(kindGlyph(kind)) }), _jsx("p", { className: "cap-message-text", "data-cap-part": "text", children: _jsx("span", { "data-cap-part": "said", role: result.ok ? undefined : "alert", children: result.message }) }), result.undo ? (_jsxs(Form, { method: "post", action: action, className: "cap-content-undo", children: [Object.entries(result.undo.fields).flatMap(([k, v]) => k === "intent"
                            ? []
                            : (typeof v === "string" ? [v] : v).map((one, i) => (_jsx("input", { type: "hidden", name: k, value: one }, `${k}-${i}`)))), _jsxs("button", { type: "submit", className: "cap-link-btn cap-message-undo", "data-cap-part": "undo", name: "intent", value: result.undo.intent, children: [_jsx("span", { children: "Undo" }), keyHint ? (_jsxs(_Fragment, { children: [" ", _jsx("kbd", { "aria-hidden": "true", children: "z" })] })) : null] })] })) : null] })) : null }));
}
export function useIntents({ action, Form, submit, result = null, names, cancelHref, onDone, }) {
    const message = useOptionalMessage();
    const mounted = useHydrated();
    const namesRef = useRef(names);
    useLayoutEffect(() => {
        namesRef.current = names;
    });
    const [outcomes, setOutcomes] = useState(() => result ? outcomesOf(result, names) : []);
    // The script path's last result; replaces `result` until the page brings a new one.
    const [settled, setSettled] = useState(null);
    const [pageResult, setPageResult] = useState(result);
    if (result !== pageResult) {
        setPageResult(result);
        setSettled(null);
        setOutcomes(result ? outcomesOf(result, names) : []);
    }
    const [asking, setAsking] = useState(null);
    const rootRef = useRef(null);
    const setRoot = useCallback((el) => {
        rootRef.current = el;
    }, []);
    // The list's own result box shows the page's result, and the script path's when no message region exists.
    const box = settled ? (message ? null : settled) : result;
    const announce = (r) => {
        setSettled(r);
        if (!message)
            return;
        const inverse = r.undo;
        // A failure with nothing to undo is a failure; one that did part of its work still offers Undo.
        if (!r.ok && !inverse)
            return message.fail(r.message);
        message.say(r.message, {
            undo: inverse && submit
                ? async () => {
                    const u = await submit(intentForm(inverse.intent, inverse.fields));
                    if (!u.ok)
                        throw new Error(u.message);
                    message.say(u.message);
                }
                : undefined,
        });
    };
    const handle = (r, labelsAtPost) => {
        if (r.confirm)
            return setAsking(r.confirm);
        const list = outcomesOf(r, labelsAtPost);
        setOutcomes(list.length > 1 || list.some((o) => !o.ok) ? list : []);
        if (r.ok || list.some((o) => o.ok))
            onDone?.();
        announce(r);
    };
    const run = async (form) => {
        if (!submit)
            return null;
        const at = new Map(namesRef.current);
        let r;
        try {
            r = await submit(form);
        }
        catch (err) {
            const why = err instanceof Error && err.message ? err.message : "the site did not answer";
            const failed = { ok: false, message: `Not done: ${why}. Nothing was changed.` };
            announce(failed);
            return failed;
        }
        handle(r, at);
        return r;
    };
    // With script, every post from inside the list goes through `submit`; a GET (filters) navigates.
    const onSubmit = (e) => {
        // A router's <Form> prevents the default first; do not post that form twice.
        if (!submit ||
            e.defaultPrevented ||
            !(e.target instanceof HTMLFormElement) ||
            e.target.method.toLowerCase() !== "post")
            return;
        e.preventDefault();
        const form = e.target;
        const submitter = e.nativeEvent.submitter;
        const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : null);
        form.closest("details")?.removeAttribute("open");
        void run(data);
    };
    // z runs Undo when the list says its own results; the message region does it otherwise.
    const keyHint = !!submit && !message && mounted && !!box?.undo;
    useEffect(() => {
        if (!keyHint)
            return;
        const onKey = (e) => {
            if (e.defaultPrevented || !isUndoKey(e))
                return;
            const button = rootRef.current?.querySelector(".cap-content-undo [data-cap-part='undo']");
            if (!button)
                return;
            e.preventDefault();
            button.form?.requestSubmit(button);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [keyHint]);
    // With no script this page is how a one-way intent is confirmed.
    const pageAsks = !settled && result?.confirm ? result.confirm : null;
    const confirmPage = pageAsks ? (_jsx(ConfirmPage, { action: action, hidden: { intent: pageAsks.intent, ...pageAsks.fields }, title: pageAsks.title, lead: pageAsks.lead, body: pageAsks.items, action_label: pageAsks.action, cancelHref: cancelHref, typeToConfirm: pageAsks.typeToConfirm, headingLevel: "h2" })) : null;
    const confirmDialog = asking ? (_jsx(ConfirmDialog, { open: true, title: asking.title, lead: asking.lead, body: asking.items, action: asking.action, typeToConfirm: asking.typeToConfirm, cancelLabel: asking.cancelLabel, perform: async () => {
            if (!submit)
                return;
            const at = new Map(namesRef.current);
            const fields = asking.typeToConfirm
                ? { ...asking.fields, confirm: asking.typeToConfirm }
                : asking.fields;
            const r = await submit(intentForm(asking.intent, fields));
            // Nothing done: stay in the dialog with the reason.
            if (!r.ok && !(r.outcomes ?? []).some((o) => o.ok))
                throw new Error(r.message);
            handle({ ...r, confirm: undefined }, at);
        }, onClose: () => setAsking(null) })) : null;
    return {
        onSubmit,
        rootRef,
        setRoot,
        outcomes,
        dismissOutcomes: () => setOutcomes([]),
        resultBox: !message || box ? (_jsx(ResultBox, { result: box, action: action, Form: Form, keyHint: keyHint })) : null,
        confirmPage,
        confirmDialog,
        show: (r) => handle(r, new Map(namesRef.current)),
        latest: settled ?? result,
        ask: setAsking,
        run,
    };
}
// The content lists' bulk bar in form mode: actions are submit buttons.
export function ContentBulkBar({ formId, action, Form, formClass, items, total, onSelectAll, onClear, plural, actions, tag, tagName = "tag", intents, }) {
    return (_jsxs(_Fragment, { children: [_jsx(Form, { id: formId, method: "post", action: action, className: formClass }), _jsx(BulkBar, { form: formId, position: "top", items: items, total: total, onSelectAll: onSelectAll, onClear: onClear, label: `Bulk actions on ${plural}`, prompt: `Tick the ${plural} to act on`, actions: actions.map((a) => ({
                    id: a.intent,
                    label: a.label,
                    destructive: a.destructive,
                    submit: true,
                })), outcomes: intents.outcomes, onDismissOutcomes: intents.dismissOutcomes, children: tag ? (_jsxs("span", { className: "cap-bulk-field", children: [_jsx("label", { htmlFor: `${formId}-tag`, children: "Tag" }), _jsx("input", { className: "cap-input", id: `${formId}-tag`, name: tagName, form: formId, autoComplete: "off" })] })) : null })] }));
}
