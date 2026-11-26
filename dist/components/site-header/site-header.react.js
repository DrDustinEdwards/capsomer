import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { ThemeButton, ThemeForm } from "../theme-switch/theme-switch.react.js";
import { enhance as enhanceTheme, THEME_PREF } from "../theme-switch/theme-switch.js";
import { CHEV, Disclosure, GroupList, HeaderHydrates, HeaderTip, MENU_ICON, PERSON_ICON, SEARCH_ICON, countName, } from "./site-header-parts.react.js";
import { badgeText, guardForms, wireScrolled, wireSearchOnDemand, wireThemeKey, } from "./site-header.js";
import { plainLink } from "../hooks/hooks.react.js";
import { HeaderSheet } from "./site-header-sheet.react.js";
import { accountPanelOf, renderExtra, renderLogo, renderTrail, signOutRow, } from "./site-header-slots.react.js";
export { countName, HeaderTip, SheetGroup } from "./site-header-parts.react.js";
export function SiteHeader(props) {
    const { logo, switchers = [], sections = [], links = "left", extras = [], theme = true, themePrefKey = THEME_PREF, themeKey, themeCookie, onThemeSave, themeInitial, themeAction, hydrate = true, navLabel = "Main", sheetLinksLabel, account, signIn, band, translucent, rest, sticky = true, skipTo, renderLink = plainLink, variant, search, trail, attributes, toolsEnd, end, collapse, sheetIcons, menuIcon = MENU_ICON, } = props;
    const letterhead = variant === "letterhead";
    const id = useId();
    const headerRef = useRef(null);
    const menuButton = useRef(null);
    const sheetTitle = useRef(null);
    const [failedAvatar, setFailedAvatar] = useState();
    const [sheetOpen, setSheetOpen] = useState(false);
    const closeSheet = useCallback(() => setSheetOpen(false), []);
    // Forms send once; Back and Forward close the sheet.
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
    useEffect(() => {
        if (!hydrate || !theme || !themeKey || !headerRef.current)
            return;
        return wireThemeKey(headerRef.current, themeKey);
    }, [hydrate, theme, themeKey]);
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
    const searchBox = useRef(null);
    const suggest = search?.suggest;
    useEffect(() => {
        if (!hydrate || !searchBox.current)
            return;
        return wireSearchOnDemand(searchBox.current, suggest);
    }, [hydrate, suggest]);
    // In the letterhead an app's own search extra (id "search") takes the search slot, so it never moves.
    const ownSearch = letterhead && !search
        ? extras.find((e) => e.id === "search" && e.kind !== "button")
        : undefined;
    const icons = extras.filter((e) => e.kind !== "button" && e !== ownSearch).slice(0, 2);
    const cta = extras.find((e) => e.kind === "button");
    const ctaClass = cta?.className ? `cap-site-header-cta ${cta.className}` : "cap-site-header-cta";
    const signOutLabel = account ? `Sign out (${account.name})` : "Sign out";
    const signOut = account ? signOutRow(account) : undefined;
    // The letterhead's second row already shows View site beside the account button, so the menu omits it.
    const shownView = letterhead && trail?.viewSite ? trail.viewSite : undefined;
    const panelGroups = (account?.groups ?? [])
        .map((g) => ({
        ...g,
        links: shownView ? g.links.filter((l) => l.href !== shownView) : g.links,
    }))
        .filter((g) => g.links.length > 0);
    const accountPanel = account ? accountPanelOf(account, panelGroups, signOut, renderLink) : null;
    const sectionLinks = sections
        .filter((s) => !s.groups && !s.panel && s.href)
        .map((s) => ({ id: s.id, label: s.label, href: s.href, current: s.current }));
    // A letterhead with section links keeps them in its own row at every width, so it has no sheet.
    const sheet = !(letterhead && sections.length > 0);
    const sheetName = props.sheetTitle ?? `${logo.label} menu`;
    const linksLabel = sheetLinksLabel === undefined
        ? sections.some((s) => s.groups)
            ? "More"
            : "Pages"
        : (sheetLinksLabel ?? undefined);
    return (_jsx(HeaderHydrates.Provider, { value: hydrate, children: _jsxs("header", { ...attributes, ref: headerRef, className: "cap-site-header", "data-cap": "site-header", "data-cap-ready": hydrate ? "" : undefined, "data-cap-theme-key": !hydrate && theme && themeKey ? themeKey : undefined, "data-variant": variant, "data-links": links, "data-collapse": collapse, "data-sheet-icons": sheetIcons, "data-band": band, "data-translucent": translucent ? "" : undefined, "data-rest": rest, "data-sticky": sticky ? undefined : "false", children: [rest === "clear" ? _jsx("span", { className: "cap-site-header-ground", "aria-hidden": "true" }) : null, skipTo ? (_jsx("a", { className: "cap-site-header-skip", href: skipTo, children: "Skip to content" })) : null, renderLogo(logo, letterhead, renderLink), switchers.length > 0 ? (_jsx("div", { className: "cap-site-header-switcher", children: switchers.map((s, i) => (_jsxs(Fragment, { children: [i > 0 ? (_jsx("span", { className: "cap-site-header-sep", "aria-hidden": "true", children: "/" })) : null, _jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-switch", name: s.name, label: s.sheetLabel ?? s.name ?? s.label, size: s.panelSize, panelClassName: s.panelClassName, button: _jsxs(_Fragment, { children: [s.tile ? (_jsx("span", { className: "cap-site-header-switch-tile", "data-tile": s.tile, "aria-hidden": "true" })) : (s.mark), _jsx("span", { children: s.label }), CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups, renderLink: renderLink }) })] }, s.id))) })) : null, sections.length > 0 ? (_jsx("nav", { className: "cap-site-header-sections", "aria-label": navLabel, children: _jsx("ul", { children: sections.map((s) => (_jsx("li", { children: s.groups || s.panel ? (_jsx(Disclosure, { id: `${id}-${s.id}`, className: "cap-site-header-link", current: s.current, label: s.label, size: s.panelSize, panelClassName: s.panelClassName, button: _jsxs(_Fragment, { children: [s.label, CHEV] }), children: s.panel ?? _jsx(GroupList, { groups: s.groups ?? [], renderLink: renderLink }) })) : (renderLink({
                                href: s.href ?? "#",
                                className: "cap-site-header-link",
                                "aria-current": s.current ? "page" : undefined,
                                children: s.label,
                            })) }, s.id))) }) })) : null, _jsxs("div", { className: "cap-site-header-tools", children: [ownSearch ? renderExtra(ownSearch, renderLink) : null, icons.length > 0 || cta ? (_jsxs("div", { className: "cap-site-header-extras", "data-phone": cta?.phone, children: [icons.map((e) => renderExtra(e, renderLink)), cta ? (cta.href ? (renderLink({
                                    href: cta.href,
                                    className: ctaClass,
                                    children: cta.label,
                                })) : (_jsx("button", { type: "button", className: ctaClass, onClick: cta.onClick, children: cta.label }))) : null] })) : null, search ? (_jsxs("div", { ref: searchBox, className: "cap-site-header-search", "data-cap-part": "search", children: [_jsxs("a", { className: "cap-site-header-icon cap-site-header-search-button", href: search.action, "aria-label": search.label, "data-cap-part": "search-trigger", children: [SEARCH_ICON, _jsx(HeaderTip, { text: search.label, keys: "/" })] }), _jsx("div", { className: "cap-site-header-search-panel", "data-align": "end", children: _jsxs("form", { role: "search", "aria-label": search.label, action: search.action, method: "get", children: [SEARCH_ICON, _jsx("input", { type: "search", name: search.name ?? "q", placeholder: search.label, "aria-label": search.label, autoComplete: "off", enterKeyHint: "search" })] }) })] })) : null, theme ? (themeAction ? (_jsx(ThemeForm, { action: themeAction, cookie: themeCookie, prefKey: themePrefKey, shortcut: themeKey, className: "cap-site-header-icon cap-site-header-theme" })) : (_jsx(ThemeButton, { prefKey: themePrefKey, shortcut: themeKey, className: "cap-site-header-icon cap-site-header-theme", cookie: themeCookie, onSave: onThemeSave, initial: themeInitial, hydrate: hydrate }))) : null, _jsx(AccountSlot, { show: Boolean(account || signIn), children: account ? (_jsx(Disclosure, { id: `${id}-account`, className: "cap-site-header-icon cap-site-header-avatar", name: "Your account", label: "Your account", align: "end", button: _jsxs(_Fragment, { children: [_jsx("span", { className: "cap-site-header-initials", "data-initials": account.initials, "aria-hidden": "true", children: account.avatar && account.avatar !== failedAvatar ? (_jsx("img", { className: "cap-site-header-avatar-image", src: account.avatar, alt: "", onError: () => setFailedAvatar(account.avatar) })) : null }), _jsx(HeaderTip, { text: account.name })] }), children: accountPanel })) : signIn ? (renderLink({
                                href: signIn.href,
                                className: "cap-site-header-signin",
                                children: (_jsxs(_Fragment, { children: [PERSON_ICON, _jsx("span", { className: "cap-site-header-signin-text", children: signIn.label ?? "Sign in" })] })),
                            })) : null }), toolsEnd, sheet ? (_jsx("button", { ref: menuButton, type: "button", className: "cap-site-header-icon cap-site-header-menu", "aria-label": "Menu", "aria-haspopup": "dialog", "aria-expanded": sheetOpen, "aria-controls": `${id}-sheet`, ...(hydrate ? {} : { commandfor: `${id}-sheet`, command: "show-modal" }), onClick: () => setSheetOpen(true), children: menuIcon })) : null] }), letterhead && trail ? renderTrail(trail, renderLink) : null, sheet ? (_jsx(HeaderSheet, { id: id, open: sheetOpen, closeSheet: closeSheet, titleRef: sheetTitle, title: sheetName, start: props.sheetStart, end: props.sheetEnd, switchers: switchers, sections: sections, sectionLinks: sectionLinks, linksLabel: linksLabel, cta: cta, account: account, signIn: signIn, signOut: signOut, signOutLabel: signOutLabel, renderLink: renderLink })) : null, end] }) }));
}
function AccountSlot({ show, children }) {
    return show ? _jsx("div", { className: "cap-site-header-account", children: children }) : null;
}
// The phone's bottom bar: up to five top pages; the menu button opens the full list. Under 768px
// only. Put it last in the page so it sticks to the window's bottom edge.
export function SiteTabs({ tabs, label = "Sections", renderLink = plainLink, }) {
    return (_jsx("nav", { className: "cap-site-tabs", "aria-label": label, children: tabs.slice(0, 5).map((t) => (_jsx(Fragment, { children: renderLink({
                href: t.href,
                "aria-current": t.current ? "page" : undefined,
                "aria-label": t.count ? countName(t.label, t.count, t.countNote) : undefined,
                children: (_jsxs(_Fragment, { children: [t.icon, t.label, t.count ? " " : null, t.count ? (_jsx("span", { className: "cap-count cap-site-header-badge", "data-tone": "need", "aria-hidden": "true", children: badgeText(t.count) })) : null] })),
            }) }, t.id ?? t.href))) }));
}
