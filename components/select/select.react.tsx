import { useEffect, useId, useRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { enhance, selectControlFor } from "./select.ts";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectGroupOption {
  group: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style" | "children" | "className" | "size"> {
  // Options and groups: the same list the native select holds. Plain strings are fine for the label.
  options: Array<SelectOption | SelectGroupOption>;
  size?: "sm" | "default";
  // Keep the browser's own select (no popup), as on a phone.
  native?: boolean;
}

// Renders the HTML contract in select.md: the wrapper, with a real native select holding every
// option, so it server-renders. select.ts draws the button and the popup over it in an effect;
// React keeps owning the native select (value, options, disabled), and the trigger follows it.
export function Select(props: SelectProps) {
  const { options, size = "default", native = false, id, ...rest } = props;
  const own = useId();
  const ref = useRef<HTMLDivElement>(null);
  const selectId = id ?? own;
  useEffect(() => (native || !ref.current ? undefined : enhance(ref.current)), [native]);
  // The value is controlled by React: after each render the trigger is read again.
  useEffect(() => {
    const select = ref.current?.querySelector("select");
    selectControlFor(select ?? null)?.sync();
  });
  const opt = (o: SelectOption) => (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
  return (
    <div className="cap-select-wrap" data-cap="select" data-native={native ? "" : undefined} ref={ref}>
      <select {...rest} id={selectId} className="cap-select" data-size={size === "default" ? undefined : size}>
        {options.map((o) =>
          "group" in o ? (
            <optgroup key={o.group} label={o.group}>
              {o.options.map(opt)}
            </optgroup>
          ) : (
            opt(o)
          ),
        )}
      </select>
    </div>
  );
}
