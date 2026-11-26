import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { enhance as enhanceFields } from "../field/field.js";
import { FormMenu } from "../menu/menu.react.js";
import { Glyph } from "../status/status.react.js";
import { REASON_MISSING, accessText, actionText, cloudflareText, confirmRemove, dayText, endsSoon, rowActions, syncText, tallyText, timeText, } from "./people-roles.js";
import { useCleanId } from "../hooks/hooks.react.js";
import { AddForm, Hidden } from "./people-add.react.js";
export { RoleGrid } from "./role-grid.react.js";
const TONE = { ready: "ok", waiting: "info", failed: "crit" };
const HISTORY_TONE = {
    accepted: "ok",
    pending: "info",
    failed: "crit",
};
function defaultHref(kind, email) {
    return `?${kind}=${encodeURIComponent(email)}`;
}
export function PeopleRoles({ data, action, now: nowProp, hrefFor = defaultHref, closeHref = "?", onIntent, headingLevel = 2, }) {
    // The time the page was drawn, when the page does not pass one.
    const [drawnAt] = useState(() => Date.now());
    const now = nowProp ?? drawnAt;
    const id = useCleanId();
    const H = `h${headingLevel}`;
    const Sub = `h${headingLevel + 1}`;
    const live = data.people.filter((p) => p.status === "active").length;
    const root = useRef(null);
    // The add and change-title forms check their fields beside each field.
    useEffect(() => (root.current ? enhanceFields(root.current) : undefined), [data.changing, data.titles.length]);
    // Every form in the page posts through here: Remove asks first, and with `onIntent` the
    // app runs the post in place instead of the browser loading a page.
    const onSubmitCapture = (e) => {
        const form = e.target;
        const submitter = e.nativeEvent.submitter;
        const fields = new FormData(form, submitter);
        const intent = String(fields.get("intent") ?? "");
        // A form with a wrong field is the field component's to answer, beside the field.
        if (!form.checkValidity())
            return;
        if (intent === "remove" && fields.get("confirmed") !== "yes") {
            e.preventDefault();
            void (onIntent
                ? confirmRemove(form, async () => {
                    const fields = new FormData(form);
                    fields.set("intent", "remove");
                    fields.set("confirmed", "yes");
                    await onIntent("remove", fields);
                })
                : confirmRemove(form));
            return;
        }
        if (!onIntent || e.defaultPrevented)
            return;
        e.preventDefault();
        void onIntent(intent, fields);
    };
    return (_jsxs("section", { className: "cap-people", "data-cap": "people-roles", "aria-labelledby": `${id}-h`, onSubmitCapture: onSubmitCapture, ref: root, children: [_jsxs("div", { className: "cap-people-head", children: [_jsx(H, { id: `${id}-h`, children: data.heading }), _jsxs("p", { className: "cap-people-count", children: [live, " ", live === 1 ? "person has" : "people have", " access"] })] }), data.lead ? _jsx("p", { className: "cap-people-lead", children: data.lead }) : null, data.result ? (_jsxs("p", { className: "cap-people-result", role: data.result.ok ? "status" : "alert", "data-tone": data.result.ok ? "ok" : "crit", children: [_jsxs("span", { className: "cap-status", "data-tone": data.result.ok ? "ok" : "crit", children: [_jsx(Glyph, { name: data.result.ok ? "ok" : "crit" }), _jsx("span", { className: "cap-sr-only", children: data.result.ok ? "Done:" : "Not done:" })] }), _jsx("span", { children: data.result.text })] })) : null, data.review && data.review.people.length ? (_jsx(Review, { id: id, Sub: Sub, review: data.review, action: action })) : null, _jsx("div", { className: "cap-table-wrap", role: "region", "aria-label": data.heading, tabIndex: 0, children: _jsxs("table", { className: "cap-table cap-people-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Person" }), _jsx("th", { scope: "col", children: "Title" }), _jsx("th", { scope: "col", children: "Access" }), _jsx("th", { scope: "col", children: "Cloudflare" }), _jsx("th", { scope: "col", children: _jsx("span", { className: "cap-sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { children: data.people.map((p) => (_jsx(PersonRows, { p: p, now: now, action: action, titles: data.titles, changing: data.changing === p.email, hrefFor: hrefFor, closeHref: closeHref }, p.email))) })] }) }), data.history ? (_jsx(History, { id: id, Sub: Sub, history: data.history, closeHref: closeHref })) : null, data.titles.length ? (_jsx(AddForm, { id: id, Sub: Sub, titles: data.titles, action: action })) : null] }));
}
function PersonRows({ p, now, action, titles, changing, hrefFor, closeHref }) {
    const soon = endsSoon(p, now);
    const who = _jsxs("span", { className: "cap-sr-only", children: [" for ", p.name] });
    const editId = `pr-change-${useId()}`;
    const { primary, items } = rowActions(p, titles.length > 0, changing ? closeHref : hrefFor("change", p.email), hrefFor("person", p.email));
    return (_jsxs(_Fragment, { children: [_jsxs("tr", { "data-status": p.status, "data-email": p.email, "data-name": p.name, children: [_jsxs("th", { scope: "row", className: "cap-people-who", children: [_jsxs("span", { className: "cap-people-name", children: [p.name, p.you ? (_jsx("span", { className: "cap-pill cap-people-you", "data-variant": "secondary", children: "You" })) : null] }), _jsx("span", { className: "cap-people-email cap-mono", children: p.email })] }), _jsx("td", { children: p.title }), _jsx("td", { children: _jsxs("span", { className: "cap-people-end", "data-soon": soon ? "" : undefined, children: [soon ? _jsx(Glyph, { name: "warn" }) : null, accessText(p, now)] }) }), _jsxs("td", { className: "cap-people-sync", children: [_jsxs("span", { className: "cap-status", "data-tone": TONE[p.sync], children: [_jsx(Glyph, { name: p.sync === "waiting" ? "running" : TONE[p.sync] }), syncText(p)] }), p.sync === "failed" && p.syncError ? (_jsx("span", { className: "cap-people-sync-error", children: p.syncError })) : null] }), _jsx("td", { className: "cap-people-actions", children: _jsxs("div", { className: "cap-people-acts", children: [primary ? (_jsxs("form", { method: "post", action: action, children: [_jsx(Hidden, { fields: { intent: primary.intent, email: p.email } }), _jsxs("button", { type: "submit", className: "cap-btn", "data-size": "sm", children: [primary.label, who] })] })) : null, p.manageable ? (_jsx(FormMenu, { label: "Actions", "aria-label": `Actions for ${p.name}`, action: action, hidden: { email: p.email }, items: items })) : (_jsxs("a", { className: "cap-btn", "data-size": "sm", href: hrefFor("person", p.email), children: ["History", who] }))] }) })] }), changing ? (_jsx(ChangeRow, { id: editId, p: p, titles: titles, action: action, closeHref: closeHref })) : null] }));
}
function ChangeRow({ id, p, titles, action, closeHref, }) {
    const first = useRef(null);
    useEffect(() => first.current?.focus(), []);
    const others = titles.filter((t) => t.label !== p.title);
    return (_jsx("tr", { className: "cap-people-edit", id: id, children: _jsx("td", { colSpan: 5, children: _jsxs("form", { className: "cap-people-change cap-field-row", "data-cap": "field", method: "post", action: action, "aria-label": `Change ${p.name}'s title`, children: [_jsx(Hidden, { fields: { intent: "change_title", email: p.email } }), _jsxs("div", { className: "cap-field", children: [_jsxs("label", { className: "cap-field-label", htmlFor: `${id}-title`, children: ["New title for ", p.name] }), _jsx("div", { className: "cap-select-wrap", "data-cap": "select", "data-native": "", children: _jsx("select", { ref: first, className: "cap-select", id: `${id}-title`, name: "title", required: true, children: others.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value))) }) })] }), _jsxs("div", { className: "cap-field", children: [_jsxs("label", { className: "cap-field-label", htmlFor: `${id}-reason`, children: ["Reason", " ", _jsx("span", { className: "cap-field-required", "aria-hidden": "true", children: "Required" })] }), _jsx("p", { className: "cap-field-help", id: `${id}-reason-h`, children: "One line, recorded with the change." }), _jsx("input", { className: "cap-input", id: `${id}-reason`, name: "reason", required: true, autoComplete: "off", maxLength: 200, "aria-describedby": `${id}-reason-e ${id}-reason-h`, "data-error-value-missing": REASON_MISSING }), _jsx("p", { className: "cap-field-error", id: `${id}-reason-e`, hidden: true })] }), _jsxs("div", { className: "cap-people-change-actions", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Change title" }), _jsx("a", { className: "cap-btn", href: closeHref, children: "Cancel" })] })] }) }) }));
}
function Review({ id, Sub, review, action, }) {
    const [answers, setAnswers] = useState({});
    const keep = Object.values(answers).filter((v) => v === "keep").length;
    const removeCount = Object.values(answers).filter((v) => v === "remove").length;
    const open = review.people.length - keep - removeCount;
    return (_jsxs("form", { className: "cap-people-card cap-people-review", "data-variant": "review", method: "post", action: action, "aria-labelledby": `${id}-rv`, children: [_jsx(Hidden, { fields: { intent: "review" } }), _jsx(Sub, { id: `${id}-rv`, children: "Still on your team?" }), _jsxs("p", { className: "cap-people-lead", children: ["Anyone not answered loses access on ", dayText(review.endDate), "."] }), _jsx("div", { className: "cap-people-review-list", children: review.people.map((p, i) => (_jsxs("fieldset", { className: "cap-people-review-item", children: [_jsxs("legend", { children: [p.name, " ", _jsx("span", { className: "cap-people-review-who", children: p.title })] }), _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "radio", name: `answer-${i}`, value: "keep", onChange: () => setAnswers((a) => ({ ...a, [p.email]: "keep" })) }), " ", "Keep", p.renewTo ? `, until ${dayText(p.renewTo)}` : ""] }), _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "radio", name: `answer-${i}`, value: "remove", onChange: () => setAnswers((a) => ({ ...a, [p.email]: "remove" })) }), " ", "Remove"] }), _jsx("input", { type: "hidden", name: `email-${i}`, value: p.email })] }, p.email))) }), _jsxs("div", { className: "cap-people-review-foot", children: [_jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", children: "Save review" }), _jsx("p", { className: "cap-people-tally", "data-cap-part": "tally", "aria-live": "polite", children: tallyText(keep, removeCount, open) })] })] }));
}
function History({ id, Sub, history, closeHref, }) {
    return (_jsxs("section", { className: "cap-people-history", "aria-labelledby": `${id}-hi`, children: [_jsxs("div", { className: "cap-people-history-head", children: [_jsxs(Sub, { id: `${id}-hi`, children: ["History for ", history.name] }), _jsx("a", { className: "cap-btn", "data-size": "sm", href: closeHref, children: "Close history" })] }), history.entries.length ? (_jsx("ol", { className: "cap-people-history-list", children: history.entries.map((e) => (_jsxs("li", { className: "cap-people-history-item", children: [_jsx("time", { className: "cap-people-history-when", dateTime: e.at, children: timeText(e.at) }), _jsxs("div", { children: [_jsx("p", { className: "cap-people-history-what", children: actionText(e) }), _jsxs("span", { className: "cap-people-history-by", children: ["By ", e.by] }), e.reason ? (_jsxs("span", { className: "cap-people-history-reason", children: ["Reason: ", e.reason] })) : null] }), _jsxs("span", { className: "cap-status", "data-tone": HISTORY_TONE[e.cloudflare], children: [_jsx(Glyph, { name: e.cloudflare === "pending" ? "running" : HISTORY_TONE[e.cloudflare] }), cloudflareText(e)] })] }, `${e.at}-${e.action}`))) })) : (_jsx("p", { className: "cap-people-lead", children: "No changes recorded yet." }))] }));
}
