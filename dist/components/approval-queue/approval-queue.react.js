import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCleanId } from "../hooks/hooks.react.js";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../button/button.react.js";
import { ConfirmDialog } from "../confirm-dialog/confirm-dialog.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { Empty } from "../empty/empty.react.js";
import { queueKey } from "../row-list/row-list.js";
import { Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { actionForKey, keyOf, nextAfter, summaryLine, } from "./approval-queue.js";
const variantOf = (a) => a.variant === "primary" || a.variant === "danger" ? a.variant : "default";
// Things your own side drafted, waiting for a person: each item's text (editable before the
// decision), what a check held it for, and its decisions as one form, so it all works with no
// script. With script: j and k move between items, a and r run an item's approve and reject, and a
// one-way decision asks first in the confirm dialog.
export function ApprovalQueue({ items, label, hideLabel = false, action, Form = PlainForm, pending = false, textLabel = (i) => `Text for ${i.who}`, findingsLabel = "What the check held it for", empty = { title: "All clear", text: "Nothing is waiting." }, now, }) {
    const uid = useCleanId();
    const rootRef = useRef(null);
    const [closed, setClosed] = useState([]);
    const [asking, setAsking] = useState(null);
    // Where focus goes once a decided item has left: the next item's title, or the empty state.
    const focusNext = useRef(undefined);
    const decided = useRef(null);
    useEffect(() => {
        const want = focusNext.current;
        const root = rootRef.current;
        if (want === undefined || !root)
            return;
        const ids = items.map((i) => i.id);
        // The decided item is still here (the post failed, or is still on its way): focus stays.
        if (decided.current !== null && ids.includes(decided.current))
            return;
        focusNext.current = undefined;
        decided.current = null;
        const target = (want &&
            root.querySelector(`.cap-mq-row[data-id='${CSS.escape(want)}'] .cap-row-title button`)) ||
            root.querySelector(".cap-mq-row .cap-row-title button") ||
            root.querySelector(".cap-empty");
        target?.focus();
    }, [items]);
    const stateRef = useRef({ items });
    useLayoutEffect(() => {
        stateRef.current = { items };
    });
    // Sends an item's form with this button as its submitter, and remembers where focus goes next.
    const send = (button, item) => {
        const all = stateRef.current.items.map((i) => i.id);
        focusNext.current = nextAfter(all, item.id);
        decided.current = item.id;
        button.form?.requestSubmit(button);
    };
    useEffect(() => {
        const onKey = (e) => {
            const list = rootRef.current?.querySelector(".cap-mq-list");
            if (!list || document.querySelector("dialog:modal"))
                return;
            // Focus in another queue on the page: that queue's keys, not these.
            const other = document.activeElement?.closest(".cap-mq-list");
            if (other && other !== list)
                return;
            if (!queueKey(e, list))
                return;
            const row = document.activeElement?.closest(".cap-mq-row");
            if (!row || !list.contains(row))
                return;
            const item = stateRef.current.items.find((i) => i.id === row.dataset.id);
            const act = item ? actionForKey(item, e.key) : null;
            if (!item || !act)
                return;
            const button = row.querySelector(`button[name='intent'][value='${CSS.escape(act.intent)}']`);
            if (!button || button.getAttribute("aria-busy") === "true")
                return;
            e.preventDefault();
            if (act.confirm)
                setAsking({ button, action: act, item });
            else
                send(button, item);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);
    const headingId = `${uid}-h`;
    return (_jsxs("section", { className: "cap-mq cap-approvals", "data-cap": "approval-queue", "aria-labelledby": headingId, ref: rootRef, children: [_jsx("h2", { className: hideLabel ? "cap-sr-only" : "cap-approvals-title", id: headingId, children: label }), _jsx("div", { className: "cap-mq-head", children: _jsx("p", { className: "cap-mq-summary", role: "status", children: summaryLine(items) }) }), items.length === 0 ? (_jsx(Empty, { kind: "all-clear", title: empty.title, flush: true, children: empty.text })) : (_jsx("ul", { className: "cap-rows cap-mq-list", role: "list", "aria-labelledby": headingId, "data-cap-primary": "", children: items.map((item) => {
                    const p = `${uid}-${item.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
                    const open = !closed.includes(item.id);
                    const formId = `${p}-form`;
                    return (_jsxs("li", { className: "cap-row cap-mq-row", "data-id": item.id, "data-tone": item.status.tone === "crit" ? "crit" : undefined, children: [_jsx("span", { className: "cap-row-status", id: `${p}-s`, children: _jsx(Status, { tone: item.status.tone, children: item.status.word }) }), _jsx("div", { className: "cap-row-title", children: _jsx("button", { type: "button", "aria-expanded": open, "aria-controls": `${p}-more`, "aria-describedby": `${p}-s${item.context ? ` ${p}-d` : ""}`, onClick: () => setClosed((c) => c.includes(item.id) ? c.filter((x) => x !== item.id) : [...c, item.id]), children: item.who }) }), item.context ? (_jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: item.context })) : null, _jsxs("span", { className: "cap-row-meta", children: [item.at ? _jsx(Time, { at: item.at, now: now }) : null, _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" })] }), _jsxs("div", { className: "cap-mq-more", id: `${p}-more`, hidden: !open, children: [item.findings?.length ? (_jsx("ul", { className: "cap-mq-findings", "aria-label": findingsLabel, children: item.findings.map((f) => (_jsx("li", { children: _jsx(Status, { tone: "warn", children: f }) }, f))) })) : null, _jsxs(Form, { method: "post", action: action, id: formId, className: "cap-mq-edit", "aria-label": `Decide: ${item.who}`, onClick: (e) => {
                                            const b = e.target.closest("button[name='intent']");
                                            const act = item.actions.find((a) => a.intent === b?.value);
                                            if (!b || !act?.confirm)
                                                return;
                                            e.preventDefault();
                                            setAsking({ button: b, action: act, item });
                                        }, children: [_jsx("input", { type: "hidden", name: "id", value: item.id }), Object.entries(item.fields ?? {}).map(([name, value]) => (_jsx("input", { type: "hidden", name: name, value: value }, name))), item.editable ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "cap-sr-only", htmlFor: `${p}-text`, children: textLabel(item) }), _jsx("textarea", { className: "cap-input", id: `${p}-text`, name: "text", defaultValue: item.text, rows: 3 })] })) : (_jsx("blockquote", { className: "cap-mq-quote", children: item.text })), _jsx("div", { className: "cap-mq-decide", children: item.actions.map((a) => {
                                                    const key = keyOf(a);
                                                    return (_jsxs(Button, { type: "submit", variant: variantOf(a), size: "sm", name: "intent", value: a.intent, "aria-keyshortcuts": key, pending: pending, children: [a.label, _jsxs("span", { className: "cap-sr-only", children: [" for ", item.who] }), key ? (_jsx("kbd", { className: "cap-kbd", "aria-hidden": "true", children: key })) : null] }, a.intent));
                                                }) })] })] })] }, item.id));
                }) })), _jsx(ConfirmDialog, { open: asking !== null, title: asking?.action.confirm?.title ?? "", lead: asking?.action.confirm?.lead, body: asking ? (asking.action.confirm?.body ?? [asking.item.text]) : [], action: asking?.action.confirm?.action ?? "", returnTo: asking?.button, perform: async () => {
                    if (asking)
                        send(asking.button, asking.item);
                }, onClose: () => setAsking(null) })] }));
}
