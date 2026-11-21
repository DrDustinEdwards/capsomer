import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Empty } from "../empty/empty.react.js";
import { buttonAttrs } from "../button/button-look.js";
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
/** What the page says for an error: its status, a title and, when it failed, one plain sentence. */
export function errorWords(error) {
    const status = statusOf(error);
    if (status === 404)
        return {
            status,
            title: "Page not found",
            text: "Nothing is at this address.",
        };
    if (status === 410)
        return {
            status,
            title: "This page was taken down",
        };
    if (status === 403)
        return {
            status,
            title: "You cannot open this page",
            text: "Your account does not have access.",
        };
    if (status !== null && status < 500)
        return {
            status,
            title: "This page cannot be shown",
            text: `The request was refused (${status}).`,
        };
    if (status === 503) {
        const { statusText } = error;
        if (DATABASE_DOWN.test(statusText))
            return {
                status,
                title: "The site's data is unavailable",
                text: "Its database is not answering. Try again in a few minutes.",
            };
        return {
            status,
            title: "This page is unavailable for now",
            text: "The site is busy or being updated. Try again in a few minutes.",
        };
    }
    return {
        status: status ?? 500,
        title: "Something went wrong",
        text: "The page could not be shown. Try again in a moment.",
    };
}
/** The title for the root `meta` on the error path: "Page not found | Site name". */
export function errorTitle(error, siteName) {
    return `${errorWords(error).title} | ${siteName}`;
}
// The actions are plain button-styled links (ButtonLink with an href draws the same), so this page,
// in every app's root bundle, takes neither ButtonLink nor the router; after an error a full load is
// what the visitor wants anyway.
const primary = buttonAttrs({ variant: "primary" }, undefined);
const plain = buttonAttrs({}, undefined);
export function ErrorPage({ error, home, siteHeader, siteFooter, children, dev = false, mainId = "main", className, title, text, homeLabel = "Go to the home page", homeIcon, as: Region = "main", actions, gone, hero, }) {
    const found = errorWords(error);
    const words = { status: found.status, title: title ?? found.title, text: text ?? found.text };
    const thrown = dev && error instanceof Error ? error : null;
    const server = words.status >= 500;
    const withdrawn = words.status === 410;
    const action = withdrawn ? (_jsxs(_Fragment, { children: [_jsxs("a", { ...primary, href: gone?.href ?? home, children: [gone?.label ?? homeLabel, homeIcon] }), actions] })) : (_jsxs(_Fragment, { children: [server ? (_jsx("a", { ...primary, href: "", children: "Try again" })) : null, _jsxs("a", { ...(server ? plain : primary), href: home, children: [homeLabel, homeIcon] }), actions] }));
    const message = hero ? (_jsxs(_Fragment, { children: [hero(words), _jsxs("div", { className: "cap-error-page-body", children: [thrown || (words.text && !withdrawn) ? (_jsx("p", { className: "cap-empty-text", children: thrown ? thrown.message : words.text })) : null, _jsx("div", { className: "cap-empty-content", children: action })] })] })) : withdrawn ? (_jsx(Empty, { kind: "nothing-yet", titleAs: "h1", title: words.title, action: action })) : (_jsx(Empty, { kind: "failed", titleAs: "h1", title: words.title, action: action, children: thrown ? thrown.message : words.text }));
    return (_jsxs(_Fragment, { children: [_jsx("meta", { name: "robots", content: "noindex" }), siteHeader ??
                (Region === "main" ? (_jsx("a", { className: "cap-skip", href: `#${mainId}`, children: "Skip to content" })) : null), _jsxs(Region, { id: Region === "main" ? mainId : undefined, tabIndex: Region === "main" ? -1 : undefined, className: className ? `cap-error-page ${className}` : "cap-error-page", "data-status": words.status, children: [message, children, thrown?.stack ? (_jsx("pre", { className: "cap-error-page-stack", tabIndex: 0, role: "region", "aria-label": "Stack trace", children: _jsx("code", { children: thrown.stack }) })) : null] }), siteFooter] }));
}
// The page an app shows once its session is gone: a polite status, one heading and one way back.
// It is not an error (nothing failed), so it is a status, not an alert.
export function SignedOutPage({ app, signIn, byChoice, mainId = "main" }) {
    return (_jsxs("main", { id: mainId, tabIndex: -1, className: "cap-error-page", "data-status": "signed-out", children: [_jsx("meta", { name: "robots", content: "noindex" }), _jsx(Empty, { kind: "nothing-yet", role: "status", titleAs: "h1", title: byChoice ? `Signed out of ${app}` : `Your ${app} session ended`, action: _jsx("a", { ...primary, href: signIn, children: byChoice ? "Sign in again" : "Reload to sign in" }) })] }));
}
