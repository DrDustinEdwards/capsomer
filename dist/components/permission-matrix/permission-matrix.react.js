import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useState } from "react";
import { holders, holdings } from "./permission-matrix.js";
const Check = ({ held }) => (_jsx("span", { className: "cap-perms-check", "aria-hidden": "true", children: held ? (_jsx("svg", { viewBox: "0 0 16 16", focusable: "false", children: _jsx("path", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", d: "m3.5 8.5 3 3 6-7" }) })) : null }));
function Names({ names }) {
    return (_jsx(_Fragment, { children: names.map((n, i) => (_jsxs("span", { children: [i > 0 ? ", " : "", _jsx("span", { className: "cap-mono", children: n })] }, n))) }));
}
export function PermissionMatrix(props) {
    const { matrix, label = "Permissions by agent", defaultView = "agent", note } = props;
    const id = useId();
    const [own, setOwn] = useState(defaultView);
    const view = props.view ?? own;
    const choose = (v) => {
        setOwn(v);
        props.onViewChange?.(v);
    };
    const byAgent = holdings(matrix);
    const byPerm = holders(matrix);
    return (_jsxs("div", { className: "cap-perms", "data-cap": "permission-matrix", "data-cap-ready": "", "data-current": view, children: [_jsxs("div", { className: "cap-perms-bar", children: [_jsxs("fieldset", { className: "cap-seg", children: [_jsx("legend", { className: "cap-sr-only", children: "View" }), _jsx("div", { className: "cap-seg-options", children: ["agent", "permission"].map((v) => (_jsxs("label", { children: [_jsx("input", { type: "radio", name: `${id}-view`, value: v, checked: view === v, onChange: () => choose(v) }), v === "agent" ? "By agent" : "By permission"] }, v))) })] }), note ? _jsx("p", { className: "cap-perms-note", children: note }) : null] }), _jsxs("div", { className: "cap-perms-view", "data-view": "agent", hidden: view !== "agent", children: [_jsx("div", { className: "cap-perms-wide", children: _jsx("div", { className: "cap-table-wrap", role: "region", "aria-label": label, tabIndex: 0, children: _jsxs("table", { className: "cap-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Agent" }), matrix.permissions.map((p) => (_jsx("th", { scope: "col", className: "cap-perms-col", children: p }, p)))] }) }), _jsx("tbody", { children: matrix.agents.map((a) => (_jsxs("tr", { children: [_jsx("th", { scope: "row", className: "cap-perms-agent cap-mono", children: a.name }), matrix.permissions.map((p) => {
                                                    const held = a.holds.includes(p);
                                                    return (_jsxs("td", { className: "cap-perms-cell", "data-held": held ? "yes" : "no", children: [_jsx(Check, { held: held }), _jsx("span", { className: "cap-sr-only", children: held ? "Yes" : "No" })] }, p));
                                                })] }, a.name))) })] }) }) }), _jsx("div", { className: "cap-perms-narrow", children: _jsx("ul", { className: "cap-perms-cards", "aria-label": label, children: byAgent.map((h) => (_jsxs("li", { className: "cap-perms-card", children: [_jsx("span", { className: "cap-perms-name cap-mono", children: h.agent }), h.held.length ? (_jsxs("div", { className: "cap-perms-holds", children: [_jsx("span", { className: "cap-perms-key", children: "Holds:" }), " ", h.held.join(", ")] })) : (_jsx("div", { className: "cap-perms-holds", "data-empty": "", children: "Holds no permissions" }))] }, h.agent))) }) })] }), _jsx("div", { className: "cap-perms-view", "data-view": "permission", hidden: view !== "permission", children: _jsx("ul", { className: "cap-perms-cards", "aria-label": "Agents by permission", children: byPerm.map((h) => (_jsxs("li", { className: "cap-perms-card", children: [_jsx("span", { className: "cap-perms-name", children: h.permission }), h.agents.length ? (_jsxs("div", { className: "cap-perms-holds", children: [_jsx("span", { className: "cap-perms-key", children: "Held by:" }), " ", _jsx(Names, { names: h.agents })] })) : (_jsx("div", { className: "cap-perms-holds", "data-empty": "", children: "Nobody holds this" }))] }, h.permission))) }) })] }));
}
