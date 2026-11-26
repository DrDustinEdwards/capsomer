import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Dialog, DialogBody, DialogHeader } from "../dialog/dialog.react.js";
import { plainLink } from "../hooks/hooks.react.js";
import { SheetGroup, headerItem, part, } from "./site-header-parts.react.js";
export function HeaderSheet({ id, open, closeSheet, titleRef, title, start, end, switchers, sections, sectionLinks, linksLabel, cta, account, signIn, signOut, signOutLabel, renderLink, }) {
    return (_jsxs(Dialog, { open: open, onOpenChange: (o) => !o && closeSheet(), placement: "bottom", id: `${id}-sheet`, className: "cap-site-header-sheet", "aria-labelledby": `${id}-sheet-title`, initialFocus: titleRef, children: [_jsx(DialogHeader, { children: _jsx("h2", { id: `${id}-sheet-title`, className: "cap-dialog-title cap-site-header-sheet-title", ref: titleRef, tabIndex: -1, children: title }) }), _jsx(DialogBody, { children: _jsxs("nav", { "aria-labelledby": `${id}-sheet-title`, children: [part(start, closeSheet), switchers.map((s) => s.groups.map((g, i) => (_jsx(SheetGroup, { label: g.label ?? s.sheetLabel ?? s.label, links: g.links, renderLink: renderLink, onClose: closeSheet }, `${s.id}-${i}`)))), sections
                            .filter((s) => s.groups)
                            .map((s) => (_jsx(SheetGroup, { label: s.label, links: (s.groups ?? []).flatMap((g) => g.links), renderLink: renderLink, onClose: closeSheet }, s.id))), sectionLinks.length > 0 ? (_jsx(SheetGroup, { label: linksLabel, links: sectionLinks, renderLink: renderLink, onClose: closeSheet })) : null, part(end, closeSheet), cta?.href && cta.phone !== "bar"
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
                            }) })) : null] }) })) : null] }));
}
