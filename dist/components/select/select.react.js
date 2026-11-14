import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { NativeSelect } from "./select-native.react.js";
import { enhance, selectControlFor } from "./select.js";
// Renders NativeSelect's markup (select.md), then select.ts draws the button and the popup over it
// in an effect; React keeps owning the native select (value, options, disabled), and the trigger
// follows it.
export function Select(props) {
    const native = props.native ?? false;
    const ref = useRef(null);
    useEffect(() => (native || !ref.current ? undefined : enhance(ref.current)), [native]);
    // The value is controlled by React: after each render the trigger is read again.
    useEffect(() => {
        const select = ref.current?.querySelector("select");
        selectControlFor(select ?? null)?.sync();
    });
    return _jsx(NativeSelect, { ...props, native: native, wrapRef: ref });
}
