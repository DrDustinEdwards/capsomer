import { jsx as _jsx } from "react/jsx-runtime";
import { useId } from "react";
// The HTML contract in select.md without select.ts: the wrapper and a real native select holding
// every option, so it server-renders. `Select` adds the button and popup over it; a caller that
// only ever wants the browser's select (RatingInput) uses this and leaves select.ts out of its
// bundle.
export function NativeSelect(props) {
    const { options, size = "default", native = true, id, wrapRef, ...rest } = props;
    const own = useId();
    const opt = (o) => (_jsx("option", { value: o.value, disabled: o.disabled, children: o.label }, o.value));
    return (_jsx("div", { className: "cap-select-wrap", "data-cap": "select", "data-native": native ? "" : undefined, ref: wrapRef, children: _jsx("select", { ...rest, id: id ?? own, className: "cap-select", "data-size": size === "default" ? undefined : size, children: options.map((o) => "group" in o ? (_jsx("optgroup", { label: o.group, children: o.options.map(opt) }, o.group)) : (opt(o))) }) }));
}
