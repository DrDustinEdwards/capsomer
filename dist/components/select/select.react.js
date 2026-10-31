import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useId, useRef } from "react";
import { enhance, selectControlFor } from "./select.js";
// Renders the HTML contract in select.md: the wrapper, with a real native select holding every
// option, so it server-renders. select.ts draws the button and the popup over it in an effect;
// React keeps owning the native select (value, options, disabled), and the trigger follows it.
export function Select(props) {
    const { options, size = "default", native = false, id, ...rest } = props;
    const own = useId();
    const ref = useRef(null);
    const selectId = id ?? own;
    useEffect(() => (native || !ref.current ? undefined : enhance(ref.current)), [native]);
    // The value is controlled by React: after each render the trigger is read again.
    useEffect(() => {
        const select = ref.current?.querySelector("select");
        selectControlFor(select ?? null)?.sync();
    });
    const opt = (o) => (_jsx("option", { value: o.value, disabled: o.disabled, children: o.label }, o.value));
    return (_jsx("div", { className: "cap-select-wrap", "data-cap": "select", "data-native": native ? "" : undefined, ref: ref, children: _jsx("select", { ...rest, id: selectId, className: "cap-select", "data-size": size === "default" ? undefined : size, children: options.map((o) => "group" in o ? (_jsx("optgroup", { label: o.group, children: o.options.map(opt) }, o.group)) : (opt(o))) }) }));
}
