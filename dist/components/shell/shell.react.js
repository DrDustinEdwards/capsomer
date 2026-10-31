import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "../dialog/dialog.react.js";
import { DEFAULT_PREF, readPref, writePref } from "./shell.js";
const RailIcon = () => (_jsx("svg", { className: "cap-shell-icon", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", d: "M2.5 2.5h11v11h-11zM6 2.5v11M10.5 6 8.5 8l2 2" }) }));
const MoreIcon = () => (_jsxs("svg", { className: "cap-shell-icon", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "3", cy: "8", r: "1.4", fill: "currentColor" }), _jsx("circle", { cx: "8", cy: "8", r: "1.4", fill: "currentColor" }), _jsx("circle", { cx: "13", cy: "8", r: "1.4", fill: "currentColor" })] }));
export const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
// Consecutive entries with the same `group` are one group.
export function groups(nav) {
    const out = [];
    for (const e of nav) {
        const last = out[out.length - 1];
        if (last && last.label === e.group)
            last.entries.push(e);
        else
            out.push({ label: e.group, entries: [e] });
    }
    return out;
}
// The rail's collapsed state: the prop when the app controls it, else the stored preference.
export function useCollapsedPref(prefKey, controlled, onChange) {
    const [own, setOwn] = useState(false);
    useEffect(() => setOwn(readPref(prefKey) === "collapsed"), [prefKey]);
    const setCollapsed = useCallback((next) => {
        writePref(prefKey, next ? "collapsed" : "expanded");
        setOwn(next);
        onChange?.(next);
    }, [prefKey, onChange]);
    return [controlled ?? own, setCollapsed];
}
export function Shell(props) {
    const { brand, brandHref = "./", logo, brandLabel, nav, tabs, more, moreLabel = "More", moreIcon, navLabel = "Sections", status, actions, railFoot, prefKey = DEFAULT_PREF, renderLink = plainLink, children } = props;
    const moreButton = useRef(null);
    const groupId = useId();
    const [moreOpen, setMoreOpen] = useState(false);
    // The shared dialog closes by Esc, Close, the backdrop and Back; a link in the list closes it
    // too. Focus goes back to More, which a browser that does not focus a pressed button needs.
    const closeMore = useCallback(() => {
        setMoreOpen(false);
        requestAnimationFrame(() => moreButton.current?.focus());
    }, []);
    const [collapsed, setCollapsed] = useCollapsedPref(prefKey, props.collapsed, props.onCollapsedChange);
    // A phone tab bar holds at most five entries (rule 9): with a More sheet, four and More.
    const phoneTabs = tabs?.slice(0, more ? 4 : 5);
    const entry = (e, phone) => {
        // The visible label and count, then what it counts: "Sites, 2 down or degraded" (WCAG 2.5.3).
        const named = e.count ? `${e.label}, ${e.count}${e.countNote ? ` ${e.countNote}` : ""}` : undefined;
        return (_jsx(Fragment, { children: renderLink({
                href: e.href,
                "aria-current": e.current ? "page" : undefined,
                "aria-label": named,
                children: phone ? (_jsxs(_Fragment, { children: [e.icon, e.label, e.count ? " " : null, e.count ? _jsx("span", { className: "cap-shell-badge", children: e.count }) : null] })) : (_jsxs(_Fragment, { children: [e.icon ?? _jsx("span", { "aria-hidden": "true" }), _jsx("span", { className: "cap-shell-label", children: e.label }), " ", _jsx("span", { className: "cap-shell-count", "data-tone": e.tone, children: e.count ? e.count : "" })] })),
            }) }, e.id));
    };
    return (_jsxs("div", { className: "cap-shell", "data-cap": "shell", "data-rail": collapsed ? "collapsed" : undefined, children: [_jsx("a", { className: "cap-shell-skip", href: "#cap-main", children: "Skip to content" }), _jsxs("header", { className: "cap-shell-top", children: [renderLink({
                        href: brandHref,
                        className: "cap-shell-brand",
                        "aria-label": brandLabel,
                        children: (_jsxs(_Fragment, { children: [logo ? (_jsx("span", { className: "cap-shell-logo", "aria-hidden": "true", children: logo })) : null, brand] })),
                    }), _jsx("div", { className: "cap-shell-spacer" }), status, _jsx("div", { className: "cap-shell-actions", children: actions })] }), _jsxs("nav", { className: "cap-shell-rail", id: "cap-rail", "aria-label": navLabel, children: [groups(nav).map((g, i) => g.label ? (_jsxs("div", { className: "cap-shell-group", role: "group", "aria-labelledby": `${groupId}-${i}`, children: [_jsx("div", { className: "cap-shell-group-label", id: `${groupId}-${i}`, children: g.label }), g.entries.map((e) => entry(e, false))] }, `g${i}`)) : (g.entries.map((e) => entry(e, false)))), _jsxs("div", { className: "cap-shell-foot", children: [railFoot, _jsxs("button", { type: "button", className: "cap-shell-toggle", "data-cap-part": "rail-toggle", "aria-expanded": !collapsed, "aria-controls": "cap-rail", onClick: () => setCollapsed(!collapsed), children: [_jsx(RailIcon, {}), _jsx("span", { className: "cap-shell-label", children: collapsed ? "Expand menu" : "Collapse menu" }), _jsx("kbd", { "aria-hidden": "true", children: "[" })] })] })] }), _jsx("main", { className: "cap-shell-main", id: "cap-main", tabIndex: -1, children: children }), phoneTabs && phoneTabs.length > 0 && (_jsxs("nav", { className: "cap-shell-tabs", "aria-label": navLabel, children: [phoneTabs.map((e) => entry(e, true)), more && (_jsxs("button", { ref: moreButton, type: "button", "data-cap-part": "more", "aria-haspopup": "dialog", "aria-expanded": moreOpen, "aria-controls": "cap-more", "aria-current": more.some((e) => e.current) ? "true" : undefined, onClick: () => setMoreOpen(true), children: [moreIcon ?? _jsx(MoreIcon, {}), moreLabel] }))] })), more && (_jsxs(Dialog, { open: moreOpen, onOpenChange: (o) => !o && closeMore(), placement: "bottom", id: "cap-more", className: "cap-shell-more", "aria-labelledby": "cap-more-title", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { id: "cap-more-title", children: "More views" }) }), _jsx(DialogBody, { children: _jsx("nav", { "aria-labelledby": "cap-more-title", children: _jsx("ul", { className: "cap-shell-more-list", children: more.map((e) => (_jsx("li", { children: renderLink({
                                        href: e.href,
                                        "aria-current": e.current ? "page" : undefined,
                                        onClick: closeMore,
                                        children: (_jsxs(_Fragment, { children: [e.icon, _jsx("span", { className: "cap-shell-more-name", children: e.label }), e.count ? " " : null, e.count ? _jsx("span", { className: "cap-shell-count", children: `${e.count}${e.countNote ? ` ${e.countNote}` : ""}` }) : null] })),
                                    }) }, e.id))) }) }) })] }))] }));
}
