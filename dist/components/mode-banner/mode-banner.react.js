import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const DEMO_WORDS = {
    title: "Demo with sample data",
    visitor: "This is how the dashboard looks once you connect. The numbers are made up, and nothing you do here is saved.",
    signedIn: "The numbers are made up, and nothing you do here is saved. This is not your real account.",
};
export function ModeBanner(props) {
    if (props.mode === "view-as")
        return (_jsxs("div", { className: "cap-mode-banner", "data-mode": "view-as", role: "status", children: [_jsxs("p", { className: "cap-mode-banner-text", children: ["Viewing as ", _jsx("strong", { children: props.who }), ", read-only."] }), _jsx("div", { className: "cap-mode-banner-actions", children: _jsx("a", { className: "cap-btn", "data-size": "sm", href: props.stopHref, children: "Stop viewing" }) })] }));
    return (_jsxs("div", { className: "cap-mode-banner", "data-mode": "demo", role: "status", children: [_jsxs("p", { className: "cap-mode-banner-text", children: [_jsxs("strong", { children: [DEMO_WORDS.title, "."] }), " ", props.signedIn ? DEMO_WORDS.signedIn : DEMO_WORDS.visitor] }), props.actions ? _jsx("div", { className: "cap-mode-banner-actions", children: props.actions }) : null] }));
}
