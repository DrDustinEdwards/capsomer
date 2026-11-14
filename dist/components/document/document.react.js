import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import { documentAttrs } from "./document.js";
// Which routes hydrate is site-runtime's (./deferred-scripts, with hydrate-on-intent), re-exported for the Layout.
export { documentAttrs, startSite } from "./document.js";
// A React Router Layout's document. The page is under its family and site layer from the first byte.
export function Document({ children, lang = "en", head, hydrate = false, script, end, ...scope }) {
    return (_jsxs("html", { lang: lang, ...documentAttrs(scope), children: [_jsxs("head", { children: [_jsx("meta", { charSet: "utf-8" }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }), head, _jsx(Meta, {}), _jsx(Links, {}), !hydrate && script ? _jsx("script", { src: script, defer: true }) : null] }), _jsxs("body", { children: [children, hydrate ? (_jsxs(_Fragment, { children: [_jsx(ScrollRestoration, {}), _jsx(Scripts, {})] })) : null, end] })] }));
}
// A part of a page under another family or site layer: a specimen, an embedded preview, a sample of another site.
export function SiteScope({ children, as: Tag = "div", className, ...scope }) {
    return (_jsx(Tag, { className: className, ...documentAttrs(scope), children: children }));
}
