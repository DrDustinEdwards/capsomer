import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useId, useState } from "react";
import { nextTab } from "./tabs.js";
const Ctx = createContext(null);
function useTabs() {
    const c = useContext(Ctx);
    if (!c)
        throw new Error("Tabs parts go inside <Tabs>");
    return c;
}
export function Tabs({ value, defaultValue = "", onValueChange, orientation = "horizontal", activation = "automatic", className, children, ...props }) {
    const base = useId();
    const [own, setOwn] = useState(defaultValue);
    const chosen = value ?? own;
    const [moved, setMoved] = useState(null);
    const choose = (v) => {
        setOwn(v);
        setMoved(null);
        if (v !== chosen)
            onValueChange?.(v);
    };
    return (_jsx(Ctx.Provider, { value: { base, value: chosen, stop: moved ?? chosen, orientation, activation, choose, setStop: setMoved }, children: _jsx("div", { className: className ? `cap-tabs ${className}` : "cap-tabs", "data-orientation": orientation === "vertical" ? "vertical" : undefined, "data-activation": activation === "manual" ? "manual" : undefined, ...props, children: children }) }));
}
export function TabsList({ variant = "default", size = "default", fill, className, onKeyDown, onBlur, children, ...props }) {
    const c = useTabs();
    const keys = (e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey)
            return;
        const tabs = [...e.currentTarget.querySelectorAll(":scope > [role='tab']")];
        const enabled = tabs.flatMap((t, i) => (t.getAttribute("aria-disabled") === "true" ? [] : [i]));
        const current = tabs.findIndex((t) => t === document.activeElement);
        const to = nextTab(enabled, current, e.key, c.orientation, getComputedStyle(e.currentTarget).direction === "rtl");
        const target = to === null ? undefined : tabs[to];
        if (!target)
            return;
        e.preventDefault();
        target.focus();
        if (c.activation === "automatic")
            target.click();
        else
            c.setStop(target.id.slice(`${c.base}-tab-`.length));
    };
    return (_jsx("div", { role: "tablist", "aria-orientation": c.orientation === "vertical" ? "vertical" : undefined, className: className ? `cap-tabs-list ${className}` : "cap-tabs-list", "data-variant": variant === "line" ? "line" : undefined, "data-size": size === "default" ? undefined : size, "data-fill": fill ? "" : undefined, onKeyDown: keys, onBlur: (e) => {
            onBlur?.(e);
            if (!e.currentTarget.contains(e.relatedTarget))
                c.setStop(c.value);
        }, ...props, children: children }));
}
export function TabsTrigger({ value, count, disabled, className, onClick, children, ...props }) {
    const c = useTabs();
    const on = c.value === value;
    return (_jsxs("button", { type: "button", role: "tab", id: `${c.base}-tab-${value}`, "aria-selected": on, "aria-controls": `${c.base}-panel-${value}`, "aria-disabled": disabled ? true : undefined, tabIndex: c.stop === value ? 0 : -1, className: className ? `cap-tab ${className}` : "cap-tab", onClick: (e) => {
            onClick?.(e);
            if (!e.defaultPrevented && !disabled)
                c.choose(value);
        }, ...props, children: [children, count != null ? _jsx("span", { className: "cap-tab-count", children: count }) : null] }));
}
export function TabsContent({ value, className, children, ...props }) {
    const c = useTabs();
    return (_jsx("div", { role: "tabpanel", id: `${c.base}-panel-${value}`, "aria-labelledby": `${c.base}-tab-${value}`, tabIndex: 0, hidden: c.value !== value, className: className ? `cap-tabs-panel ${className}` : "cap-tabs-panel", ...props, children: children }));
}
const NavLinks = createContext(undefined);
export function TabsNav({ variant = "default", size = "default", fill, className, children, renderLink, ...props }) {
    const nav = (_jsx("nav", { className: className ? `cap-tabs-list ${className}` : "cap-tabs-list", "data-variant": variant === "line" ? "line" : undefined, "data-size": size === "default" ? undefined : size, "data-fill": fill ? "" : undefined, ...props, children: children }));
    return renderLink ? _jsx(NavLinks.Provider, { value: renderLink, children: nav }) : nav;
}
export function TabLink({ current, count, className, children, renderLink, ...props }) {
    const inherited = useContext(NavLinks);
    const draw = renderLink ?? inherited;
    const inner = (_jsxs(_Fragment, { children: [children, count != null ? _jsx("span", { className: "cap-tab-count", children: count }) : null] }));
    const linkProps = { className: className ? `cap-tab ${className}` : "cap-tab", "aria-current": current ? "page" : undefined, ...props, children: inner };
    return draw ? _jsx(_Fragment, { children: draw(linkProps) }) : _jsx("a", { ...linkProps });
}
