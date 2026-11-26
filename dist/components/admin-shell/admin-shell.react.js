import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useId, useRef, useLayoutEffect } from "react";
import { Time } from "../time/time.react.js";
import { DEFAULT_PREF } from "../shell/shell.js";
import { plainLink } from "../hooks/hooks.react.js";
import { groups, useCollapsedPref } from "../shell/shell.react.js";
import { SheetGroup, SiteHeader, SiteTabs, } from "../site-header/site-header.react.js";
import { applyStoredTheme, syncServedTheme, THEME_PREF } from "../theme-switch/theme-switch.js";
import { ACCESS_LOGOUT, badgeText, currentEntryId, isCollapseKey, jumpTarget, } from "./admin-shell.js";
import { FAMILY_APPS, FIRST_PAGE, OWNER } from "./apps.js";
import { Badge, COLLAPSE_D, countName, EXPAND_D, HeaderIcon, Icon, INBOX_D, mark, REFRESH_D, SEARCH_D, stripApps, Tip, } from "./admin-shell-parts.react.js";
export { ACCESS_LOGOUT, currentEntryId, startPageTransition } from "./admin-shell.js";
export { AdminErrorView } from "./admin-error.react.js";
export { FAMILY_APPS, FIRST_PAGE, OWNER };
export function AdminShell(props) {
    const { variant = "owner", app, pathname, documentTitle = true, navLabel = "Sections", onSearch, searchShortcut = "Ctrl K", inbox, onHelp, trail, updated, status, actions, onRefresh, refreshing, refreshShortcut, themePrefKey = THEME_PREF, themeKey, themeCookie, onThemeSave, themeInitial, themeAction, hydrate, prefKey = DEFAULT_PREF, jumpKeys = true, collapseKey = "[", renderLink = plainLink, mainProps, children, } = props;
    const owner = variant === "owner";
    // The page you are on, from the address, for entries that do not say.
    const derived = pathname === undefined ? undefined : currentEntryId(pathname, props.nav);
    const nav = derived === undefined
        ? props.nav
        : props.nav.map((e) => (e.current === undefined ? { ...e, current: e.id === derived } : e));
    const page = props.page ?? (pathname === undefined ? undefined : nav.find((e) => e.current)?.label);
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
    // Where the server keeps the choice, its answer is copied into this browser first.
    const serverKept = Boolean(themeCookie || onThemeSave);
    useEffect(() => {
        if (serverKept)
            syncServedTheme(themePrefKey);
        applyStoredTheme(themePrefKey);
    }, [serverKept, themePrefKey]);
    // G then a number jumps between apps (Esc hiding a shown name is the tooltip's own).
    const appsRef = useRef(apps);
    useLayoutEffect(() => {
        appsRef.current = apps;
    });
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
    // The collapse key, bound here so every app behaves the same; it presses nothing the person
    // cannot see (the menu is hidden on a phone).
    const collapsedRef = useRef(collapsed);
    useLayoutEffect(() => {
        collapsedRef.current = collapsed;
    });
    useEffect(() => {
        if (!collapseKey)
            return;
        const onKey = (e) => {
            if (!isCollapseKey(e, collapseKey))
                return;
            const toggle = root.current?.querySelector("[data-cap-part='menu-toggle']");
            if (!toggle || toggle.getClientRects().length === 0)
                return;
            e.preventDefault();
            setCollapsed(!collapsedRef.current);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [collapseKey, setCollapsed]);
    const derivedTabs = props.tabs?.map((t) => t.current === undefined ? { ...t, current: nav.find((e) => e.id === t.id)?.current } : t);
    const tabs = (derivedTabs ?? nav.slice(0, 5)).slice(0, 5);
    const item = (e) => (_jsx(Fragment, { children: renderLink({
            href: e.href,
            "aria-current": e.current ? "page" : undefined,
            "aria-label": countName(e.label, e.count, e.countNote),
            children: (_jsxs(_Fragment, { children: [e.icon ?? (_jsx("span", { className: "cap-admin-letter", "aria-hidden": "true", children: e.label.slice(0, 1) })), _jsx("span", { className: "cap-admin-label", children: e.label }), _jsx(Tip, { text: e.label, offset: 12, describe: false }), " ", _jsx("span", { className: "cap-count cap-admin-count", "data-tone": e.tone, children: e.count ? badgeText(e.count) : "" })] })),
        }) }, e.id));
    // The header: the logo (the app's mark and name), the extras (Search, Inbox, then the app's
    // own), the theme, and the account menu last.
    // In the letterhead the names stack as on the public pages: the agency over the site, then the app.
    // The mark is the current app's in the strip, so an app that draws its own strip mark shows it here too.
    const stacked = props.letterhead && family?.names
        ? {
            agency: family.standalone || family.names[0] === OWNER.name ? undefined : OWNER.name,
            label: family.names[0],
            app: family.names[1],
        }
        : { label: title };
    const logo = props.logo ?? {
        href: family?.href ?? apps.find((a) => a.current)?.href ?? "/",
        ...stacked,
        mark: apps.find((a) => a.current)?.logo ?? family?.logo,
    };
    const extras = [
        ...(onSearch && !props.search
            ? [
                {
                    id: "search",
                    label: "Search everything",
                    icon: _jsx(HeaderIcon, { d: SEARCH_D }),
                    onClick: onSearch,
                    keys: searchShortcut,
                },
            ]
            : []),
        ...(inbox
            ? [
                {
                    id: "inbox",
                    label: "Inbox",
                    icon: _jsx(HeaderIcon, { d: INBOX_D }),
                    href: inbox.href,
                    onClick: inbox.onOpen,
                    count: inbox.count,
                    countNote: inbox.countNote ?? "need you",
                    keys: inbox.shortcut,
                },
            ]
            : []),
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
                ...(accountProps.appLinks?.length
                    ? [{ label: accountProps.appLabel ?? "This app", links: accountProps.appLinks }]
                    : []),
                ...(props.viewSite || onHelp
                    ? [
                        {
                            links: [
                                ...(props.viewSite ? [{ label: "View site", href: props.viewSite }] : []),
                                ...(onHelp ? [{ label: "Help and shortcuts", onClick: onHelp }] : []),
                            ],
                        },
                    ]
                    : []),
            ],
            onSignOut: accountProps.accessLogout
                ? () => location.assign(ACCESS_LOGOUT)
                : accountProps.onSignOut,
            signOutAction: accountProps.accessLogout ? undefined : accountProps.signOutAction,
            signOutFields: accountProps.signOutFields,
            signOutDisabled: accountProps.signOutDisabled,
        }
        : undefined;
    // The letterhead's second row: the levels above the page, else the current entry's group, then
    // the page, else the current entry, so the row never stands empty.
    const here = nav.find((e) => e.current);
    const heading = page ?? here?.label;
    const crumbs = [
        ...(trail?.length ? trail : here?.group ? [{ label: here.group }] : []),
        ...(heading ? [{ label: heading, current: true }] : []),
    ];
    const toSheet = (e) => ({
        id: e.id,
        label: e.label,
        href: e.href,
        current: e.current,
        icon: e.icon,
        count: e.count,
        countNote: e.countNote,
    });
    return (_jsxs("div", { ref: root, className: "cap-admin", "data-cap": "admin-shell", "data-variant": variant, "data-standalone": family?.standalone ? "" : undefined, "data-menu": collapsed ? "collapsed" : undefined, "data-transition": props.transition ? "page" : undefined, children: [_jsx(SiteHeader, { logo: logo, variant: props.letterhead ? "letterhead" : undefined, search: props.search, trail: props.letterhead ? { crumbs: crumbs, viewSite: props.viewSite } : undefined, band: props.band, translucent: props.translucent, switchers: props.switchers, extras: extras, themePrefKey: themePrefKey, themeKey: themeKey, themeCookie: themeCookie, onThemeSave: onThemeSave, themeInitial: themeInitial, themeAction: themeAction, hydrate: hydrate, account: account, skipTo: "#cap-main", renderLink: renderLink, sheetTitle: `${title} menu`, sheetStart: owner
                    ? (close) => (_jsxs(_Fragment, { children: [_jsx("div", { className: "cap-site-header-sheet-label", children: "Apps" }), _jsx("ul", { className: "cap-site-header-sheet-list", children: apps.map((a) => (_jsx("li", { children: renderLink({
                                        href: a.href,
                                        "aria-current": a.current ? "true" : undefined,
                                        "aria-label": a.current
                                            ? undefined
                                            : countName(a.label, a.count, a.countNote ?? "need you"),
                                        onClick: close,
                                        children: (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true", children: mark(a) }), _jsx("span", { className: "cap-site-header-sheet-name", children: a.label }), a.current || !a.count ? null : " ", a.current || !a.count ? null : (_jsx("span", { className: "cap-site-header-count", "aria-hidden": "true", children: badgeText(a.count) }))] })),
                                    }) }, a.id))) })] }))
                    : undefined, sheetEnd: (close) => groups(nav).map((g, i) => (_jsx(SheetGroup, { label: g.label ?? title, links: g.entries.map(toSheet), renderLink: renderLink, onClose: close }, g.label ?? `g${i}`))) }), owner ? (_jsx("nav", { className: "cap-admin-strip", "aria-label": "Apps", children: _jsx("ul", { className: "cap-admin-strip-group", children: apps.map((a, i) => (_jsx("li", { children: (a.current ? renderLink : plainLink)({
                            href: a.href,
                            className: "cap-admin-tile",
                            "aria-current": a.current ? "true" : undefined,
                            "aria-label": a.current
                                ? a.label
                                : (countName(a.label, a.count, a.countNote ?? "need you") ?? a.label),
                            children: (_jsxs(_Fragment, { children: [mark(a), a.current ? null : _jsx(Badge, { count: a.count }), _jsx(Tip, { text: a.label, keys: i < 9 && jumpKeys ? `G ${i + 1}` : undefined })] })),
                        }) }, a.id))) }) })) : null, _jsxs("nav", { className: "cap-admin-menu", id: "cap-admin-menu", "aria-label": navLabel, children: [_jsxs("button", { type: "button", className: "cap-admin-collapse", "data-cap-part": "menu-toggle", "aria-label": collapsed ? "Expand menu" : "Collapse menu", "aria-expanded": !collapsed, "aria-controls": "cap-admin-menu", onClick: () => setCollapsed(!collapsed), children: [_jsx(Icon, { d: collapsed ? EXPAND_D : COLLAPSE_D }), _jsx("span", { className: "cap-admin-label", children: collapsed ? "Expand menu" : "Collapse menu" }), collapseKey ? (_jsx("span", { className: "cap-keys", "aria-hidden": "true", children: _jsx("kbd", { children: collapseKey }) })) : null, _jsx(Tip, { text: collapsed ? "Expand menu" : "Collapse menu", keys: collapseKey || undefined, offset: 12, describe: false })] }), groups(nav).map((g, i) => g.label ? (_jsxs("div", { className: "cap-admin-group", role: "group", "aria-labelledby": `${groupId}-${i}`, children: [_jsx("div", { className: "cap-admin-group-label", id: `${groupId}-${i}`, children: g.label }), g.entries.map(item)] }, `g${i}`)) : (g.entries.map(item)))] }), _jsxs("main", { ...mainProps, className: "cap-admin-main", id: "cap-main", tabIndex: -1, children: [_jsxs("div", { className: "cap-admin-bar", children: [_jsxs("div", { className: "cap-admin-bar-text", children: [trail && trail.length > 0 && !props.letterhead ? (_jsx("nav", { className: "cap-admin-trail", "aria-label": "Breadcrumb", children: _jsxs("ol", { children: [trail.map((c) => (_jsx("li", { children: renderLink({ href: c.href, children: c.label }) }, c.href))), page ? (_jsx("li", { children: _jsx("span", { "aria-current": "page", children: page }) })) : null] }) })) : null, updated ? (_jsxs("span", { className: "cap-admin-fresh", children: ["Updated ", _jsx(Time, { at: updated.at }), updated.auto ? " · refreshes itself" : null] })) : null, status ? _jsx("div", { className: "cap-admin-bar-status", children: status }) : null] }), actions || onRefresh ? (_jsxs("div", { className: "cap-admin-actions", children: [actions, onRefresh && (_jsxs("button", { type: "button", className: "cap-admin-btn", "data-cap-part": "refresh", "aria-label": "Refresh", "aria-busy": refreshing || undefined, onClick: onRefresh, children: [_jsx(Icon, { d: REFRESH_D }), _jsx(Tip, { text: "Refresh", keys: refreshShortcut, side: "bottom", offset: 6 })] }))] })) : null] }), children] }), _jsx(SiteTabs, { tabs: tabs.map(toSheet), label: navLabel, renderLink: renderLink })] }));
}
