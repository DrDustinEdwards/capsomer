import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Empty } from "../empty/empty.react.js";
// A route error response (a thrown Response, data() or a 404 no route matched) has a numeric
// status and a string statusText; that is all isRouteErrorResponse itself checks besides the
// router's private flag.
function statusOf(error) {
    if (typeof error !== "object" || error === null)
        return null;
    const { status, statusText } = error;
    return typeof status === "number" && typeof statusText === "string" ? status : null;
}
// The statusText site-runtime's databaseDown(error) gives the 503 a loader throws when D1 is down
// or reset for a moment (DATABASE_DOWN_STATUS_TEXT in @dustinedwards/site-runtime/health).
const DATABASE_DOWN = /database/i;
/** What the page says for an error: its status, a title and one plain sentence. */
export function errorWords(error) {
    const status = statusOf(error);
    if (status === 404)
        return { status, title: "Page not found", text: "There is nothing at this address. Check it for a typo, or start again from the home page." };
    if (status === 410)
        return { status, title: "This page is gone", text: "It was taken down on purpose and is not coming back." };
    if (status !== null && status < 500)
        return { status, title: "This page cannot be shown", text: `The request was refused (${status}). Start again from the home page.` };
    if (status === 503) {
        const { statusText } = error;
        if (DATABASE_DOWN.test(statusText))
            return { status, title: "The site's data is unavailable", text: "Its database is not answering for the moment. Nothing you did caused this; try again in a few minutes." };
        return { status, title: "This page is unavailable for now", text: "The site is busy or being updated. Try again in a few minutes." };
    }
    return { status: status ?? 500, title: "Something went wrong", text: "The page could not be shown. It is not something you did; try again in a moment." };
}
/** The title for the root `meta` on the error path: "Page not found | Site name". */
export function errorTitle(error, siteName) {
    return `${errorWords(error).title} | ${siteName}`;
}
export function ErrorPage({ error, home, siteHeader, siteFooter, children, dev = false, mainId = "main", className, title, text, homeLabel = "Go to the home page", as: Region = "main", }) {
    const found = errorWords(error);
    const words = { status: found.status, title: title ?? found.title, text: text ?? found.text };
    const thrown = dev && error instanceof Error ? error : null;
    const server = words.status >= 500;
    const action = (_jsxs(_Fragment, { children: [server ? (_jsx("a", { className: "cap-btn", "data-variant": "primary", href: "", children: "Try again" })) : null, _jsx("a", { className: "cap-btn", "data-variant": server ? undefined : "primary", href: home, children: homeLabel })] }));
    return (_jsxs(_Fragment, { children: [_jsx("meta", { name: "robots", content: "noindex" }), siteHeader, _jsxs(Region, { id: Region === "main" ? mainId : undefined, tabIndex: Region === "main" ? -1 : undefined, className: className ? `cap-error-page ${className}` : "cap-error-page", "data-status": words.status, children: [_jsx(Empty, { kind: "failed", titleAs: "h1", title: words.title, action: action, children: thrown ? thrown.message : words.text }), children, thrown?.stack ? (_jsx("pre", { className: "cap-error-page-stack", tabIndex: 0, role: "region", "aria-label": "Stack trace", children: _jsx("code", { children: thrown.stack }) })) : null] }), siteFooter] }));
}
