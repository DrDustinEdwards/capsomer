import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { BulkBar } from "../bulk-bar/bulk-bar.react.js";
import { ConfirmDialog, ConfirmPage } from "../confirm-dialog/confirm-dialog.react.js";
import { useOptionalMessage } from "../message/message.react.js";
import { GLYPHS, isUndoKey } from "../message/message.js";
import { intentForm, outcomesOf } from "./content.js";
export const PlainForm = (props) => _jsx("form", { ...props });
// The result of the last action, in the page: the sentence, and Undo as a form that posts the
// inverse, so it works with no script. With script the list's submit handler catches that post.
export function ResultBox({ result, action, Form, keyHint }) {
    const kind = result ? (result.ok ? "ok" : "failure") : null;
    return (_jsx("div", { className: "cap-message cap-content-result", role: "status", "aria-label": "Results and failures", "aria-atomic": "false", children: result && kind ? (_jsxs("div", { className: "cap-message-item", "data-cap-part": "item", "data-kind": kind, "data-lasting": result.ok ? undefined : "", children: [_jsx("svg", { className: "cap-message-glyph", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: { __html: GLYPHS[kind] } }), _jsx("p", { className: "cap-message-text", "data-cap-part": "text", children: _jsx("span", { "data-cap-part": "said", role: result.ok ? undefined : "alert", children: result.message }) }), result.undo ? (_jsxs(Form, { method: "post", action: action, className: "cap-content-undo", children: [Object.entries(result.undo.fields).flatMap(([k, v]) => (k === "intent" ? [] : (typeof v === "string" ? [v] : v).map((one, i) => _jsx("input", { type: "hidden", name: k, value: one }, `${k}-${i}`)))), _jsxs("button", { type: "submit", className: "cap-link-btn cap-message-undo", "data-cap-part": "undo", name: "intent", value: result.undo.intent, children: [_jsx("span", { children: "Undo" }), keyHint ? (_jsxs(_Fragment, { children: [" ", _jsx("kbd", { "aria-hidden": "true", children: "z" })] })) : null] })] })) : null] })) : null }));
}
export function useIntents({ action, Form, submit, result = null, names, cancelHref, onDone }) {
    const message = useOptionalMessage();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const namesRef = useRef(names);
    namesRef.current = names;
    const [outcomes, setOutcomes] = useState(() => (result ? outcomesOf(result, names) : []));
    // The last result the script path got. It replaces `result` (which came with the page) until
    // the page brings a new one.
    const [settled, setSettled] = useState(null);
    useEffect(() => {
        setSettled(null);
        setOutcomes(result ? outcomesOf(result, namesRef.current) : []);
    }, [result]);
    const [asking, setAsking] = useState(null);
    const rootRef = useRef(null);
    // What the list's own result box says: the page's result, or with no message region on the
    // page, the script path's too.
    const box = settled ? (message ? null : settled) : result;
    const announce = (r) => {
        setSettled(r);
        if (!message)
            return;
        const inverse = r.undo;
        // A result with nothing to undo that failed is a failure; one that did part of its work
        // still offers Undo for that part, and the bar lists what was refused.
        if (!r.ok && !inverse)
            return message.fail(r.message);
        message.say(r.message, {
            undo: inverse && submit
                ? async () => {
                    const u = await submit(intentForm(inverse.intent, inverse.fields));
                    if (!u.ok)
                        throw new Error(u.message);
                    // The Undo's own result replaces the message it came from.
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
    // With script, every post from inside the list goes through `submit` instead of a page load:
    // the bulk bar, a row menu, Undo, a host action, an upload. A GET (the filters) navigates as
    // before.
    const onSubmit = (e) => {
        if (!submit || !(e.target instanceof HTMLFormElement) || e.target.method.toLowerCase() !== "post")
            return;
        e.preventDefault();
        const form = e.target;
        const submitter = e.nativeEvent.submitter;
        const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : null);
        form.closest("details")?.removeAttribute("open");
        void run(data);
    };
    // z runs Undo when the list's script path says its own results (the message region does it
    // otherwise).
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
    // The action asked first, so the page is its confirmation: with no script this is how a one-way
    // intent is confirmed. With script the same form posts through `submit`.
    const pageAsks = !settled && result?.confirm ? result.confirm : null;
    const confirmPage = pageAsks ? (_jsx(ConfirmPage, { action: action, hidden: { intent: pageAsks.intent, ...pageAsks.fields }, title: pageAsks.title, lead: pageAsks.lead, body: pageAsks.items, action_label: pageAsks.action, cancelHref: cancelHref, typeToConfirm: pageAsks.typeToConfirm, headingLevel: "h2" })) : null;
    const confirmDialog = asking ? (_jsx(ConfirmDialog, { open: true, title: asking.title, lead: asking.lead, body: asking.items, action: asking.action, typeToConfirm: asking.typeToConfirm, cancelLabel: asking.cancelLabel, perform: async () => {
            if (!submit)
                return;
            const at = new Map(namesRef.current);
            const fields = asking.typeToConfirm ? { ...asking.fields, confirm: asking.typeToConfirm } : asking.fields;
            const r = await submit(intentForm(asking.intent, fields));
            // Nothing done at all stays in the dialog with the reason and Try again.
            if (!r.ok && !(r.outcomes ?? []).some((o) => o.ok))
                throw new Error(r.message);
            handle({ ...r, confirm: undefined }, at);
        }, onClose: () => setAsking(null) })) : null;
    return {
        onSubmit,
        rootRef,
        outcomes,
        dismissOutcomes: () => setOutcomes([]),
        resultBox: !message || box ? _jsx(ResultBox, { result: box, action: action, Form: Form, keyHint: keyHint }) : null,
        confirmPage,
        confirmDialog,
        ask: setAsking,
        run,
    };
}
// The content components' bulk bar: an empty form the boxes post through, and the bar in form mode
// with its actions as submit buttons, the optional Tag field, and each item's outcome.
export function ContentBulkBar({ formId, action, Form, formClass, items, total, onSelectAll, onClear, plural, actions, tag, tagName = "tag", intents }) {
    return (_jsxs(_Fragment, { children: [_jsx(Form, { id: formId, method: "post", action: action, className: formClass }), _jsx(BulkBar, { form: formId, position: "top", items: items, total: total, onSelectAll: onSelectAll, onClear: onClear, label: `Bulk actions on ${plural}`, prompt: `Tick the ${plural} to act on`, actions: actions.map((a) => ({ id: a.intent, label: a.label, destructive: a.destructive, submit: true })), outcomes: intents.outcomes, onDismissOutcomes: intents.dismissOutcomes, children: tag ? (_jsxs("span", { className: "cap-bulk-field", children: [_jsx("label", { htmlFor: `${formId}-tag`, children: "Tag" }), _jsx("input", { className: "cap-input", id: `${formId}-tag`, name: tagName, form: formId, autoComplete: "off" })] })) : null })] }));
}
