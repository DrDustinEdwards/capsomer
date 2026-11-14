import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, useHref, useLocation, } from "react-router";
import { buttonAttrs } from "../button/button-look.js";
import { ABSOLUTE, mayPrefetch } from "./link.js";
// React Router's Link and NavLink, the same props, prefetching on hover and focus by default
// (`prefetch="intent"`, which React Router has no app-wide setting for). A link mayPrefetch
// refuses (link.ts) renders with prefetch="none" whatever it asked for; `prefetch` picks the
// mode for the rest ("none", "render", "viewport").
const Exclude = createContext([]);
// The app's own paths that act on a GET, for every Link and NavLink under it, beyond the
// family's NEVER_PREFETCH: `<LinkPrefetch exclude={["/demos/:product"]}>` at the root.
export function LinkPrefetch({ exclude, children, }) {
    return _jsx(Exclude, { value: exclude, children: children });
}
function usePrefetch({ to, relative, reloadDocument, target, download, prefetch = "intent", }) {
    const exclude = useContext(Exclude);
    const resolved = useHref(to, { relative });
    const from = useHref(useLocation().pathname);
    if (prefetch === "none")
        return "none";
    const href = typeof to === "string" && ABSOLUTE.test(to) ? to : resolved;
    return mayPrefetch({ href, from, exclude, reloadDocument, target, download }) ? prefetch : "none";
}
export function Link(props) {
    return _jsx(RouterLink, { ...props, prefetch: usePrefetch(props) });
}
export function NavLink(props) {
    return _jsx(RouterNavLink, { ...props, prefetch: usePrefetch(props) });
}
// The renderLink every Capsomer part takes (shell, site header, admin shell, row and attention
// lists), as React Router's Link with Capsomer's prefetch on intent: pass it as is,
// `<SiteHeader renderLink={routerRenderLink} />`, instead of writing an adapter per site.
export function routerRenderLink({ href, children, ...rest }) {
    return (_jsx(Link, { to: href, ...rest, children: children }));
}
export function awayRel(sponsored = false) {
    return sponsored ? "external sponsored noopener noreferrer" : "external noopener noreferrer";
}
export function awayWords(newTab = false) {
    return newTab ? " (opens another site in a new tab)" : " (opens another site)";
}
// The words for a link on this site that opens in a new tab.
export const NEW_TAB_WORDS = " (opens in a new tab)";
export function AwayLink({ newTab = false, sponsored = false, children, ...rest }) {
    return (_jsxs("a", { ...rest, "data-link": "away", rel: awayRel(sponsored), target: newTab ? "_blank" : undefined, children: [children, _jsx("span", { className: "cap-sr-only", children: awayWords(newTab) })] }));
}
export function ButtonLink(props) {
    const { variant, size, iconOnly, label, wrap, block, away = false, newTab = false, sponsored = false, className, children, ...rest } = props;
    const attrs = buttonAttrs({ variant, size, iconOnly, wrap, block, label, "aria-label": rest["aria-label"] }, className);
    const body = (_jsxs(_Fragment, { children: [children, away ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "cap-btn-away", "aria-hidden": "true", children: "↗" }), _jsx("span", { className: "cap-sr-only", children: awayWords(newTab) })] })) : newTab ? (_jsx("span", { className: "cap-sr-only", children: NEW_TAB_WORDS })) : null] }));
    const target = newTab ? "_blank" : undefined;
    const rel = away ? awayRel(sponsored) : newTab ? "noopener noreferrer" : undefined;
    if (typeof rest.href === "string") {
        const anchor = rest;
        return (_jsx("a", { ...anchor, ...attrs, target: target ?? anchor.target, rel: rel ?? anchor.rel, children: body }));
    }
    const link = rest;
    return (_jsx(Link, { ...link, ...attrs, target: target ?? link.target, rel: rel ?? link.rel, children: body }));
}
