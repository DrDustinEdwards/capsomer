import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The line at the top of a draft page that only its author can see. Which viewer may see a draft is
// the server's decision (site-runtime's draftGate); this only says so on the page it lets through.
export function DraftNotice({ show = true, label = "Draft", children = "Only you can see this page.", }) {
    if (!show)
        return null;
    return (_jsxs("p", { className: "cap-draft-notice", children: [_jsxs("span", { className: "cap-draft-notice-tag", children: [label, _jsx("span", { className: "cap-sr-only", children: ":" })] }), _jsx("span", { children: children })] }));
}
