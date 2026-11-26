import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The site header's pure render helpers, no state of their own: an extra control, the logo link and the account menu's rows
// (site-header.react.tsx lays them out).
import { Fragment } from "react";
import { plainLink } from "../hooks/hooks.react.js";
import { HeaderTip, countName, headerItem, } from "./site-header-parts.react.js";
import { badgeText } from "./site-header.js";
export function renderExtra(e, renderLink) {
    const name = countName(e.label, e.count, e.countNote);
    const inner = (_jsxs(_Fragment, { children: [e.icon, e.count ? (_jsx("span", { className: "cap-count cap-site-header-badge", "data-tone": "need", "aria-hidden": "true", children: badgeText(e.count) })) : null, _jsx(HeaderTip, { text: e.label, keys: e.keys })] }));
    return e.href ? (_jsx(Fragment, { children: renderLink({
            href: e.href,
            className: e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon",
            "aria-label": name,
            children: inner,
        }) }, e.id)) : (_jsx("button", { type: "button", className: e.className ? `cap-site-header-icon ${e.className}` : "cap-site-header-icon", "aria-label": name, onClick: e.onClick, children: inner }, e.id));
}
export function renderLogo(logo, letterhead, renderLink) {
    return renderLink({
        href: logo.href,
        className: logo.className ? `cap-site-header-logo ${logo.className}` : "cap-site-header-logo",
        "aria-label": logo.name ??
            (letterhead ? [logo.agency, logo.label, logo.app].filter(Boolean).join(" ") : logo.label),
        children: (_jsxs(_Fragment, { children: [logo.mark, letterhead ? (_jsxs("span", { className: "cap-site-header-names", "aria-hidden": "true", children: [logo.agency ? _jsx("span", { className: "cap-site-header-agency", children: logo.agency }) : null, logo.agency ? " " : null, _jsxs("span", { className: "cap-site-header-name", children: [logo.label, logo.app ? _jsxs("span", { className: "cap-site-header-app", children: [" ", logo.app] }) : null] })] })) : ((logo.wordmark ?? _jsx("span", { "aria-hidden": "true", children: logo.label })))] })),
    });
}
export function accountPanelOf(account, panelGroups, signOut, renderLink) {
    return (account.panel ?? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "cap-site-header-who", children: [_jsx("strong", { children: account.name }), account.detail ? _jsx("small", { children: account.detail }) : null] }), panelGroups.map((g, i) => (_jsxs(Fragment, { children: [_jsx("hr", {}), g.label ? _jsx("div", { className: "cap-site-header-panel-label", children: g.label }) : null, _jsx("ul", { className: "cap-site-header-panel-list", children: g.links.map((l) => (_jsx("li", { children: headerItem(l, l.label, renderLink) }, l.label))) })] }, g.label ?? i))), signOut ? (_jsxs(_Fragment, { children: [_jsx("hr", {}), _jsx("ul", { className: "cap-site-header-panel-list", children: _jsx("li", { children: headerItem(signOut, "Sign out", plainLink, {
                                disabled: account.signOutDisabled,
                            }) }) })] })) : null] })));
}
export function renderTrail(trail, renderLink) {
    return (_jsxs("div", { className: "cap-site-header-trail", children: [_jsx("nav", { "aria-label": "You are here", children: _jsx("ol", { children: trail.crumbs.map((c) => (_jsx("li", { children: c.href && !c.current ? (renderLink({ href: c.href, children: c.label })) : (_jsx("span", { "aria-current": c.current ? "page" : undefined, children: c.label })) }, c.label))) }) }), trail.viewSite
                ? renderLink({
                    href: trail.viewSite,
                    className: "cap-site-header-view",
                    children: "View site",
                })
                : null] }));
}
export function signOutRow(account) {
    if (account.signOutHref)
        return { label: "Sign out", href: account.signOutHref };
    if (account.signOutAction)
        return { label: "Sign out", action: account.signOutAction, fields: account.signOutFields };
    if (account.onSignOut)
        return { label: "Sign out", onClick: account.onSignOut };
    return undefined;
}
