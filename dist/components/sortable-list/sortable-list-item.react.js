import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// One item of a sortable list: its handle, its content, its Move up and Move down buttons and Remove
// (sortable-list.react.tsx owns the state and says what each does).
import { useId } from "react";
const Grip = () => (_jsxs("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [_jsx("circle", { cx: "6", cy: "3.5", r: "1.25" }), _jsx("circle", { cx: "10", cy: "3.5", r: "1.25" }), _jsx("circle", { cx: "6", cy: "8", r: "1.25" }), _jsx("circle", { cx: "10", cy: "8", r: "1.25" }), _jsx("circle", { cx: "6", cy: "12.5", r: "1.25" }), _jsx("circle", { cx: "10", cy: "12.5", r: "1.25" })] }));
const Arrow = ({ up }) => (_jsx("svg", { viewBox: "0 0 16 16", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: up ? "M8 13V3M3.5 7.5 8 3l4.5 4.5" : "M8 3v10M3.5 8.5 8 13l4.5-4.5" }) }));
function MoveTo({ id, words, value, lanes, disabled, register, onMove, }) {
    const sid = useId();
    return (_jsxs(_Fragment, { children: [_jsxs("label", { className: "cap-sr-only", htmlFor: sid, children: ["Move ", words, " to"] }), _jsx("select", { id: sid, ref: register, className: "cap-select", "data-size": "sm", "data-cap-part": "move-to", "data-value": id, value: value, disabled: disabled, onChange: (e) => onMove(e.target.value, e.target), children: lanes.map((l) => (_jsx("option", { value: l.id, children: l.label }, l.id))) })] }));
}
export function SortItem({ c, lane, order, id, index, }) {
    const { byId, lifted, dragging, labelOf, renderHead, itemClassName, altKeys, readOnly, busy, grip, helpId, board, moveTo, lanes, steps, name, removeStyle, min, onRemove, renderItem, renderControls, renderFoot, step, remove, toLane, onHandleKey, onPointerDown, refFor, } = c;
    const item = byId.get(id);
    const up = lifted?.id === id;
    const words = labelOf(id);
    const state = { index, lifted: up, list: lane.id };
    const head = renderHead?.(item, state);
    const own = itemClassName?.(item, state);
    return (_jsxs("li", { ref: refFor("item", id), className: own ? `cap-sortable-item ${own}` : "cap-sortable-item", "data-value": id, "data-lifted": up ? "" : undefined, "data-dragging": dragging === id ? "" : undefined, "data-has-head": head ? "" : undefined, onKeyDown: (e) => {
            if (!altKeys || readOnly || busy || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
                return;
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
                return;
            // Alt+Down opens a select; leave it there.
            if (e.target instanceof HTMLSelectElement)
                return;
            e.preventDefault();
            step(id, e.key === "ArrowUp" ? -1 : 1, "handle", document.activeElement);
        }, children: [readOnly || !grip ? null : (_jsxs("button", { ref: refFor("handle", id), type: "button", className: "cap-sortable-handle", "aria-pressed": up, "aria-describedby": helpId, disabled: busy, onKeyDown: (e) => onHandleKey(e, id), onPointerDown: (e) => onPointerDown(e, id), children: [_jsx(Grip, {}), _jsxs("span", { className: "cap-sr-only", children: ["Move ", words] })] })), head ? _jsx("div", { className: "cap-sortable-head", children: head }) : null, _jsx("div", { className: "cap-sortable-body", children: renderItem(item, state) }), readOnly ? null : (_jsxs("span", { className: "cap-sortable-steps", children: [["up", "down"].map((part) => (_jsx("button", { ref: refFor("control", `${id}:${part}`), type: name ? "submit" : "button", name: name ? part : undefined, value: name ? id : undefined, className: "cap-btn", "data-variant": steps === "quiet" ? "quiet" : undefined, "data-size": "sm", "data-icon-only": steps === "labeled" ? undefined : "", "data-cap-part": part, "aria-keyshortcuts": altKeys ? `Alt+Arrow${part === "up" ? "Up" : "Down"}` : undefined, disabled: busy || (part === "up" ? index === 0 : index === order.length - 1), onClick: (e) => {
                            e.preventDefault();
                            step(id, part === "up" ? -1 : 1, part);
                        }, children: steps === "labeled" ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "cap-sr-only", children: ["Move ", words, " "] }), part === "up" ? "Up" : "Down"] })) : (_jsxs(_Fragment, { children: [_jsx(Arrow, { up: part === "up" }), _jsxs("span", { className: "cap-sr-only", children: ["Move ", words, " ", part] })] })) }, part))), board && moveTo && lanes.length > 1 ? (_jsx(MoveTo, { id: id, words: words, value: lane.id, lanes: lanes, disabled: busy, register: refFor("control", `${id}:move-to`), onMove: (list, el) => toLane(id, list, el) })) : null, renderControls?.(item, state), onRemove ? (_jsxs("button", { ref: refFor("control", `${id}:remove`), type: name ? "submit" : "button", name: name ? "remove" : undefined, value: name ? id : undefined, className: "cap-btn", "data-variant": removeStyle === "quiet" ? "quiet" : undefined, "data-size": "sm", "data-cap-part": "remove", disabled: busy || order.length <= min, onClick: (e) => {
                            e.preventDefault();
                            remove(id);
                        }, children: ["Remove", _jsxs("span", { className: "cap-sr-only", children: [" ", words] })] })) : null] })), renderFoot ? _jsx("div", { className: "cap-sortable-foot", children: renderFoot(item, state) }) : null, name ? _jsx("input", { type: "hidden", name: board ? `${name}[${lane.id}]` : name, value: id }) : null] }, id));
}
