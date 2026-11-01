import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Menu as Base } from "@base-ui/react/menu";
import { Fragment, useEffect, useId, useRef } from "react";
import { enhance } from "./menu.js";
const Chevron = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", d: "m3.5 6 4.5 4.5L12.5 6" }) }));
const ChevronEnd = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", d: "m6 3.5 4.5 4.5L6 12.5" }) }));
const Check = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "M3.5 8.5 6.5 11.5 12.5 4.5" }) }));
const isAction = (e) => e !== "separator" && (e.type === undefined || e.type === "item");
// Ordinary entries first, in their order, with no leading, trailing or doubled separator;
// then the danger items, after one separator.
export function arrangeEntries(items) {
    const plain = [];
    for (const e of items) {
        if (e === "separator") {
            if (plain.length > 0 && plain[plain.length - 1] !== "separator")
                plain.push(e);
        }
        else if (!(isAction(e) && e.danger))
            plain.push(e);
    }
    if (plain[plain.length - 1] === "separator")
        plain.pop();
    const danger = items.filter((e) => isAction(e) && e.danger === true);
    return danger.length > 0 && plain.length > 0 ? [...plain, "separator", ...danger] : [...plain, ...danger];
}
// The caps of a shortcut: "Shift+R" is two, aria-hidden (the name stays the action, and
// aria-keyshortcuts says the keys).
function Keys({ shortcut }) {
    return (_jsx("span", { className: "cap-option-keys", "aria-hidden": "true", children: shortcut.split("+").map((cap, i) => (_jsxs(Fragment, { children: [i > 0 ? " " : null, _jsx("kbd", { className: "cap-menu-kbd", children: cap })] }, `${cap}-${i}`))) }));
}
function Entries({ entries, id, container }) {
    return (_jsx(_Fragment, { children: entries.map((e, i) => {
            const key = `${i}`;
            if (e === "separator")
                return _jsx(Base.Separator, { className: "cap-listbox-separator cap-menu-separator" }, `sep-${key}`);
            if (isAction(e)) {
                return (_jsxs(Base.Item, { className: "cap-option cap-menu-item", label: e.label, disabled: e.disabled, onClick: e.onSelect, "data-tone": e.danger ? "crit" : undefined, "aria-describedby": e.reason ? `${id}-r${key}` : undefined, "aria-keyshortcuts": e.shortcut, children: [e.icon ? _jsx("span", { className: "cap-option-icon", children: e.icon }) : null, _jsx("span", { className: "cap-option-label", children: e.label }), e.shortcut && _jsx(Keys, { shortcut: e.shortcut }), e.reason && (_jsx("span", { className: "cap-menu-reason", id: `${id}-r${key}`, "aria-hidden": "true", children: e.reason }))] }, `${e.label}-${key}`));
            }
            if (e.type === "checkbox") {
                return (_jsxs(Base.CheckboxItem, { className: "cap-option cap-menu-item", label: e.label, checked: e.checked, defaultChecked: e.defaultChecked, onCheckedChange: e.onCheckedChange, disabled: e.disabled, "aria-keyshortcuts": e.shortcut, children: [_jsx("span", { className: "cap-option-label", children: e.label }), e.shortcut && _jsx(Keys, { shortcut: e.shortcut }), _jsx("span", { className: "cap-option-indicator", "aria-hidden": "true", children: _jsx(Base.CheckboxItemIndicator, { children: _jsx(Check, {}) }) })] }, `${e.label}-${key}`));
            }
            if (e.type === "radio-group") {
                const group = (_jsx(Base.RadioGroup, { value: e.value, defaultValue: e.defaultValue, onValueChange: e.onValueChange ? (v) => e.onValueChange?.(String(v)) : undefined, children: e.items.map((r) => (_jsxs(Base.RadioItem, { value: r.value, label: r.label, disabled: r.disabled, className: "cap-option cap-menu-item", children: [_jsx("span", { className: "cap-option-label", children: r.label }), _jsx("span", { className: "cap-option-indicator", "aria-hidden": "true", children: _jsx(Base.RadioItemIndicator, { children: _jsx(Check, {}) }) })] }, r.value))) }));
                return e.label ? (_jsxs(Base.Group, { children: [_jsx(Base.GroupLabel, { className: "cap-listbox-label", children: e.label }), group] }, `radio-${key}`)) : (_jsx(Fragment, { children: group }, `radio-${key}`));
            }
            if (e.type === "group") {
                return (_jsxs(Base.Group, { children: [_jsx(Base.GroupLabel, { className: "cap-listbox-label", children: e.label }), _jsx(Entries, { entries: e.items, id: `${id}-g${key}`, container: container })] }, `group-${key}`));
            }
            return (_jsxs(Base.SubmenuRoot, { children: [_jsxs(Base.SubmenuTrigger, { className: "cap-option cap-menu-item", label: e.label, disabled: e.disabled, children: [e.icon ? _jsx("span", { className: "cap-option-icon", children: e.icon }) : null, _jsx("span", { className: "cap-option-label", children: e.label }), _jsx("span", { className: "cap-menu-chevron", "aria-hidden": "true", children: _jsx(ChevronEnd, {}) })] }), _jsx(Base.Portal, { container: container ?? undefined, children: _jsx(Base.Positioner, { className: "cap-menu-positioner", side: "right", align: "start", sideOffset: 0, alignOffset: -4, children: _jsx(Base.Popup, { className: "cap-popover cap-menu", "data-submenu": "", children: _jsx(Entries, { entries: e.items, id: `${id}-s${key}`, container: container }) }) }) })] }, `${e.label}-${key}`));
        }) }));
}
export function Menu({ label, items, disabled = false, container, defaultOpen, ...rest }) {
    const id = useId();
    const entries = arrangeEntries(items);
    return (_jsxs(Base.Root, { modal: false, disabled: disabled, defaultOpen: defaultOpen, children: [_jsxs(Base.Trigger, { className: "cap-btn cap-menu-trigger", "aria-label": rest["aria-label"], children: [label, _jsx(Chevron, {})] }), _jsx(Base.Portal, { container: container ?? undefined, children: _jsx(Base.Positioner, { className: "cap-menu-positioner", sideOffset: 4, align: "start", children: _jsx(Base.Popup, { className: "cap-popover cap-menu", children: _jsx(Entries, { entries: entries, id: id, container: container }) }) }) })] }));
}
// The row-actions menu with no script: a <details> of submit buttons. Pure markup, so a server
// renders what the browser shows; `enhance` adds Esc, arrow keys and closing on an outside press.
export function FormMenu({ label, action, method = "post", items, name = "intent", hidden, ...rest }) {
    const ref = useRef(null);
    useEffect(() => (ref.current ? enhance(ref.current.parentNode ?? document) : undefined), []);
    const ordinary = items.filter((i) => !i.danger);
    const danger = items.filter((i) => i.danger);
    const select = (i) => (e) => {
        if (!i.onSelect)
            return;
        e.preventDefault();
        if (ref.current)
            ref.current.open = false;
        i.onSelect();
    };
    const button = (i) => i.href && (!i.danger || i.onSelect) ? (_jsx("a", { className: "cap-option cap-menu-item", href: i.href, onClick: select(i), "data-tone": i.danger ? "crit" : undefined, children: _jsx("span", { className: "cap-option-label", children: i.label }) }, i.value)) : (_jsxs("button", { type: "submit", className: "cap-option cap-menu-item", name: name, value: i.value, disabled: i.disabled, "data-tone": i.danger ? "crit" : undefined, children: [_jsx("span", { className: "cap-option-label", children: i.label }), i.reason ? _jsx("span", { className: "cap-menu-reason", children: i.reason }) : null] }, i.value));
    return (_jsxs("details", { className: "cap-menu-form", "data-cap": "menu-form", ref: ref, children: [_jsxs("summary", { className: "cap-btn cap-menu-trigger", "aria-label": rest["aria-label"], children: [label, _jsx(Chevron, {})] }), _jsxs("form", { className: "cap-popover cap-menu", action: action, method: method, children: [Object.entries(hidden ?? {}).map(([k, v]) => (_jsx("input", { type: "hidden", name: k, value: v }, k))), ordinary.map(button), danger.length && ordinary.length ? _jsx("hr", { className: "cap-listbox-separator cap-menu-separator" }) : null, danger.map(button)] })] }));
}
