import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useEffect, useId, useRef } from "react";
import { attach as attachTip, hideTip } from "../tooltip/tooltip.js";
import { Time } from "../time/time.react.js";
import { DEFAULT_PREF } from "../shell/shell.js";
import { groups, plainLink, useCollapsedPref } from "../shell/shell.react.js";
import { SheetGroup, SiteHeader, SiteTabs } from "../site-header/site-header.react.js";
import { countName as headerCountName, TipKeys } from "../site-header/site-header-parts.react.js";
import { applyStoredTheme, THEME_PREF } from "../theme-switch/theme-switch.js";
import { badgeText, jumpTarget } from "./admin-shell.js";
import { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER } from "./apps.js";
export { startPageTransition } from "./admin-shell.js";
export { FAMILY_APPS, FIRST_PAGE, FOXHOUND_MARKS, OWNER };
const Icon = ({ d }) => (_jsx("svg", { className: "cap-admin-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: d }) }));
// The header's glyphs are the 24-box, 1.6-stroke family the header draws at 18px.
const HeaderIcon = ({ d }) => (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: d }) }));
const COLLAPSE_D = "M3 4h18v16H3zM9 4v16M16 10l-2 2 2 2";
const EXPAND_D = "M3 4h18v16H3zM9 4v16M14 10l2 2-2 2";
const SEARCH_D = "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM21 21l-5-5";
const INBOX_D = "M3 13h5l1 3h6l1-3h5M5 5h14l2 8v6H3v-6z";
const REFRESH_D = "M20 12a8 8 0 1 1-2.3-5.6M20 4v4.5h-4.5";
const countName = (label, count, note) => (count ? headerCountName(label, count, note) : undefined);
// A control's name, shown beside it on hover and keyboard focus: Capsomer's one tooltip (the
// shared popover's tooltip variant, in the top layer, so it is above every panel, tile and
// badge). It is a child of its control and attaches to it; keys are key caps ("G", "2").
// `describe` false leaves the control's description alone, where the tip repeats its name.
// `offset` clears what sits beside the control: a strip tip starts past the strip's edge (and so
// past the control's own badge), a menu tip past the menu's.
function Tip({ text, keys, side = "right", offset = 20, describe = true }) {
    const tip = useRef(null);
    useEffect(() => {
        const el = tip.current;
        const trigger = el?.parentElement;
        if (!el || !trigger)
            return;
        const detach = attachTip(trigger, el);
        if (!describe)
            trigger.removeAttribute("aria-describedby");
        // A control that is used (a click or Enter) has done what its name said: the name goes, so
        // it does not sit over the panel or page the control opened.
        const used = () => hideTip(trigger);
        trigger.addEventListener("click", used);
        return () => {
            trigger.removeEventListener("click", used);
            detach();
        };
    }, [describe]);
    return (_jsxs("span", { ref: tip, className: "cap-admin-tip cap-popover", "data-variant": "tooltip", "data-side": side, "data-offset": offset, popover: "manual", role: "tooltip", "aria-hidden": "true", children: [_jsx("span", { className: "cap-admin-tip-text", children: text }), _jsx(TipKeys, { keys: keys })] }));
}
// The strip: the family's apps in their one order, this one marked, others with their badges.
function stripApps(app, badges, apps) {
    if (apps)
        return apps;
    return FAMILY_APPS.map((a) => ({ ...badges?.[a.id], id: a.id, label: a.label, href: a.href, logo: a.logo, current: a.id === app }));
}
const Badge = ({ count }) => count ? (_jsx("span", { className: "cap-admin-badge", "aria-hidden": "true", children: badgeText(count) })) : null;
const mark = (a) => a.logo ?? _jsx("span", { "aria-hidden": "true", children: a.mono ?? a.label.slice(0, 1) });
export function AdminShell(props) {
    const { variant = "owner", app, nav, page, documentTitle = true, navLabel = "Sections", onSearch, searchShortcut = "Ctrl K", inbox, onHelp, trail, updated, status, actions, onRefresh, refreshing, refreshShortcut, themePrefKey = THEME_PREF, themeKey, prefKey = DEFAULT_PREF, jumpKeys = true, collapseKey = "[", renderLink = plainLink, mainProps, children, } = props;
    const owner = variant === "owner";
    const apps = stripApps(app, props.badges, props.apps);
    const family = FAMILY_APPS.find((a) => a.id === app);
    const title = props.title ?? family?.label ?? apps.find((a) => a.current)?.label ?? "";
    const root = useRef(null);
    const groupId = useId();
    const [collapsed, setCollapsed] = useCollapsedPref(prefKey, props.collapsed, props.onCollapsedChange);
    // The tab says the page, then the app: "Queue · Capsid Portal".
    // An app whose routes set their own titles turns this off with documentTitle={false}.
    useEffect(() => {
        if (documentTitle && title)
            document.title = page ? `${page} · ${title}` : title;
    }, [documentTitle, page, title]);
    // The remembered theme, in case the app's head script did not apply it before paint.
    useEffect(() => void applyStoredTheme(themePrefKey), [themePrefKey]);
    // G then a number jumps between apps (Esc hiding a shown name is the tooltip's own).
    const appsRef = useRef(apps);
    appsRef.current = apps;
    useEffect(() => {
        if (!owner)
            return;
        const armed = { at: 0 };
        const onKey = (e) => {
            const to = jumpKeys ? jumpTarget(armed, e, appsRef.current) : null;
            if (to) {
                e.preventDefault();
                location.assign(to);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [jumpKeys, owner]);
    const tabs = (props.tabs ?? nav.slice(0, 5)).slice(0, 5);
    const item = (e) => (_jsx(Fragment, { children: renderLink({
            href: e.href,
            "aria-current": e.current ? "page" : undefined,
            "aria-label": countName(e.label, e.count, e.countNote),
            children: (_jsxs(_Fragment, { children: [e.icon ?? (_jsx("span", { className: "cap-admin-letter", "aria-hidden": "true", children: e.label.slice(0, 1) })), _jsx("span", { className: "cap-admin-label", children: e.label }), " ", _jsx("span", { className: "cap-admin-count", "data-tone": e.tone, children: e.count ? badgeText(e.count) : "" }), _jsx(Tip, { text: e.label, offset: 12, describe: false })] })),
        }) }, e.id));
    // The header: the logo (the app's mark and name), the extras (Search, Inbox, then the app's
    // own), the theme, and the account menu last.
    const logo = props.logo ?? { href: family?.href ?? apps.find((a) => a.current)?.href ?? "/", label: title, mark: family?.logo ?? apps.find((a) => a.current)?.logo };
    const extras = [
        ...(onSearch ? [{ id: "search", label: "Search everything", icon: _jsx(HeaderIcon, { d: SEARCH_D }), onClick: onSearch, keys: searchShortcut }] : []),
        ...(inbox ? [{ id: "inbox", label: "Inbox", icon: _jsx(HeaderIcon, { d: INBOX_D }), href: inbox.href, onClick: inbox.onOpen, count: inbox.count, countNote: inbox.countNote ?? "need you", keys: inbox.shortcut }] : []),
        ...(props.extras ?? []),
    ];
    const accountProps = props.account;
    const account = accountProps
        ? {
            name: accountProps.name ?? OWNER.name,
            initials: accountProps.initials ?? OWNER.initials,
            avatar: accountProps.avatar,
            detail: [accountProps.role, accountProps.email].filter(Boolean).join(" · ") || undefined,
            groups: [
                ...(accountProps.appLinks?.length ? [{ label: accountProps.appLabel ?? "This app", links: accountProps.appLinks }] : []),
                ...(props.viewSite || onHelp ? [{ links: [...(props.viewSite ? [{ label: "View site", href: props.viewSite }] : []), ...(onHelp ? [{ label: "Help and shortcuts", onClick: onHelp }] : [])] }] : []),
            ],
            onSignOut: accountProps.onSignOut,
            signOutDisabled: accountProps.signOutDisabled,
        }
        : undefined;
    const toSheet = (e) => ({ id: e.id, label: e.label, href: e.href, current: e.current, icon: e.icon, count: e.count, countNote: e.countNote });
    return (_jsxs("div", { ref: root, className: "cap-admin", "data-cap": "admin-shell", "data-variant": variant, "data-menu": collapsed ? "collapsed" : undefined, "data-transition": props.transition ? "page" : undefined, children: [_jsx(SiteHeader, { logo: logo, band: props.band, translucent: props.translucent, switchers: props.switchers, extras: extras, themePrefKey: themePrefKey, themeKey: themeKey, account: account, skipTo: "#cap-main", renderLink: renderLink, sheetTitle: `${title} menu`, sheetStart: owner
                    ? (close) => (_jsxs(_Fragment, { children: [_jsx("div", { className: "cap-site-header-sheet-label", children: "Apps" }), _jsx("ul", { className: "cap-site-header-sheet-list", children: apps.map((a) => (_jsx("li", { children: renderLink({
                                        href: a.href,
                                        "aria-current": a.current ? "true" : undefined,
                                        "aria-label": a.current ? undefined : countName(a.label, a.count, a.countNote ?? "need you"),
                                        onClick: close,
                                        children: (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true", children: mark(a) }), _jsx("span", { className: "cap-site-header-sheet-name", children: a.label }), a.current || !a.count ? null : " ", a.current || !a.count ? null : (_jsx("span", { className: "cap-site-header-count", "aria-hidden": "true", children: badgeText(a.count) }))] })),
                                    }) }, a.id))) })] }))
                    : undefined, sheetEnd: (close) => groups(nav).map((g, i) => _jsx(SheetGroup, { label: g.label ?? title, links: g.entries.map(toSheet), renderLink: renderLink, onClose: close }, g.label ?? `g${i}`)) }), owner ? (_jsx("nav", { className: "cap-admin-strip", "aria-label": "Apps", children: _jsx("ul", { className: "cap-admin-strip-group", children: apps.map((a, i) => (_jsx("li", { children: (a.current ? renderLink : plainLink)({
                            href: a.href,
                            className: "cap-admin-tile",
                            "aria-current": a.current ? "true" : undefined,
                            "aria-label": a.current ? a.label : (countName(a.label, a.count, a.countNote ?? "need you") ?? a.label),
                            children: (_jsxs(_Fragment, { children: [mark(a), a.current ? null : _jsx(Badge, { count: a.count }), _jsx(Tip, { text: a.label, keys: i < 9 && jumpKeys ? `G ${i + 1}` : undefined })] })),
                        }) }, a.id))) }) })) : null, _jsxs("nav", { className: "cap-admin-menu", id: "cap-admin-menu", "aria-label": navLabel, children: [_jsxs("button", { type: "button", className: "cap-admin-collapse", "data-cap-part": "menu-toggle", "aria-label": collapsed ? "Expand menu" : "Collapse menu", "aria-expanded": !collapsed, "aria-controls": "cap-admin-menu", onClick: () => setCollapsed(!collapsed), children: [_jsx(Icon, { d: collapsed ? EXPAND_D : COLLAPSE_D }), _jsx("span", { className: "cap-admin-label", children: collapsed ? "Expand menu" : "Collapse menu" }), _jsx("span", { className: "cap-keys", "aria-hidden": "true", children: _jsx("kbd", { children: collapseKey }) }), _jsx(Tip, { text: collapsed ? "Expand menu" : "Collapse menu", keys: collapseKey, offset: 12, describe: false })] }), groups(nav).map((g, i) => g.label ? (_jsxs("div", { className: "cap-admin-group", role: "group", "aria-labelledby": `${groupId}-${i}`, children: [_jsx("div", { className: "cap-admin-group-label", id: `${groupId}-${i}`, children: g.label }), g.entries.map(item)] }, `g${i}`)) : (g.entries.map(item)))] }), _jsxs("main", { ...mainProps, className: "cap-admin-main", id: "cap-main", tabIndex: -1, children: [_jsxs("div", { className: "cap-admin-bar", children: [_jsxs("div", { className: "cap-admin-bar-text", children: [trail && trail.length > 0 ? (_jsx("nav", { className: "cap-admin-trail", "aria-label": "Breadcrumb", children: _jsxs("ol", { children: [trail.map((c) => (_jsx("li", { children: renderLink({ href: c.href, children: c.label }) }, c.href))), page ? (_jsx("li", { children: _jsx("span", { "aria-current": "page", children: page }) })) : null] }) })) : null, updated ? (_jsxs("span", { className: "cap-admin-fresh", children: ["Updated ", _jsx(Time, { at: updated.at }), updated.auto ? " · refreshes itself" : null] })) : null, status ? _jsx("div", { className: "cap-admin-bar-status", children: status }) : null] }), actions || onRefresh ? (_jsxs("div", { className: "cap-admin-actions", children: [actions, onRefresh && (_jsxs("button", { type: "button", className: "cap-admin-btn", "data-cap-part": "refresh", "aria-label": "Refresh", "aria-busy": refreshing || undefined, onClick: onRefresh, children: [_jsx(Icon, { d: REFRESH_D }), _jsx(Tip, { text: "Refresh", keys: refreshShortcut, side: "bottom", offset: 6 })] }))] })) : null] }), children] }), _jsx(SiteTabs, { tabs: tabs.map(toSheet), label: navLabel, renderLink: renderLink })] }));
}
