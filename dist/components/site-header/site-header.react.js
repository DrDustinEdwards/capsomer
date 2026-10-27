import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.js";
import { ThemeButton } from "../theme-switch/theme-switch.react.js";
import { THEME_PREF, toggleTheme } from "../theme-switch/theme-switch.js";
import { CHEV, Disclosure, GroupList, HeaderTip, MENU_ICON, PERSON_ICON, SEARCH_ICON, SheetGroup, countName, part, plainLink } from "./site-header-parts.react.js";
import { badgeText } from "./site-header.js";
export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.js";
export function SiteHeader(props) {
    const { logo, switchers = [], sections = [], links = "left", extras = [], theme = true, themePrefKey = THEME_PREF, themeKey, account, signIn, band, translucent, sticky = true, skipTo, renderLink = plainLink, variant, search, trail } = props;
    const letterhead = variant === "letterhead";
    const id = useId();
    const menuButton = useRef(null);
    const sheetTitle = useRef(null);
    // A picture that fails to load gives way to the initials under it.
    const [failedAvatar, setFailedAvatar] = useState();
    const [sheetOpen, setSheetOpen] = useState(false);
    const closeSheet = useCallback(() => setSheetOpen(false), []);
    // The theme key, where the site binds single keys: not while a person types.
    useEffect(() => {
        if (!theme || !themeKey)
            return;
        const want = themeKey.toLowerCase();
        const onKey = (e) => {
            if (e.key.toLowerCase() !== want || e.ctrlKey || e.metaKey || e.altKey)
                return;
            if (e.target?.closest?.("input, textarea, select, [contenteditable='true']"))
                return;
            toggleTheme(themePrefKey);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [theme, themeKey, themePrefKey]);
    const icons = extras.filter((e) => e.kind !== "button").slice(0, 2);
    const cta = extras.find((e) => e.kind === "button");
    const signOutLabel = account ? `Sign out (${account.name})` : "Sign out";
    const extra = (e) => {
        const name = countName(e.label, e.count, e.countNote);
        const inner = (_jsxs(_Fragment, { children: [e.icon, e.count ? (_jsx("span", { className: "cap-site-header-badge", "aria-hidden": "true", children: badgeText(e.count) })) : null, _jsx(HeaderTip, { text: e.label, keys: e.keys })] }));
        return e.href ? (_jsx(Fragment, { children: renderLink({ href: e.href, className: "cap-site-header-icon", "aria-label": name, children: inner }) }, e.id)) : (_jsx("button", { type: "button", className: "cap-site-header-icon", "aria-label": name, onClick: e.onClick, children: inner }, e.id));
    };
    const accountPanel = account ? ((account.panel ?? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-site-header-who", children: [_jsx("strong", { children: account.name }), account.detail ? _jsx("small", { children: account.detail }) : null] }), account.groups?.map((g, i) => (_jsxs(Fragment, { children: [_jsx("hr", {}), g.label ? _jsx("div", { className: "cap-site-header-panel-label", children: g.label }) : null, _jsx("ul", { className: "cap-site-header-panel-list", children: g.links.map((l) => (_jsx("li", { children: l.href ? (renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, children: l.label })) : (_jsx("button", { type: "button", "data-panel-close": "", onClick: l.onClick, children: l.label })) }, l.label))) })] }, g.label ?? i))), account.onSignOut || account.signOutHref ? (_jsxs(_Fragment, { children: [_jsx("hr", {}), _jsx("ul", { className: "cap-site-header-panel-list", children: _jsx("li", { children: account.signOutHref ? (_jsx("a", { href: account.signOutHref, children: "Sign out" })) : (_jsx("button", { type: "button", "data-panel-close": "", disabled: account.signOutDisabled, onClick: account.onSignOut, children: "Sign out" })) }) })] })) : null] })))) : null;
    const sectionLinks = sections.filter((s) => !s.groups && !s.panel && s.href).map((s) => ({ id: s.id, label: s.label, href: s.href, current: s.current }));
    const sheetName = props.sheetTitle ?? `${logo.label} menu`;
    return (_jsxs("header", { className: "cap-site-header", "data-cap": "site-header", "data-cap-ready": "", "data-variant": variant, "data-links": links, "data-band": band, "data-translucent": translucent ? "" : undefined, "data-sticky": sticky ? undefined : "false", children: [skipTo ? (_jsx("a", { className: "cap-site-header-skip", href: skipTo, children: "Skip to content" })) : null, renderLink({
                href: logo.href,
                className: "cap-site-header-logo",
                "aria-label": letterhead ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ") : logo.label,
                children: (_jsxs(_Fragment, { children: [logo.mark, letterhead ? (_jsxs("span", { className: "cap-site-header-names", "aria-hidden": "true", children: [logo.agency ? _jsx("span", { className: "cap-site-header-agency", children: logo.agency }) : null, logo.agency ? " " : null, _jsxs("span", { className: "cap-site-header-name", children: [logo.label, logo.app ? _jsxs("span", { className: "cap-site-header-app", children: [" ", logo.app] }) : null] })] })) : ((logo.wordmark ?? _jsx("span", { "aria-hidden": "true", children: logo.label })))] })),
            }), switchers.length > 0 ? (_jsx("div", { className: "cap-site-header-switcher", children: switchers.map((s, i) => (_jsxs(Fragment, { children: [i > 0 ? (_jsx("span", { className: "cap-site-header-sep", "aria-hidden": "true", children: "/" })) : null, _jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-switch", name: s.name, label: s.sheetLabel ?? s.name ?? s.label, button: _jsxs(_Fragment, { children: [s.tile ? (_jsx("span", { className: "cap-site-header-switch-tile", "data-tile": s.tile, "aria-hidden": "true" })) : (s.mark), _jsx("span", { children: s.label }), CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups, renderLink: renderLink }) })] }, s.id))) })) : null, sections.length > 0 ? (_jsx("nav", { className: "cap-site-header-sections", "aria-label": "Site", children: _jsx("ul", { children: sections.map((s) => (_jsx("li", { children: s.groups || s.panel ? (_jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-link", current: s.current, label: s.label, button: _jsxs(_Fragment, { children: [s.label, CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups ?? [], renderLink: renderLink }) })) : (renderLink({ href: s.href ?? "#", className: "cap-site-header-link", "aria-current": s.current ? "page" : undefined, children: s.label })) }, s.id))) }) })) : null, _jsxs("div", { className: "cap-site-header-tools", children: [icons.length > 0 || cta ? (_jsxs("div", { className: "cap-site-header-extras", children: [icons.map(extra), cta ? (cta.href ? (renderLink({ href: cta.href, className: "cap-site-header-cta", children: cta.label })) : (_jsx("button", { type: "button", className: "cap-site-header-cta", onClick: cta.onClick, children: cta.label }))) : null] })) : null, search ? (_jsxs("form", { className: "cap-site-header-search", role: "search", "aria-label": "Site", action: search.action, children: [_jsx("button", { type: "submit", "aria-label": search.label, children: SEARCH_ICON }), _jsx("input", { type: "search", name: search.name ?? "q", placeholder: search.label, "aria-label": search.label, autoComplete: "off" })] })) : null, theme ? _jsx(ThemeButton, { prefKey: themePrefKey, shortcut: themeKey, className: "cap-site-header-icon cap-site-header-theme" }) : null, _jsx("div", { className: "cap-site-header-account", children: account ? (_jsx(Disclosure, { id: `${id}-account`, className: "cap-site-header-icon cap-site-header-avatar", name: "Your account", label: "Your account", align: "end", button: _jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-initials", "data-initials": account.initials, "aria-hidden": "true", children: account.avatar && account.avatar !== failedAvatar ? _jsx("img", { className: "cap-site-header-avatar-image", src: account.avatar, alt: "", onError: () => setFailedAvatar(account.avatar) }) : null }), _jsx(HeaderTip, { text: account.name })] }), children: accountPanel })) : signIn ? (renderLink({
                            href: signIn.href,
                            className: "cap-site-header-signin",
                            children: (_jsxs(_Fragment, { children: [PERSON_ICON, _jsx("span", { className: "cap-site-header-signin-text", children: signIn.label ?? "Sign in" })] })),
                        })) : null }), _jsx("button", { ref: menuButton, type: "button", className: "cap-site-header-icon cap-site-header-menu", "aria-label": "Menu", "aria-haspopup": "dialog", "aria-expanded": sheetOpen, "aria-controls": `${id}-sheet`, onClick: () => setSheetOpen(true), children: MENU_ICON })] }), letterhead && trail ? (_jsxs("div", { className: "cap-site-header-trail", children: [_jsx("nav", { "aria-label": "You are here", children: _jsx("ol", { children: trail.crumbs.map((c) => (_jsx("li", { children: c.href && !c.current ? renderLink({ href: c.href, children: c.label }) : _jsx("span", { "aria-current": c.current ? "page" : undefined, children: c.label }) }, c.label))) }) }), trail.viewSite ? renderLink({ href: trail.viewSite, className: "cap-site-header-view", children: "View site" }) : null] })) : null, _jsxs(Dialog, { open: sheetOpen, onOpenChange: (o) => !o && closeSheet(), placement: "bottom", id: `${id}-sheet`, className: "cap-site-header-sheet", "aria-labelledby": `${id}-sheet-title`, initialFocus: sheetTitle, children: [_jsx(DialogHeader, { children: _jsx("h2", { id: `${id}-sheet-title`, className: "cap-dialog-title cap-site-header-sheet-title", ref: sheetTitle, tabIndex: -1, children: sheetName }) }), _jsx(DialogBody, { children: _jsxs("nav", { "aria-labelledby": `${id}-sheet-title`, children: [part(props.sheetStart, closeSheet), switchers.map((s) => s.groups.map((g, i) => _jsx(SheetGroup, { label: g.label ?? s.sheetLabel ?? s.label, links: g.links, renderLink: renderLink, onClose: closeSheet }, `${s.id}-${i}`))), sections
                                    .filter((s) => s.groups)
                                    .map((s) => (_jsx(SheetGroup, { label: s.label, links: (s.groups ?? []).flatMap((g) => g.links), renderLink: renderLink, onClose: closeSheet }, s.id))), sectionLinks.length > 0 ? _jsx(SheetGroup, { label: sections.some((s) => s.groups) ? "More" : "Pages", links: sectionLinks, renderLink: renderLink, onClose: closeSheet }) : null, part(props.sheetEnd, closeSheet), cta?.href ? renderLink({ href: cta.href, className: "cap-site-header-sheet-cta", onClick: closeSheet, children: cta.label }) : null] }) }), account || signIn ? (_jsx("nav", { className: "cap-site-header-sheet-account", "aria-label": "Account", children: _jsxs("ul", { className: "cap-site-header-sheet-list", children: [account?.groups
                                    ?.flatMap((g) => g.links)
                                    .map((l) => {
                                    const inner = (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: l.label })] }));
                                    return (_jsx("li", { children: l.href ? (renderLink({ href: l.href, "aria-current": l.current ? "page" : undefined, onClick: closeSheet, children: inner })) : (_jsx("button", { type: "button", onClick: () => (closeSheet(), l.onClick?.()), children: inner })) }, l.label));
                                }), account && (account.onSignOut || account.signOutHref) ? (_jsx("li", { children: account.signOutHref ? (_jsxs("a", { href: account.signOutHref, children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: signOutLabel })] })) : (_jsxs("button", { type: "button", disabled: account.signOutDisabled, onClick: () => (closeSheet(), account.onSignOut?.()), children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: signOutLabel })] })) })) : null, !account && signIn ? (_jsx("li", { children: renderLink({
                                        href: signIn.href,
                                        onClick: closeSheet,
                                        children: (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: signIn.label ?? "Sign in" })] })),
                                    }) })) : null] }) })) : null] })] }));
}
// The bottom bar of a signed-in area on a phone: up to five of its top pages, no More (the menu
// button opens the full list). Shown under 768px only. Put it last in the page, so it sticks to the
// window's bottom edge.
export function SiteTabs({ tabs, label = "Sections", renderLink = plainLink }) {
    return (_jsx("nav", { className: "cap-site-tabs", "aria-label": label, children: tabs.slice(0, 5).map((t) => (_jsx(Fragment, { children: renderLink({
                href: t.href,
                "aria-current": t.current ? "page" : undefined,
                "aria-label": t.count ? countName(t.label, t.count, t.countNote) : undefined,
                children: (_jsxs(_Fragment, { children: [t.icon, t.label, t.count ? " " : null, t.count ? (_jsx("span", { className: "cap-site-header-badge", "aria-hidden": "true", children: badgeText(t.count) })) : null] })),
            }) }, t.id ?? t.href))) }));
}
