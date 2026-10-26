import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The site header's props and the small parts its panels and sheet are built from (site-header.react.tsx).
import { Fragment, useEffect, useRef } from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.js";
import { badgeText, wirePanel } from "./site-header.js";
export const plainLink = ({ children, ...props }) => _jsx("a", { ...props, children: children });
const svg = (body) => (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: body }));
export const CHEV = (_jsx("svg", { className: "cap-site-header-chev", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: "m6 9 6 6 6-6" }) }));
export const MENU_ICON = svg(_jsx("path", { d: "M4 7h16M4 12h16M4 17h16" }));
export const PERSON_ICON = svg(_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "8", r: "4" }), _jsx("path", { d: "M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" })] }));
// "Inbox, 4 need you": a count is in the name, with what it counts. Past 99 the badge reads 99+,
// so the name starts with what is seen and keeps the real count: "Inbox 99+, 120 need you". The
// visible label and count must be words of the name in that order (WCAG 2.5.3; axe-core 4.14's
// label-content-name-mismatch reads aria-hidden text too).
export const countName = (label, count, note) => (count ? `${label}${count > 99 ? " 99+" : ""}, ${count}${note ? ` ${note}` : ""}` : label);
// A tip's key caps ("G 2"), after its words.
export function TipKeys({ keys }) {
    return keys ? (_jsx("span", { className: "cap-keys", children: keys.split(" ").map((k) => (_jsx("kbd", { children: k }, k))) })) : null;
}
// An icon control's name, shown on hover and keyboard focus: Capsomer's one tooltip, a child of
// its control, below the header's controls. It repeats the control's name, so it adds no
// description; a press hides it.
export function HeaderTip({ text, keys }) {
    const tip = useRef(null);
    useEffect(() => {
        const el = tip.current;
        const trigger = el?.parentElement;
        if (!el || !trigger)
            return;
        const detach = attachTip(trigger, el);
        trigger.removeAttribute("aria-describedby");
        const used = () => hideTip(trigger);
        trigger.addEventListener("click", used);
        return () => {
            trigger.removeEventListener("click", used);
            detach();
        };
    }, []);
    return (_jsxs("span", { ref: tip, className: "cap-site-header-tip cap-popover", "data-variant": "tooltip", "data-side": "bottom", "data-offset": "6", popover: "manual", role: "tooltip", "aria-hidden": "true", children: [_jsx("span", { className: "cap-site-header-tip-text", children: text }), _jsx(TipKeys, { keys: keys })] }));
}
// A disclosure button and its panel, wired by the behavior module (the open state is the
// platform's popover state, not React's).
export function Disclosure({ id, className, label, name, current, align, children, button }) {
    const trigger = useRef(null);
    const panel = useRef(null);
    useEffect(() => {
        if (trigger.current && panel.current)
            return wirePanel(trigger.current, panel.current);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("button", { ref: trigger, type: "button", className: className, "data-cap-part": "panel-trigger", "data-current": current ? "" : undefined, "aria-expanded": "false", "aria-controls": id, "aria-label": name, children: button }), _jsx("div", { ref: panel, id: id, className: "cap-site-header-panel", popover: "manual", "data-align": align, role: "group", "aria-label": label, children: children })] }));
}
export function GroupList({ groups, renderLink }) {
    return (_jsx(_Fragment, { children: groups.map((g, i) => (_jsxs(Fragment, { children: [i > 0 && !g.label ? _jsx("hr", {}) : null, g.label ? _jsx("div", { className: "cap-site-header-panel-label", children: g.label }) : null, _jsx("ul", { className: "cap-site-header-panel-list", children: g.links.map((l) => (_jsx("li", { children: renderLink({
                            href: l.href,
                            "aria-current": l.current ? "page" : undefined,
                            "aria-label": l.count ? countName(l.label, l.count, l.countNote) : undefined,
                            children: (_jsxs(_Fragment, { children: [l.icon ? _jsx("span", { className: "cap-site-header-mark", "aria-hidden": "true", children: l.icon }) : null, l.label, l.count ? " " : null, l.count ? _jsx("span", { className: "cap-site-header-count", "aria-hidden": "true", children: badgeText(l.count) }) : null] })),
                        }) }, l.id ?? l.href))) })] }, g.label ?? i))) }));
}
function SheetList({ links, renderLink, onClose }) {
    return (_jsx("ul", { className: "cap-site-header-sheet-list", children: links.map((l) => (_jsx("li", { children: renderLink({
                href: l.href,
                "aria-current": l.current ? "page" : undefined,
                "aria-label": l.count ? countName(l.label, l.count, l.countNote) : undefined,
                onClick: onClose,
                children: (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true", children: l.icon }), _jsx("span", { className: "cap-site-header-sheet-name", children: l.label }), l.count ? " " : null, l.count ? (_jsx("span", { className: "cap-site-header-count", "aria-hidden": "true", children: badgeText(l.count) })) : null] })),
            }) }, l.id ?? l.href))) }));
}
// A labeled group of rows in the sheet, for a site's own rows (your admin's apps, its menu).
export function SheetGroup({ label, links, renderLink = plainLink, onClose }) {
    return (_jsxs(_Fragment, { children: [label ? _jsx("div", { className: "cap-site-header-sheet-label", children: label }) : null, _jsx(SheetList, { links: links, renderLink: renderLink, onClose: onClose })] }));
}
export const part = (p, close) => (typeof p === "function" ? p(close) : p);
