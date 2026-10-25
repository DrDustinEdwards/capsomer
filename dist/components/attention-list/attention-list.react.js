import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useId, useState } from "react";
import { Row, RowList } from "../row-list/row-list.react.js";
import { Status } from "../status/status.react.js";
import { TONE_WORD, arrange, problemCount, viewLinkText } from "./attention-list.js";
const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
function whenOf(when) {
    return typeof when === "string" ? when : when ? _jsx("time", { className: "cap-time", dateTime: when.datetime, children: when.text }) : null;
}
// No data-cap here: React owns the open and closed state, so the behaviour module must not
// attach (it would toggle twice).
export function AttentionList(props) {
    const { items, title = "Needs attention", read, headingLevel = 2, clearText = "Nothing needs you.", noticesDetail = "Nothing to act on now", groups, problemRows, groupRows, primary = true, renderLink = plainLink } = props;
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
            return _jsx(Row, { tone: item.tone === "crit" ? "crit" : undefined, status: _jsx(Status, { tone: item.tone, children: TONE_WORD[item.tone] }), title: item.title, href: item.href, detail: item.detail, meta: whenOf(item.when), renderLink: renderLink }, item.id);
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
    return (_jsxs("section", { className: "cap-attention", "aria-labelledby": `${id}-h`, children: [_jsxs("header", { className: "cap-attention-head", children: [_jsx(Heading, { id: `${id}-h`, className: "cap-attention-title", children: title }), _jsx("span", { className: "cap-attention-count", children: problemCount(arranged) }), _jsxs("span", { className: "cap-attention-src", children: ["Worst first.", read ? _jsxs(_Fragment, { children: [" ", read] }) : null] })] }), empty ? (_jsxs("p", { className: "cap-attention-clear", children: [_jsx(Status, { tone: "ok", children: "All clear" }), _jsx("span", { className: "cap-attention-clear-text", children: clearText })] })) : null, !empty || arranged.notices.length ? (_jsxs(RowList, { labelledBy: `${id}-h`, primary: primary, children: [arranged.problems.map(entry), arranged.more.length ? (_jsxs(_Fragment, { children: [_jsx("li", { className: "cap-attention-link", children: _jsx("button", { type: "button", "aria-expanded": moreOpen, "aria-controls": regionId("more"), onClick: () => toggle("more"), children: moreOpen ? "Fewer warnings" : `${arranged.more.length} more ${arranged.more.length === 1 ? "warning" : "warnings"}` }) }), _jsx("li", { className: "cap-attention-region", id: regionId("more"), hidden: !moreOpen, children: _jsx("ul", { role: "list", "aria-label": "More warnings", children: arranged.more.map(entry) }) })] })) : null, arranged.notices.length ? (_jsxs(_Fragment, { children: [_jsx(Row, { className: "cap-attention-notices", status: _jsx(Status, { tone: "info", children: TONE_WORD.info }), title: `${n} ${n === 1 ? "notice" : "notices"}`, onOpen: () => toggle("notices"), expanded: noticesOpen, controls: regionId("notices"), detail: noticesDetail }), _jsx("li", { className: "cap-attention-region", id: regionId("notices"), hidden: !noticesOpen, children: _jsx("ul", { role: "list", "aria-label": "Notices", children: arranged.notices.map((item) => (_jsx(Row, { className: "cap-attention-child", title: item.title, href: item.href, detail: [TONE_WORD[item.tone], item.detail].filter(Boolean).join(" · "), meta: whenOf(item.when), renderLink: renderLink }, item.id))) }) })] })) : null] })) : null] }));
}
