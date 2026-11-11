import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useEffect, useId, useState } from "react";
import { Empty } from "../empty/empty.react.js";
import { useOptionalMessage } from "../message/message.react.js";
import { Row, RowList, usePlainRowForm, } from "../row-list/row-list.react.js";
import { Pill, Status } from "../status/status.react.js";
import { Time } from "../time/time.react.js";
import { URGENCY_ORDER, URGENCY_TITLE, focusNeighbor, needsShown, TONE_WORD, arrange, problemCount, viewLinkText, } from "./attention-list.js";
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
function whenOf(when) {
    return typeof when === "string" ? (when) : when ? (_jsx("time", { className: "cap-time", dateTime: when.datetime, children: when.text })) : null;
}
// No data-cap here: React owns the open and closed state, so the behavior module must not
// attach (it would toggle twice).
export function AttentionList(props) {
    const { items, title = "Needs attention", read, headingLevel = 2, clearText = "Nothing needs you.", noticesDetail = "Nothing to act on now", groups, problemRows, groupRows, primary = true, renderLink = plainLink, } = props;
    const id = useId();
    const [open, setOpen] = useState(() => new Set());
    const arranged = arrange(items, { rows: problemRows, children: groupRows, groups });
    const Heading = headingLevel === 3 ? "h3" : "h2";
    const toggle = (key) => setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(key))
            next.delete(key);
        else
            next.add(key);
        return next;
    });
    const regionId = (key) => `${id}-r-${key.replace(/\W+/g, "-")}`;
    const entry = (e) => {
        if (e.kind === "row") {
            const { item } = e;
            return (_jsx(Row, { tone: item.tone === "crit" ? "crit" : undefined, status: _jsx(Status, { tone: item.tone, children: TONE_WORD[item.tone] }), title: item.title, href: item.href, detail: item.detail, meta: whenOf(item.when), renderLink: renderLink }, item.id));
        }
        return group(e);
    };
    // A function, not a component: its identity must not change between renders, or a group
    // would remount (and lose focus) each time one opens.
    const group = (g) => {
        const rid = regionId(`group-${g.key}`);
        const isOpen = open.has(`group-${g.key}`);
        const link = viewLinkText(g);
        return (_jsxs(Fragment, { children: [_jsx(Row, { status: _jsx(Status, { tone: g.tone, children: TONE_WORD[g.tone] }), title: g.label, onOpen: () => toggle(`group-${g.key}`), expanded: isOpen, controls: rid, detail: g.detail, meta: whenOf(g.when) }), _jsx("li", { className: "cap-attention-region", id: rid, hidden: !isOpen, children: _jsxs("ul", { role: "list", "aria-label": g.label, children: [g.items.map((item) => (_jsx(Row, { className: "cap-attention-child", title: item.title, href: item.href, detail: item.detail, meta: whenOf(item.when), renderLink: renderLink }, item.id))), g.view && link ? (_jsx("li", { className: "cap-attention-link", children: renderLink({ href: g.view.href, children: link }) })) : null] }) })] }, `group-${g.key}`));
    };
    const moreOpen = open.has("more");
    const noticesOpen = open.has("notices");
    const n = arranged.noticeCount;
    const empty = arranged.problems.length === 0 && arranged.more.length === 0;
    return (_jsxs("section", { className: "cap-attention", "aria-labelledby": `${id}-h`, children: [_jsxs("header", { className: "cap-attention-head", children: [_jsx(Heading, { id: `${id}-h`, className: "cap-attention-title", children: title }), _jsx("span", { className: "cap-attention-count", children: problemCount(arranged) }), _jsxs("span", { className: "cap-attention-src", children: ["Worst first.", read ? _jsxs(_Fragment, { children: [" ", read] }) : null] })] }), empty ? (_jsxs("p", { className: "cap-attention-clear", children: [_jsx(Status, { tone: "ok", children: "All clear" }), _jsx("span", { className: "cap-attention-clear-text", children: clearText })] })) : null, !empty || arranged.notices.length ? (_jsxs(RowList, { labelledBy: `${id}-h`, primary: primary, children: [arranged.problems.map(entry), arranged.more.length ? (_jsxs(_Fragment, { children: [_jsx("li", { className: "cap-attention-link", children: _jsx("button", { type: "button", "aria-expanded": moreOpen, "aria-controls": regionId("more"), onClick: () => toggle("more"), children: moreOpen
                                        ? "Fewer warnings"
                                        : `${arranged.more.length} more ${arranged.more.length === 1 ? "warning" : "warnings"}` }) }), _jsx("li", { className: "cap-attention-region", id: regionId("more"), hidden: !moreOpen, children: _jsx("ul", { role: "list", "aria-label": "More warnings", children: arranged.more.map(entry) }) })] })) : null, arranged.notices.length ? (_jsxs(_Fragment, { children: [_jsx(Row, { className: "cap-attention-notices", status: _jsx(Status, { tone: "info", children: TONE_WORD.info }), title: `${n} ${n === 1 ? "notice" : "notices"}`, onOpen: () => toggle("notices"), expanded: noticesOpen, controls: regionId("notices"), detail: noticesDetail }), _jsx("li", { className: "cap-attention-region", id: regionId("notices"), hidden: !noticesOpen, children: _jsx("ul", { role: "list", "aria-label": "Notices", children: arranged.notices.map((item) => (_jsx(Row, { className: "cap-attention-child", title: item.title, href: item.href, detail: [TONE_WORD[item.tone], item.detail].filter(Boolean).join(" · "), meta: whenOf(item.when), renderLink: renderLink }, item.id))) }) })] })) : null] })) : null] }));
}
const plainNeedLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
function NeedRow({ need, zone, noteId, onBack, renderLink, useRowForm, }) {
    const { Form, pending } = useRowForm();
    const message = useOptionalMessage();
    // The row leaves the list as soon as it is sent; it is back if the server refused it.
    if (pending)
        return null;
    const aside = need.later !== undefined;
    return (_jsx(Row, { className: "cap-need-row", title: need.title, href: need.action.href, detail: need.detail, meta: aside ? (_jsxs("span", { children: ["Back ", _jsx(Time, { at: need.later })] })) : need.at ? (_jsx(Time, { at: need.at })) : undefined, renderLink: renderLink, actions: _jsxs(_Fragment, { children: [_jsxs(Form, { method: "post", onSubmit: (e) => {
                        const row = e.currentTarget.closest(".cap-need-row");
                        if (row)
                            focusNeighbor(row);
                        if (aside)
                            message?.say(`Back on the list: ${need.title}`);
                        else
                            message?.say(`Set for later, until tomorrow morning: ${need.title}`, {
                                undo: onBack ? () => onBack(need) : undefined,
                                undone: `Back on the list: ${need.title}`,
                            });
                    }, children: [_jsx("input", { type: "hidden", name: "intent", value: aside ? "back" : "later" }), _jsx("input", { type: "hidden", name: "need", value: need.id }), _jsx("input", { type: "hidden", name: "title", value: need.title }), _jsx("input", { type: "hidden", name: "zone", value: zone }), _jsx("button", { type: "submit", className: "cap-btn", "data-variant": "quiet", "data-cap-part": "later", "aria-describedby": aside ? undefined : noteId, children: aside ? "Bring back" : "Later" })] }), renderLink({
                    href: need.action.href,
                    className: "cap-btn",
                    "data-variant": "primary",
                    children: need.action.label,
                })] }) }));
}
// What waits on one person, Blocking first, then Waiting for you, oldest first within each, as
// one row list (so j and k move through both) with the urgency headings between the rows. Each
// row has its one main action and Later, which sets it aside until 8 am tomorrow in the
// person's zone; the row leaves at once, focus moves to the next row, and the message offers
// Undo. `l` on a row sets it aside (or brings it back in the Later view): a single key that acts
// only while focus is on a row (WCAG 2.1.4) and obeys `data-cap-single-keys="off"` on <html>.
// From Carrel's Home (app/routes/home.tsx).
export function NeedsList({ needs, show, label, zone, renderLink = plainNeedLink, useRowForm = usePlainRowForm, onBack, searchKey, emptyText, emptyLaterText, primary, }) {
    const noteId = useId();
    const later = show === "later";
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "l" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented)
                return;
            if (document.documentElement.dataset.capSingleKeys === "off")
                return;
            const row = document.activeElement?.closest(".cap-need-row");
            const button = row?.querySelector("[data-cap-part='later']");
            if (!button)
                return;
            e.preventDefault();
            button.click();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);
    const rows = needsShown(needs, show);
    if (rows.length === 0)
        return later ? (_jsx(Empty, { kind: "all-clear", flush: true, title: "Nothing set aside", children: emptyLaterText ?? "Later on a row hides it until tomorrow morning." })) : (_jsx(Empty, { kind: "all-clear", flush: true, title: "Nothing needs you", children: emptyText ??
                (show === "all" ? "Everything waiting on you is done." : "Nothing here. Try All.") }));
    return (_jsxs(_Fragment, { children: [_jsx(RowList, { label: label ?? (later ? "Set aside for later" : "Needs you"), primary: primary, children: URGENCY_ORDER.map((u) => {
                    const group = rows.filter((n) => n.urgency === u);
                    if (group.length === 0)
                        return null;
                    return [
                        _jsx("li", { className: "cap-need-group", children: _jsxs("h3", { className: "cap-need-head", children: [_jsx(Pill, { tone: u === "blocking" ? "crit" : undefined, variant: "secondary", children: URGENCY_TITLE[u] }), _jsx("span", { className: "cap-need-count", children: group.length })] }) }, u),
                        ...group.map((n) => (_jsx(NeedRow, { need: n, zone: zone, noteId: noteId, onBack: onBack, renderLink: renderLink, useRowForm: useRowForm }, n.id))),
                    ];
                }) }), _jsxs("p", { className: "cap-need-keys", children: [_jsxs("span", { className: "cap-need-key", children: [_jsx("kbd", { children: "j" }), " ", _jsx("kbd", { children: "k" }), " move"] }), _jsxs("span", { className: "cap-need-key", children: [_jsx("kbd", { children: "Enter" }), " open"] }), _jsxs("span", { className: "cap-need-key", children: [_jsx("kbd", { children: "l" }), " ", later ? "bring back" : "later"] }), searchKey ? (_jsxs("span", { className: "cap-need-key", children: [_jsx("kbd", { children: searchKey }), " ", _jsx("kbd", { children: "K" }), " search"] })) : null, _jsx("span", { id: noteId, children: later
                            ? "These come back on their own at 8 am, or sooner if they change."
                            : "Later hides a row until 8 am tomorrow, or sooner if it changes." })] })] }));
}
