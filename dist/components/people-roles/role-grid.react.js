import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from "react";
import { Button } from "../button/button.react.js";
import { useOptionalMessage } from "../message/message.react.js";
import { Select } from "../select/select.react.js";
import { Pill } from "../status/status.react.js";
import { Table } from "../table/table.react.js";
import { Time } from "../time/time.react.js";
import { personName, roleFailedText, roleSavedText, } from "./people-roles.js";
import { useHydrated } from "../hooks/hooks.react.js";
function GridRow({ person, scopes, options, onRoleChange, onAccess, action, noAccess, hydrated, }) {
    const message = useOptionalMessage();
    const formId = `cap-roles-${useId()}`;
    const name = personName(person);
    const disabled = Boolean(person.disabledAt);
    // The role each select last saved, so a refused save puts the select back.
    const saved = useRef({});
    const access = async (e) => {
        if (!onAccess)
            return;
        e.preventDefault();
        const intent = disabled ? "enable" : "disable";
        try {
            await onAccess(person, intent);
        }
        catch (error) {
            message?.say(`${name} could not be ${intent === "disable" ? "disabled" : "enabled"}.`, {
                failure: true,
            });
            reportError(error);
            return;
        }
        if (intent === "disable")
            message?.say(`${name} is disabled. They are refused on their next request.`, {
                undo: () => onAccess(person, "enable"),
                undone: `${name} is enabled again.`,
            });
        else
            message?.say(`${name} is enabled again.`);
    };
    return (_jsxs("tr", { children: [_jsxs("th", { scope: "row", children: [_jsx("span", { className: "cap-role-person", children: name }), person.name ? _jsx("span", { className: "cap-role-email", children: person.email }) : null, _jsxs("span", { className: "cap-role-pills", children: [(person.badges ?? []).map((b) => (_jsx(Pill, { variant: "outline", children: b }, b))), person.disabledAt ? (_jsxs(Pill, { variant: "secondary", children: ["Disabled ", _jsx(Time, { at: person.disabledAt, format: "date" })] })) : null] }), person.everyScope ? null : (_jsxs("span", { className: "cap-role-actions", children: [hydrated && onRoleChange ? null : (_jsxs(Button, { type: "submit", form: formId, size: "sm", children: ["Save", _jsxs("span", { className: "cap-sr-only", children: [" roles for ", name] })] })), _jsxs("form", { method: "post", action: action, onSubmit: (e) => void access(e), children: [_jsx("input", { type: "hidden", name: "person", value: person.id }), _jsxs(Button, { type: "submit", name: "intent", value: disabled ? "enable" : "disable", size: "sm", children: [disabled ? "Enable" : "Disable", _jsxs("span", { className: "cap-sr-only", children: [" ", name] })] })] })] })), person.everyScope ? null : (_jsxs("form", { id: formId, method: "post", action: action, hidden: true, children: [_jsx("input", { type: "hidden", name: "intent", value: "roles" }), _jsx("input", { type: "hidden", name: "person", value: person.id })] }))] }), person.everyScope ? (_jsx("td", { colSpan: scopes.length, className: "cap-muted", children: person.everyScope })) : (scopes.map((scope) => {
                const choices = [{ value: "", label: noAccess }, ...options(person, scope)];
                return (_jsx("td", { children: _jsx(Select, { form: formId, name: `role-${scope.id}`, size: "sm", "aria-label": `${name} on ${scope.name}`, defaultValue: person.roles[scope.id] ?? "", onChange: (event) => {
                            // Without a handler the row's Save posts the change; nothing is saved yet.
                            if (!onRoleChange)
                                return;
                            const select = event.currentTarget;
                            const value = select.value;
                            const before = saved.current[scope.id] ?? person.roles[scope.id] ?? "";
                            const label = choices.find((c) => c.value === value)?.label ?? value;
                            Promise.resolve(onRoleChange(person, scope, value)).then(() => {
                                saved.current[scope.id] = value;
                                message?.say(roleSavedText(name, scope.name, label));
                            }, (error) => {
                                select.value = before;
                                message?.say(roleFailedText(name, scope.name), { failure: true });
                                reportError(error);
                            });
                        }, options: choices }) }, scope.id));
            }))] }));
}
// People as rows, scopes (projects, sites) as columns, a role select in each cell that saves on
// change; each row has Disable (with Undo) and, before the script runs, Save. The person stays in
// view while the scopes scroll sideways. From Carrel's People page (routes/people.tsx).
export function RoleGrid({ people, scopes, caption, personHeading = "Person", noAccess = "No access", ...rest }) {
    const hydrated = useHydrated();
    return (_jsxs(Table, { caption: caption, captionHidden: true, className: "cap-role-grid-wrap", tableClassName: "cap-role-grid", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: personHeading }), scopes.map((s) => (_jsx("th", { scope: "col", children: s.name }, s.id)))] }) }), _jsx("tbody", { children: people.map((p) => (_jsx(GridRow, { person: p, scopes: scopes, hydrated: hydrated, noAccess: noAccess, ...rest }, p.id))) })] }));
}
