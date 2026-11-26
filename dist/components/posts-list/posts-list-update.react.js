import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { nounsOf, } from "../content/content.js";
import { useIntents } from "../content/content.react.js";
import { PlainForm } from "../plain-form/plain-form.react.js";
import { Time } from "../time/time.react.js";
import { DraftCompare, DraftPatch } from "../draft-compare/draft-compare.react.js";
import { PageHead } from "../page-head/page-head.react.js";
import { inDays } from "./posts-list.js";
import { useCleanId, useHydrated } from "../hooks/hooks.react.js";
import { RescheduleDialog, RescheduleField, cancelRequest, } from "./posts-list-dialogs.react.js";
// The page of the update waiting on a live post: a page head with the post's title and its
// actions, then the update beside the live post (with when it goes live) in the draft compare,
// with the unified patch under it. Reschedule… opens the dialog and Cancel the update asks
// first, posting the posts list's own intents; with no script both are plain forms under the
// head.
export function PostScheduledUpdate({ data, action, Form = PlainForm, submit, result = null, liveSince, crumbs, headingLevel, labels, now, }) {
    const uid = useCleanId();
    const { noun } = nounsOf(labels, "post");
    const name = data.title || "Untitled";
    const names = useMemo(() => new Map([[data.id, name]]), [data.id, name]);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: action });
    // False on the server and while hydrating, true once hydrated.
    const mounted = useHydrated();
    const [moving, setMoving] = useState(null);
    // The time the list was drawn, when the page does not pass one.
    const [drawnAt] = useState(() => Date.now());
    const clock = now ?? drawnAt;
    const scripted = mounted && !!submit;
    const Side = headingLevel === "h3" ? "h4" : headingLevel === "h2" ? "h3" : "h2";
    const may = data.can.publish;
    const actions = (_jsxs(_Fragment, { children: [may && scripted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "primary", onClick: () => setMoving({ id: data.id, name, at: data.publishAt, version: data.live.version }), children: "Reschedule\u2026" })) : null, data.can.edit ? (_jsx("a", { className: "cap-btn", href: data.editorHref, children: "Edit the update" })) : null, data.live.href ? (_jsxs("a", { className: "cap-btn", href: data.live.href, children: ["View the live ", noun] })) : null, may && scripted ? (_jsx("button", { type: "button", className: "cap-btn", "data-variant": "danger", "data-cap-part": "cancel-update", onClick: () => intents.ask(cancelRequest(data.id, name, noun, data.live.version)), children: "Cancel the update" })) : null] }));
    return (_jsxs("section", { className: "cap-posts-update-view", "data-cap": "posts-list", "aria-labelledby": `${uid}-h`, ref: intents.setRoot, 
        // oxlint-disable-next-line react/refs -- intents holds the root ref for its handlers; rendering reads none of it
        onSubmit: intents.onSubmit, children: [_jsx(PageHead, { crumbs: crumbs, headingLevel: headingLevel, title: _jsx("span", { id: `${uid}-h`, children: name }), actions: actions }), intents.resultBox, may && !scripted ? (_jsxs(Form, { method: "post", action: action, className: "cap-field-row", children: [_jsx("input", { type: "hidden", name: "ids", value: data.id }), _jsx("input", { type: "hidden", name: "versions", value: data.live.version }), _jsx(RescheduleField, { id: `${uid}-at`, at: data.publishAt }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "primary", name: "intent", value: "reschedule", children: "Reschedule" }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "danger", name: "intent", value: "cancel-schedule", children: "Cancel the update" })] })) : null, !may ? (_jsx("ul", { className: "cap-posts-withheld", children: _jsx("li", { children: "Rescheduling or canceling it needs a publisher's role." }) })) : null, _jsxs("div", { className: "cap-posts-update-sides", children: [_jsxs(Side, { className: "cap-posts-update-side", children: ["Live ", noun, liveSince ? (_jsxs("span", { className: "cap-posts-update-side-when", children: [" ", "\u00B7 on the site since ", _jsx(Time, { at: liveSince, format: "exact" })] })) : null] }), _jsxs(Side, { className: "cap-posts-update-side", children: ["Scheduled update", _jsxs("span", { className: "cap-posts-update-side-when", children: [" ", "\u00B7 goes live ", _jsx(Time, { at: data.publishAt, format: "exact" }), ", ", inDays(data.publishAt, clock)] })] })] }), _jsx(DraftCompare, { before: { title: `Live ${noun}`, text: data.live.source }, after: { title: "Scheduled update", text: data.source }, labels: { before: "Live", after: "Scheduled" }, id: `${uid}-cmp`, heads: false }), _jsxs("details", { className: "cap-disclosure cap-posts-update-patch", children: [_jsx("summary", { children: "The change as a patch" }), _jsx(DraftPatch, { patch: data.patch, title: `The scheduled update to ${name}`, id: `${uid}-patch` })] }), _jsx(RescheduleDialog, { moving: moving, action: action, Form: Form, onClose: () => setMoving(null) }), intents.confirmDialog] }));
}
