import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useRef } from "react";
import { Icon, iconChevronLeft } from "../icons/icons.react.js";
import { useHydrated } from "../hooks/hooks.react.js";
import { PageHead } from "../page-head/page-head.react.js";
import { Switch } from "../switch/switch.react.js";
// One setting on its own line: its name and one line on what it does at the start, its control
// at the end, a rule between rows. `children` is given the ids to name and describe the control
// with, so the row's words are the control's name and description.
export function SettingsRow({ label, help, children, }) {
    const base = useId();
    const labelId = `${base}-label`;
    const helpId = help ? `${base}-help` : undefined;
    return (_jsxs("div", { className: "cap-settings-row", children: [_jsxs("div", { className: "cap-settings-row-text", children: [_jsx("span", { className: "cap-settings-row-label", id: labelId, children: label }), help ? (_jsx("p", { className: "cap-settings-row-help", id: helpId, children: help })) : null] }), _jsx("div", { className: "cap-settings-row-control", children: children({ labelId, helpId }) })] }));
}
// A settings row whose control is a switch, named by the row's label and described by its line.
export function SwitchRow({ name, label, help, checked, defaultChecked, onCheckedChange, busy, form, submitOnChange = false, saveLabel = "Save", disabledReason, }) {
    const ready = useHydrated();
    const input = useRef(null);
    const off = disabledReason != null && disabledReason !== false && disabledReason !== "";
    return (_jsx(SettingsRow, { label: label, help: help || off ? (_jsxs(_Fragment, { children: [help, off ? (_jsxs("span", { className: "cap-settings-row-reason", children: [help ? " " : null, disabledReason] })) : null] })) : undefined, children: ({ labelId, helpId }) => (_jsxs(_Fragment, { children: [_jsx(Switch, { ref: input, name: name, form: form, label: null, checked: checked, defaultChecked: defaultChecked, busy: busy, disabled: off, "aria-labelledby": labelId, "aria-describedby": helpId, onCheckedChange: (on) => {
                        onCheckedChange?.(on);
                        if (submitOnChange)
                            input.current?.form?.requestSubmit();
                    } }), submitOnChange && !ready && !off ? (_jsx("button", { type: "submit", form: form, className: "cap-btn", "data-size": "sm", children: saveLabel })) : null] })) }));
}
// A settings page: the page head (title, its line, the trail) and, on a phone, where the
// settings menu is hidden, a link back to the settings index above it.
export function SettingsLayout({ title, lead, crumbs, renderLink, back = { href: "/settings", label: "Settings" }, actions, children, }) {
    const backLink = back ? (renderLink ? (renderLink({
        href: back.href,
        children: _jsx(BackWords, { label: back.label }),
        className: "cap-settings-back",
    })) : (_jsx("a", { className: "cap-settings-back", href: back.href, children: _jsx(BackWords, { label: back.label }) }))) : null;
    return (_jsxs("div", { className: "cap-settings-page", children: [backLink, _jsx(PageHead, { title: title, lead: lead, crumbs: crumbs, renderLink: renderLink, actions: actions }), children] }));
}
function BackWords({ label }) {
    return (_jsxs(_Fragment, { children: [_jsx(Icon, { d: iconChevronLeft, className: "cap-icon-flip" }), label] }));
}
