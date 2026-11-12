import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.js";
import { ThemeButton, ThemeForm } from "../theme-switch/theme-switch.react.js";
import { enhance as enhanceTheme, THEME_PREF } from "../theme-switch/theme-switch.js";
import { CHEV, Disclosure, GroupList, HeaderHydrates, HeaderTip, MENU_ICON, PERSON_ICON, SEARCH_ICON, SheetGroup, countName, headerItem, part, plainLink, } from "./site-header-parts.react.js";
import { badgeText, guardForms, wireScrolled, wireSearch, wireThemeKey } from "./site-header.js";
export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.js";
export { initialsOf } from "./site-header.js";
export function SiteHeader(props) {
    const { logo, switchers = [], sections = [], links = "left", extras = [], theme = true, themePrefKey = THEME_PREF, themeKey, themeCookie, onThemeSave, themeInitial, themeAction, hydrate = true, navLabel = "Main", sheetLinksLabel, account, signIn, band, translucent, rest, sticky = true, skipTo, renderLink = plainLink, variant, search, trail, attributes, toolsEnd, end, collapse, sheetIcons, menuIcon = MENU_ICON, } = props;
    const letterhead = variant === "letterhead";
    const id = useId();
    const headerRef = useRef(null);
    const menuButton = useRef(null);
    const sheetTitle = useRef(null);
    // A picture that fails to load gives way to the initials under it.
    const [failedAvatar, setFailedAvatar] = useState();
    const [sheetOpen, setSheetOpen] = useState(false);
    const closeSheet = useCallback(() => setSheetOpen(false), []);
    // A form in a panel or the sheet sends once (guardForms); Back and Forward close the sheet.
    useEffect(() => {
        if (!hydrate || !headerRef.current)
            return;
        const back = () => setSheetOpen(false);
        window.addEventListener("popstate", back);
        const unguard = guardForms(headerRef.current);
        const unscroll = wireScrolled(headerRef.current);
        return () => {
            window.removeEventListener("popstate", back);
            unguard();
            unscroll();
        };
    }, [hydrate]);
    // The theme key, where the site binds single keys: not while a person types. It presses the
    // header's theme control, so the key keeps the choice exactly as the control does.
    useEffect(() => {
        if (!hydrate || !theme || !themeKey || !headerRef.current)
            return;
        return wireThemeKey(headerRef.current, themeKey);
    }, [hydrate, theme, themeKey]);
    // The no-script theme form is plain markup; with React running, the behavior wires it here.
    const saveRef = useRef(onThemeSave);
    useEffect(() => {
        saveRef.current = onThemeSave;
    });
    useEffect(() => {
        if (!hydrate || !theme || !themeAction || !headerRef.current)
            return;
        return enhanceTheme(headerRef.current, {
            onSave: (c) => saveRef.current?.(c),
        });
    }, [hydrate, theme, themeAction]);
    // Search: the icon opens the field; where the site answers queries, its matches show as one types.
    const searchBox = useRef(null);
    const suggest = search?.suggest;
    useEffect(() => {
        if (!hydrate || !searchBox.current)
            return;
        return wireSearch(searchBox.current, suggest);
    }, [hydrate, suggest]);
    // In the letterhead an app's own search (an extra with id "search", say a command menu) takes the
    // search slot before the theme, where a site's search form sits, so it never moves between them.
    const ownSearch = letterhead && !search
        ? extras.find((e) => e.id === "search" && e.kind !== "button")
        : undefined;
    const icons = extras.filter((e) => e.kind !== "button" && e !== ownSearch).slice(0, 2);
    const cta = extras.find((e) => e.kind === "button");
    // The site's own class on its button extra (bsw's glass Get a Quote), in the bar and the sheet.
    const ctaClass = cta?.className ? `cap-site-header-cta ${cta.className}` : "cap-site-header-cta";
    const signOutLabel = account ? `Sign out (${account.name})` : "Sign out";
    // Sign out as a row: a link, a form post (no script needed), or a button.
    const signOut = account
        ? account.signOutHref
            ? { label: "Sign out", href: account.signOutHref }
            : account.signOutAction
                ? { label: "Sign out", action: account.signOutAction, fields: account.signOutFields }
                : account.onSignOut
                    ? { label: "Sign out", onClick: account.onSignOut }
                    : undefined
        : undefined;
    const extra = (e) => {
        const name = countName(e.label, e.count, e.countNote);
        const inner = (_jsxs(_Fragment, { children: [e.icon, e.count ? (_jsx("span", { className: "cap-count cap-site-header-badge", "data-tone": "need", "aria-hidden": "true", children: badgeText(e.count) })) : null, _jsx(HeaderTip, { text: e.label, keys: e.keys })] }));
        return e.href ? (_jsx(Fragment, { children: renderLink({
                href: e.href,
                className: e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon",
                "aria-label": name,
                children: inner,
            }) }, e.id)) : (_jsx("button", { type: "button", className: e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon", "aria-label": name, onClick: e.onClick, children: inner }, e.id));
    };
    // The letterhead's second row already shows View site wherever the account button is in the bar
    // (from 768px; on a phone the account is in the sheet, which keeps the row), so the menu leaves
    // it out rather than offering it twice.
    const shownView = letterhead && trail?.viewSite ? trail.viewSite : undefined;
    const panelGroups = (account?.groups ?? [])
        .map((g) => ({
        ...g,
        links: shownView ? g.links.filter((l) => l.href !== shownView) : g.links,
    }))
        .filter((g) => g.links.length > 0);
    const accountPanel = account
        ? (account.panel ?? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-site-header-who", children: [_jsx("strong", { children: account.name }), account.detail ? _jsx("small", { children: account.detail }) : null] }), panelGroups.map((g, i) => (_jsxs(Fragment, { children: [_jsx("hr", {}), g.label ? _jsx("div", { className: "cap-site-header-panel-label", children: g.label }) : null, _jsx("ul", { className: "cap-site-header-panel-list", children: g.links.map((l) => (_jsx("li", { children: headerItem(l, l.label, renderLink) }, l.label))) })] }, g.label ?? i))), signOut ? (_jsxs(_Fragment, { children: [_jsx("hr", {}), _jsx("ul", { className: "cap-site-header-panel-list", children: _jsx("li", { children: headerItem(signOut, "Sign out", plainLink, {
                                    disabled: account.signOutDisabled,
                                }) }) })] })) : null] })))
        : null;
    const sectionLinks = sections
        .filter((s) => !s.groups && !s.panel && s.href)
        .map((s) => ({ id: s.id, label: s.label, href: s.href, current: s.current }));
    const sheetName = props.sheetTitle ?? `${logo.label} menu`;
    const linksLabel = sheetLinksLabel === undefined
        ? sections.some((s) => s.groups)
            ? "More"
            : "Pages"
        : (sheetLinksLabel ?? undefined);
    return (_jsx(HeaderHydrates.Provider, { value: hydrate, children: _jsxs("header", { ...attributes, ref: headerRef, className: "cap-site-header", "data-cap": "site-header", "data-cap-ready": hydrate ? "" : undefined, "data-cap-theme-key": !hydrate && theme && themeKey ? themeKey : undefined, "data-variant": variant, "data-links": links, "data-collapse": collapse, "data-sheet-icons": sheetIcons, "data-band": band, "data-translucent": translucent ? "" : undefined, "data-rest": rest, "data-sticky": sticky ? undefined : "false", children: [rest === "clear" ? _jsx("span", { className: "cap-site-header-ground", "aria-hidden": "true" }) : null, skipTo ? (_jsx("a", { className: "cap-site-header-skip", href: skipTo, children: "Skip to content" })) : null, renderLink({
                    href: logo.href,
                    className: logo.className
                        ? `cap-site-header-logo ${logo.className}`
                        : "cap-site-header-logo",
                    "aria-label": logo.name ??
                        (letterhead
                            ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ")
                            : logo.label),
                    children: (_jsxs(_Fragment, { children: [logo.mark, letterhead ? (_jsxs("span", { className: "cap-site-header-names", "aria-hidden": "true", children: [logo.agency ? (_jsx("span", { className: "cap-site-header-agency", children: logo.agency })) : null, logo.agency ? " " : null, _jsxs("span", { className: "cap-site-header-name", children: [logo.label, logo.app ? _jsxs("span", { className: "cap-site-header-app", children: [" ", logo.app] }) : null] })] })) : ((logo.wordmark ?? _jsx("span", { "aria-hidden": "true", children: logo.label })))] })),
                }), switchers.length > 0 ? (_jsx("div", { className: "cap-site-header-switcher", children: switchers.map((s, i) => (_jsxs(Fragment, { children: [i > 0 ? (_jsx("span", { className: "cap-site-header-sep", "aria-hidden": "true", children: "/" })) : null, _jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-switch", name: s.name, label: s.sheetLabel ?? s.name ?? s.label, size: s.panelSize, panelClassName: s.panelClassName, button: _jsxs(_Fragment, { children: [s.tile ? (_jsx("span", { className: "cap-site-header-switch-tile", "data-tile": s.tile, "aria-hidden": "true" })) : (s.mark), _jsx("span", { children: s.label }), CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups, renderLink: renderLink }) })] }, s.id))) })) : null, sections.length > 0 ? (_jsx("nav", { className: "cap-site-header-sections", "aria-label": navLabel, children: _jsx("ul", { children: sections.map((s) => (_jsx("li", { children: s.groups || s.panel ? (_jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-link", current: s.current, label: s.label, size: s.panelSize, panelClassName: s.panelClassName, button: _jsxs(_Fragment, { children: [s.label, CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups ?? [], renderLink: renderLink }) })) : (renderLink({
                                href: s.href ?? "#",
                                className: "cap-site-header-link",
                                "aria-current": s.current ? "page" : undefined,
                                children: s.label,
                            })) }, s.id))) }) })) : null, _jsxs("div", { className: "cap-site-header-tools", children: [ownSearch ? extra(ownSearch) : null, icons.length > 0 || cta ? (_jsxs("div", { className: "cap-site-header-extras", "data-phone": cta?.phone, children: [icons.map(extra), cta ? (cta.href ? (renderLink({
                                    href: cta.href,
                                    className: ctaClass,
                                    children: cta.label,
                                })) : (_jsx("button", { type: "button", className: ctaClass, onClick: cta.onClick, children: cta.label }))) : null] })) : null, search ? (_jsxs("div", { ref: searchBox, className: "cap-site-header-search", "data-cap-part": "search", children: [_jsxs("a", { className: "cap-site-header-icon cap-site-header-search-button", href: search.action, "aria-label": search.label, "data-cap-part": "search-trigger", children: [SEARCH_ICON, _jsx(HeaderTip, { text: search.label, keys: "/" })] }), _jsx("div", { className: "cap-site-header-search-panel", "data-align": "end", children: _jsxs("form", { role: "search", "aria-label": search.label, action: search.action, method: "get", children: [SEARCH_ICON, _jsx("input", { type: "search", name: search.name ?? "q", placeholder: search.label, "aria-label": search.label, autoComplete: "off", enterKeyHint: "search" })] }) })] })) : null, theme ? (themeAction ? (_jsx(ThemeForm, { action: themeAction, cookie: themeCookie, prefKey: themePrefKey, shortcut: themeKey, className: "cap-site-header-icon cap-site-header-theme" })) : (_jsx(ThemeButton, { prefKey: themePrefKey, shortcut: themeKey, className: "cap-site-header-icon cap-site-header-theme", cookie: themeCookie, onSave: onThemeSave, initial: themeInitial, hydrate: hydrate }))) : null, _jsx(AccountSlot, { show: Boolean(account || signIn), children: account ? (_jsx(Disclosure, { id: `${id}-account`, className: "cap-site-header-icon cap-site-header-avatar", name: "Your account", label: "Your account", align: "end", button: _jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-initials", "data-initials": account.initials, "aria-hidden": "true", children: account.avatar && account.avatar !== failedAvatar ? (_jsx("img", { className: "cap-site-header-avatar-image", src: account.avatar, alt: "", onError: () => setFailedAvatar(account.avatar) })) : null }), _jsx(HeaderTip, { text: account.name })] }), children: accountPanel })) : signIn ? (renderLink({
                                href: signIn.href,
                                className: "cap-site-header-signin",
                                children: (_jsxs(_Fragment, { children: [PERSON_ICON, _jsx("span", { className: "cap-site-header-signin-text", children: signIn.label ?? "Sign in" })] })),
                            })) : null }), toolsEnd, _jsx("button", { ref: menuButton, type: "button", className: "cap-site-header-icon cap-site-header-menu", "aria-label": "Menu", "aria-haspopup": "dialog", "aria-expanded": sheetOpen, "aria-controls": `${id}-sheet`, ...(hydrate ? {} : { commandfor: `${id}-sheet`, command: "show-modal" }), onClick: () => setSheetOpen(true), children: menuIcon })] }), letterhead && trail ? (_jsxs("div", { className: "cap-site-header-trail", children: [_jsx("nav", { "aria-label": "You are here", children: _jsx("ol", { children: trail.crumbs.map((c) => (_jsx("li", { children: c.href && !c.current ? (renderLink({ href: c.href, children: c.label })) : (_jsx("span", { "aria-current": c.current ? "page" : undefined, children: c.label })) }, c.label))) }) }), trail.viewSite
                            ? renderLink({
                                href: trail.viewSite,
                                className: "cap-site-header-view",
                                children: "View site",
                            })
                            : null] })) : null, _jsxs(Dialog, { open: sheetOpen, onOpenChange: (o) => !o && closeSheet(), placement: "bottom", id: `${id}-sheet`, className: "cap-site-header-sheet", "aria-labelledby": `${id}-sheet-title`, initialFocus: sheetTitle, children: [_jsx(DialogHeader, { children: _jsx("h2", { id: `${id}-sheet-title`, className: "cap-dialog-title cap-site-header-sheet-title", ref: sheetTitle, tabIndex: -1, children: sheetName }) }), _jsx(DialogBody, { children: _jsxs("nav", { "aria-labelledby": `${id}-sheet-title`, children: [part(props.sheetStart, closeSheet), switchers.map((s) => s.groups.map((g, i) => (_jsx(SheetGroup, { label: g.label ?? s.sheetLabel ?? s.label, links: g.links, renderLink: renderLink, onClose: closeSheet }, `${s.id}-${i}`)))), sections
                                        .filter((s) => s.groups)
                                        .map((s) => (_jsx(SheetGroup, { label: s.label, links: (s.groups ?? []).flatMap((g) => g.links), renderLink: renderLink, onClose: closeSheet }, s.id))), sectionLinks.length > 0 ? (_jsx(SheetGroup, { label: linksLabel, links: sectionLinks, renderLink: renderLink, onClose: closeSheet })) : null, part(props.sheetEnd, closeSheet), cta?.href && cta.phone !== "bar"
                                        ? renderLink({
                                            href: cta.href,
                                            className: cta.className
                                                ? `cap-site-header-sheet-cta ${cta.className}`
                                                : "cap-site-header-sheet-cta",
                                            onClick: closeSheet,
                                            children: cta.label,
                                        })
                                        : null] }) }), account || signIn ? (_jsx("nav", { className: "cap-site-header-sheet-account", "aria-label": "Account", children: _jsxs("ul", { className: "cap-site-header-sheet-list", children: [account?.groups
                                        ?.flatMap((g) => g.links)
                                        .map((l) => (_jsx("li", { children: headerItem(l, _jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: l.label })] }), renderLink, { onClose: closeSheet }) }, l.label))), account && signOut ? (_jsx("li", { children: headerItem(signOut, _jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: signOutLabel })] }), plainLink, { onClose: closeSheet, disabled: account.signOutDisabled }) })) : null, !account && signIn ? (_jsx("li", { children: renderLink({
                                            href: signIn.href,
                                            onClick: closeSheet,
                                            children: (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-sheet-icon", "aria-hidden": "true" }), _jsx("span", { className: "cap-site-header-sheet-name", children: signIn.label ?? "Sign in" })] })),
                                        }) })) : null] }) })) : null] }), end] }) }));
}
// The account slot, last in the tools. A page with no sign-in at all (a personal site) renders none.
function AccountSlot({ show, children }) {
    return show ? _jsx("div", { className: "cap-site-header-account", children: children }) : null;
}
// The bottom bar of a signed-in area on a phone: up to five of its top pages, no More (the menu
// button opens the full list). Shown under 768px only. Put it last in the page, so it sticks to the
// window's bottom edge.
export function SiteTabs({ tabs, label = "Sections", renderLink = plainLink, }) {
    return (_jsx("nav", { className: "cap-site-tabs", "aria-label": label, children: tabs.slice(0, 5).map((t) => (_jsx(Fragment, { children: renderLink({
                href: t.href,
                "aria-current": t.current ? "page" : undefined,
                "aria-label": t.count ? countName(t.label, t.count, t.countNote) : undefined,
                children: (_jsxs(_Fragment, { children: [t.icon, t.label, t.count ? " " : null, t.count ? (_jsx("span", { className: "cap-count cap-site-header-badge", "data-tone": "need", "aria-hidden": "true", children: badgeText(t.count) })) : null] })),
            }) }, t.id ?? t.href))) }));
}
