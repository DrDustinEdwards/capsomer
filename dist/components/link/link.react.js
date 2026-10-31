import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, useHref, useLocation } from "react-router";
import { ABSOLUTE, mayPrefetch } from "./link.js";
// React Router's Link and NavLink, the same props, prefetching on hover and focus by default
// (`prefetch="intent"`, which React Router has no app-wide setting for). A link mayPrefetch
// refuses (link.ts) renders with prefetch="none" whatever it asked for; `prefetch` picks the
// mode for the rest ("none", "render", "viewport").
const Exclude = createContext([]);
// The app's own paths that act on a GET, for every Link and NavLink under it, beyond the
// family's NEVER_PREFETCH: `<LinkPrefetch exclude={["/demos/:product"]}>` at the root.
export function LinkPrefetch({ exclude, children }) {
    return _jsx(Exclude, { value: exclude, children: children });
}
function usePrefetch({ to, relative, reloadDocument, target, download, prefetch = "intent" }) {
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
