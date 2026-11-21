import { useEffect, useRef } from "react";
import { NativeSelect, type SelectProps } from "./select-native.react.tsx";
import { enhance, selectControlFor } from "./select.ts";

export type { SelectGroupOption, SelectOption, SelectProps } from "./select-native.react.tsx";

// A server build (Vite sets import.meta.env.SSR) drops select.ts, the listbox and the popover:
// the effects that use them never run there, so a Worker carries only the markup.
const SERVER = (import.meta as { env?: { SSR?: boolean } }).env?.SSR;

// Renders NativeSelect's markup (select.md), then select.ts draws the button and the popup over it
// in an effect; React keeps owning the native select (value, options, disabled), and the trigger
// follows it.
export function Select(props: SelectProps) {
  const native = props.native ?? false;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (SERVER || native || !ref.current ? undefined : enhance(ref.current)), [native]);
  // The value is controlled by React: after each render the trigger is read again.
  useEffect(() => {
    if (SERVER) return;
    const select = ref.current?.querySelector("select");
    selectControlFor(select ?? null)?.sync();
  });
  return <NativeSelect {...props} native={native} wrapRef={ref} />;
}
