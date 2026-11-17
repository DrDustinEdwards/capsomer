import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useId, useRef, useState, } from "react";
import { FINDS_HIDDEN, attachPillDrag, guessPlatform, nextTab, onRemembered, pageTabHref, readRemembered, setPanelHidden, writeRemembered, } from "./tabs.js";
const Ctx = createContext(null);
function useTabs() {
    const c = useContext(Ctx);
    if (!c)
        throw new Error("Tabs parts go inside <Tabs>");
    return c;
}
export function Tabs({ value, defaultValue = "", onValueChange, orientation = "horizontal", activation = "automatic", remember, rememberGuess, className, children, ...props }) {
    const base = useId();
    const [own, setOwn] = useState(defaultValue);
    const chosen = value ?? own;
    const [moved, setMoved] = useState(null);
    const latest = useRef({ chosen, onValueChange });
    useEffect(() => {
        latest.current = { chosen, onValueChange };
    });
    const choose = (v) => {
        setOwn(v);
        setMoved(null);
        if (v !== chosen)
            onValueChange?.(v);
        if (remember)
            writeRemembered(remember, v);
    };
    useEffect(() => {
        if (!remember)
            return;
        // Only a tab this set has, and one that can be chosen.
        const apply = (v) => {
            const tab = v ? document.getElementById(`${base}-tab-${v}`) : null;
            if (!v || !tab || tab.getAttribute("aria-disabled") === "true")
                return false;
            setOwn(v);
            setMoved(null);
            if (v !== latest.current.chosen)
                latest.current.onValueChange?.(v);
            return true;
        };
        if (!apply(readRemembered(remember)) && rememberGuess === "platform")
            apply(guessPlatform());
        return onRemembered(remember, apply);
    }, [remember, rememberGuess, base]);
    return (_jsx(Ctx.Provider, { value: {
            base,
            value: chosen,
            stop: moved ?? chosen,
            orientation,
            activation,
            choose,
            setStop: setMoved,
        }, children: _jsx("div", { className: className ? `cap-tabs ${className}` : "cap-tabs", "data-orientation": orientation === "vertical" ? "vertical" : undefined, "data-activation": activation === "manual" ? "manual" : undefined, ...props, children: children }) }));
}
export function TabsList({ variant = "default", size = "default", fill, className, onKeyDown, onBlur, children, ...props }) {
    const c = useTabs();
    const list = useRef(null);
    // The pill's drag ends in a click on the tab it settles on, so the choice is the trigger's own.
    useEffect(() => {
        const el = list.current;
        if (!el || variant !== "pill")
            return;
        return attachPillDrag(el, (tab) => tab.click());
    }, [variant]);
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
    return (_jsx("div", { ref: list, role: "tablist", "aria-orientation": c.orientation === "vertical" ? "vertical" : undefined, className: className ? `cap-tabs-list ${className}` : "cap-tabs-list", "data-variant": variant === "default" ? undefined : variant, "data-size": size === "default" ? undefined : size, "data-fill": fill ? "" : undefined, onKeyDown: keys, onBlur: (e) => {
            onBlur?.(e);
            if (!e.currentTarget.contains(e.relatedTarget))
                c.setStop(c.value);
        }, ...props, children: children }));
}
export function TabsTrigger({ value, count, tone, disabled, className, onClick, children, ...props }) {
    const c = useTabs();
    const on = c.value === value;
    return (_jsxs("button", { type: "button", role: "tab", id: `${c.base}-tab-${value}`, "aria-selected": on, "aria-controls": `${c.base}-panel-${value}`, "aria-disabled": disabled ? true : undefined, tabIndex: c.stop === value ? 0 : -1, className: className ? `cap-tab ${className}` : "cap-tab", "data-tone": tone, onClick: (e) => {
            onClick?.(e);
            if (!e.defaultPrevented && !disabled)
                c.choose(value);
        }, ...props, children: [children, count != null ? _jsx("span", { className: "cap-tab-count", children: count }) : null] }));
}
export function TabsContent({ value, className, children, ...props }) {
    const c = useTabs();
    const ref = useRef(null);
    const hide = c.value !== value;
    const { choose } = c;
    // The server renders a plain `hidden`; once hydrated, an inactive panel becomes `hidden="until-found"` where the
    // browser has it, and a find-in-page match inside it chooses this tab (tabs.ts, FINDS_HIDDEN).
    useEffect(() => {
        const el = ref.current;
        if (!el || !FINDS_HIDDEN)
            return;
        setPanelHidden(el, hide);
        const onMatch = (e) => {
            if (e.target === el)
                choose(value);
        };
        el.addEventListener("beforematch", onMatch);
        return () => el.removeEventListener("beforematch", onMatch);
    }, [hide, choose, value]);
    return (_jsx("div", { ref: ref, role: "tabpanel", id: `${c.base}-panel-${value}`, "aria-labelledby": `${c.base}-tab-${value}`, tabIndex: 0, hidden: hide, className: className ? `cap-tabs-panel ${className}` : "cap-tabs-panel", ...props, children: children }));
}
const NavLinks = createContext(undefined);
export function TabsNav({ variant = "default", size = "default", fill, className, children, renderLink, ...props }) {
    const nav = (_jsx("nav", { className: className ? `cap-tabs-list ${className}` : "cap-tabs-list", "data-variant": variant === "default" ? undefined : variant, "data-size": size === "default" ? undefined : size, "data-fill": fill ? "" : undefined, ...props, children: children }));
    return renderLink ? _jsx(NavLinks.Provider, { value: renderLink, children: nav }) : nav;
}
export function TabLink({ current, count, className, children, renderLink, ...props }) {
    const inherited = useContext(NavLinks);
    const draw = renderLink ?? inherited;
    const inner = (_jsxs(_Fragment, { children: [children, count != null ? _jsx("span", { className: "cap-tab-count", children: count }) : null] }));
    const linkProps = {
        className: className ? `cap-tab ${className}` : "cap-tab",
        "aria-current": current ? "page" : undefined,
        ...props,
        children: inner,
    };
    return draw ? _jsx(_Fragment, { children: draw(linkProps) }) : _jsx("a", { ...linkProps, children: inner });
}
export function PageTabs({ path, search = "", tabs, current, param = "tab", variant = "line", ...props }) {
    const first = tabs[0]?.id;
    return (_jsx(TabsNav, { variant: variant, ...props, children: tabs.map((t) => (_jsx(TabLink, { href: pageTabHref(path, search, t.id, first, param), current: t.id === current, count: t.count, "aria-label": t["aria-label"], "data-tab": t.id, children: t.label }, t.id))) }));
}
