import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ContentBulkBar, PlainForm, useIntents } from "../content/content.react.js";
import { Empty } from "../empty/empty.react.js";
import { ACTION_KEY, ACTION_LABEL, DELETE_KEY, STATE_LABEL, VIEWS, VIEW_LABEL, actionsFor, isTypingKey, statusOf, summaryText } from "../moderation-queue/moderation-queue.js";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.js";
import { Pill } from "../status/status.react.js";
import { TabLink, TabsNav } from "../tabs/tabs.react.js";
import { Time } from "../time/time.react.js";
import { countLine, currentView, emptyWords, mentionActions, mentionsHref, sweepLabel, withMentions } from "./mentions-list.js";
function StatusWord({ state }) {
    const s = statusOf(state);
    return (_jsxs("span", { className: "cap-status", "data-tone": s.tone, children: [_jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", focusable: "false", dangerouslySetInnerHTML: { __html: s.glyph } }), s.word] }));
}
const nameOf = (m) => `${m.author} (${m.host})`;
const initials = (name) => name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
// One page of one site's mentions, the moderation queue on the contract's states: tabs with the
// site's counts, each row's decisions as forms, the bulk bar with each mention's outcome, Undo,
// paging, delete and the retention sweep behind a confirm. Every action is a form post, so it all
// works with no script; with script the keys decide (a, r, d, x, j, k) and `submit` keeps the
// page where it is.
export function MentionsList({ data, action, Form = PlainForm, submit, result = null, now }) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
    const formId = `${uid}-bulk`;
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { rows, query, page, offers, can, counts } = data;
    const view = currentView(data);
    const { bulk, withheld } = mentionActions(data);
    const selectable = bulk.length > 0;
    const names = useMemo(() => new Map(rows.map((m) => [m.id, nameOf(m)])), [rows]);
    const href = (q) => mentionsHref(action, q);
    const [selected, setSelected] = useState([]);
    useEffect(() => setSelected((s) => s.filter((id) => names.has(id))), [names]);
    // With script a row opens in place; without, its link opens it through the address.
    const [opened, setOpened] = useState(query.open ? [query.open] : []);
    useEffect(() => setOpened(query.open ? [query.open] : []), [query.open]);
    const rootRef = useRef(null);
    // Where focus goes once a decided row leaves the page: the next row's title, or the empty state.
    const focusNext = useRef(null);
    const intents = useIntents({ action, Form, submit, result, names, cancelHref: href(query), onDone: () => setSelected([]) });
    useEffect(() => {
        const want = focusNext.current;
        const root = rootRef.current;
        if (want === null || !root || root.contains(document.activeElement))
            return;
        focusNext.current = null;
        const target = (want && root.querySelector(`.cap-mq-row[data-id='${CSS.escape(want)}'] .cap-row-title a`)) || root.querySelector(".cap-mq-row .cap-row-title a") || root.querySelector(".cap-empty");
        target?.focus();
    }, [rows]);
    // The keys, with script: j and k move, a and r decide, d deletes (the kit asks first), x
    // selects. A key acts on the whole selection when the focused row is part of it.
    const keys = mounted && can.decideMentions;
    const stateRef = useRef({ selected, rows, formId });
    stateRef.current = { selected, rows, formId };
    useEffect(() => {
        if (!keys)
            return;
        const onKey = (e) => {
            const root = rootRef.current;
            const list = root?.querySelector(".cap-mq-list");
            if (!root || !list || e.defaultPrevented || isTypingKey(e) || singleKeysOff() || e.repeat)
                return;
            if (e.key === "j" || e.key === "k") {
                if (!listOwnsKeys(list))
                    return;
                if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement))
                    e.preventDefault();
                return;
            }
            if (e.key === "Escape") {
                if (stateRef.current.selected.length && root.contains(document.activeElement) && !document.querySelector("dialog:modal")) {
                    e.preventDefault();
                    setSelected([]);
                }
                return;
            }
            const row = document.activeElement?.closest(".cap-mq-row");
            if (!row || !list.contains(row) || document.querySelector("dialog:modal"))
                return;
            const id = row.dataset.id ?? "";
            const { selected: picked, rows: all, formId: bulkForm } = stateRef.current;
            if (e.key === "x") {
                e.preventDefault();
                setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
                return;
            }
            const intent = e.key === DELETE_KEY ? "delete" : e.key === ACTION_KEY.approve ? "approve" : e.key === ACTION_KEY.reject ? "reject" : null;
            if (!intent)
                return;
            const many = picked.length > 1 && picked.includes(id);
            const button = many ? root.querySelector(`button[form='${bulkForm}'][value='${intent}']`) : row.querySelector(`[data-cap-action='${intent}']`);
            if (!button?.form)
                return;
            e.preventDefault();
            // The row (or rows) will leave this tab: focus goes to the next one still here.
            const acted = many ? picked : [id];
            const at = all.findIndex((m) => m.id === id);
            const next = all.slice(at + 1).find((m) => !acted.includes(m.id)) ?? all.slice(0, at).reverse().find((m) => !acted.includes(m.id));
            if (intent !== "delete")
                focusNext.current = next?.id ?? "";
            button.form.requestSubmit(button);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [keys]);
    if (intents.confirmPage) {
        return (_jsx("section", { className: "cap-mq cap-mentions", "data-cap": "mentions-list", "aria-label": "Mentions", children: intents.confirmPage }));
    }
    const selectedItems = rows.filter((m) => selected.includes(m.id)).map((m) => ({ id: m.id, label: nameOf(m) }));
    const setOne = (id, on) => setSelected((s) => (on ? (s.includes(id) ? s : [...s, id]) : s.filter((x) => x !== id)));
    const empty = rows.length === 0;
    const words = emptyWords(view);
    const sweep = sweepLabel(data.expiring);
    const hint = (key) => (keys && key ? _jsx("kbd", { className: "cap-kbd", "aria-hidden": "true", children: key }) : null);
    const toggle = (id) => (e) => {
        if (!mounted)
            return;
        e.preventDefault();
        setOpened((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    };
    return (_jsxs("section", { className: "cap-mq cap-mentions", "data-cap": "mentions-list", "data-view": view, "aria-labelledby": `${uid}-h`, ref: (el) => {
            rootRef.current = el;
            intents.rootRef.current = el;
        }, onSubmit: intents.onSubmit, children: [_jsxs("h2", { className: "cap-sr-only", id: `${uid}-h`, children: ["Mentions on ", data.site.name] }), _jsx(TabsNav, { "aria-label": "Mentions by state", className: "cap-mentions-tabs", children: VIEWS.map((v) => (_jsx(TabLink, { href: href(withMentions(query, { view: v })), current: view === v, count: counts[v], children: VIEW_LABEL[v] }, v))) }), _jsxs("div", { className: "cap-mq-head", children: [_jsx("p", { className: "cap-mq-summary", role: "status", children: summaryText({ pending: counts.pending, unverified: 0 }) }), counts.unverified > 0 ? (_jsxs(Pill, { variant: "secondary", href: view === "all" ? undefined : href(withMentions(query, { view: "all" })), children: [counts.unverified, " ", STATE_LABEL.unverified.toLowerCase()] })) : null, empty ? null : _jsx("p", { className: "cap-mentions-count", children: countLine(data) })] }), withheld.length ? (_jsx("ul", { className: "cap-mentions-withheld", children: withheld.map((w) => (_jsx("li", { children: w }, w))) })) : null, intents.resultBox, selectable && !empty ? (_jsx(ContentBulkBar, { formId: formId, action: action, Form: Form, formClass: "cap-mentions-bulk-form", items: selectedItems, total: rows.length, onSelectAll: mounted ? () => setSelected(rows.map((m) => m.id)) : undefined, onClear: () => setSelected([]), plural: "mentions", actions: bulk, tag: false, intents: intents })) : null, empty ? (_jsx(Empty, { kind: words.kind, title: words.title, children: words.text })) : (_jsx("ul", { className: "cap-rows cap-mq-list", role: "list", "aria-labelledby": `${uid}-h`, "data-cap-primary": "", children: rows.map((m) => {
                    const p = `${uid}-${m.id}`;
                    const open = opened.includes(m.id);
                    const decisions = can.decideMentions ? actionsFor(m.state, offers.reset) : [];
                    const canDelete = can.decideMentions && offers.delete;
                    return (_jsxs("li", { className: "cap-row cap-mq-row", "data-id": m.id, "data-state": m.state, "data-selected": selected.includes(m.id) ? "" : undefined, children: [selectable ? (_jsx("span", { className: "cap-mq-check", children: _jsxs("label", { className: "cap-check", children: [_jsx("input", { type: "checkbox", name: "ids", value: m.id, form: formId, checked: selected.includes(m.id), onChange: (e) => setOne(m.id, e.target.checked) }), _jsxs("span", { className: "cap-sr-only", children: ["Select the mention from ", m.author] })] }) })) : null, _jsx("span", { className: "cap-row-status", id: `${p}-s`, children: _jsx(StatusWord, { state: m.state }) }), _jsx("div", { className: "cap-row-title", children: _jsxs("a", { href: href(withMentions(query, { open: open ? undefined : m.id })), "aria-expanded": open, "aria-controls": open ? `${p}-more` : undefined, "aria-describedby": `${p}-s ${p}-d`, onClick: toggle(m.id), children: [_jsx("span", { className: "cap-avatar", "data-size": "sm", "aria-hidden": "true", children: _jsx("span", { className: "cap-avatar-fallback", children: initials(m.author) }) }), " ", _jsx("span", { className: "cap-mq-name", children: m.author }), " ", _jsx("span", { className: "cap-mq-host", children: m.host })] }) }), _jsx("p", { className: "cap-row-detail", id: `${p}-d`, children: m.state === "failed" && m.failureReason ? m.failureReason : `On ${m.post}: “${m.excerpt}”` }), _jsxs("span", { className: "cap-row-meta", children: [_jsx(Time, { at: m.at, now: now }), _jsx("span", { className: "cap-row-chevron", "aria-hidden": "true" })] }), decisions.length || canDelete ? (_jsxs(Form, { method: "post", action: action, className: "cap-row-actions cap-mentions-act", "aria-label": `Decide the mention from ${m.author}`, children: [_jsx("input", { type: "hidden", name: "ids", value: m.id }), m.version ? _jsx("input", { type: "hidden", name: "version", value: m.version }) : null, decisions.map((a) => (_jsxs("button", { type: "submit", className: "cap-btn", "data-variant": "quiet", "data-size": "sm", name: "intent", value: a, "data-cap-action": a, "aria-keyshortcuts": keys ? ACTION_KEY[a] : undefined, children: [ACTION_LABEL[a], _jsxs("span", { className: "cap-sr-only", children: [" the mention from ", m.author] }), hint(ACTION_KEY[a])] }, a))), canDelete ? (_jsxs("button", { type: "submit", className: "cap-btn", "data-variant": "danger", "data-size": "sm", name: "intent", value: "delete", "data-cap-action": "delete", "aria-keyshortcuts": keys ? DELETE_KEY : undefined, children: ["Delete", _jsxs("span", { className: "cap-sr-only", children: [" the mention from ", m.author] }), hint(DELETE_KEY)] })) : null] })) : null, open ? (_jsxs("div", { className: "cap-mq-more", id: `${p}-more`, children: [_jsx("blockquote", { className: "cap-mq-quote", children: m.excerpt }), _jsxs("dl", { className: "cap-mq-facts", children: [_jsx("dt", { children: "From" }), _jsx("dd", { children: m.author }), _jsx("dt", { children: "Source" }), _jsx("dd", { children: m.external && m.url ? (_jsxs(_Fragment, { children: [_jsx("a", { href: m.url, rel: "nofollow ugc noopener", "data-external": "", children: m.url }), " ", "(opens the sender's page)"] })) : (_jsx("span", { className: "cap-mono", children: m.url ?? m.host })) }), _jsx("dt", { children: "On" }), _jsx("dd", { children: m.postHref ? _jsx("a", { href: m.postHref, children: m.post }) : m.post }), _jsx("dt", { children: "Received" }), _jsx("dd", { children: _jsx(Time, { at: m.at, format: "exact", now: now }) }), m.decidedAt ? (_jsxs(_Fragment, { children: [_jsx("dt", { children: "Decided" }), _jsx("dd", { children: _jsx(Time, { at: m.decidedAt, format: "exact", now: now }) })] })) : null] }), m.state === "failed" ? (_jsxs("p", { className: "cap-mq-why", children: [_jsx("b", { children: "Source not found." }), " ", m.failureReason ? `${m.failureReason} ` : "", "Its excerpt is kept, so you can see what was sent; it cannot be approved or rejected."] })) : m.state === "unverified" ? (_jsxs("p", { className: "cap-mq-why", children: [_jsx("b", { children: "Not yet checked." }), " The site has not read its source yet. It can be decided once it has."] })) : null] })) : null] }, m.id));
                }) })), query.cursor || page.nextCursor ? (_jsxs("nav", { className: "cap-mentions-pages", "aria-label": "Mentions pages", children: [query.cursor ? (_jsx("a", { className: "cap-btn", href: href(withMentions(query, { view: query.view })), children: "First page" })) : null, page.nextCursor ? (_jsx("a", { className: "cap-btn", href: href({ view: query.view, cursor: page.nextCursor }), children: "Next page" })) : null] })) : null, offers.sweep && can.decideMentions ? (_jsxs(Form, { method: "post", action: action, className: "cap-mq-retention", "aria-label": "Retention", children: [_jsx("p", { id: `${uid}-ret`, children: data.retention ?? "This site removes a mention whose source was not found, and a rejected one, once its retention has passed. Waiting and approved mentions are never removed." }), _jsx("button", { type: "submit", className: "cap-btn", name: "intent", value: "sweep", "aria-describedby": `${uid}-ret`, disabled: sweep.n === 0, children: sweep.label })] })) : null, intents.confirmDialog] }));
}
