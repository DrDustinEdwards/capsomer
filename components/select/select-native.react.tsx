import { useId, type ReactNode, type Ref, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}
export interface SelectGroupOption {
  group: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "style" | "children" | "className" | "size"
> {
  // Options and groups: the same list the native select holds. Plain strings are fine for the label.
  options: Array<SelectOption | SelectGroupOption>;
  size?: "sm" | "default";
  // Keep the browser's own select (no popup), as on a phone.
  native?: boolean;
}

// The HTML contract in select.md without select.ts: the wrapper and a real native select holding
// every option, so it server-renders. `Select` adds the button and popup over it; a caller that
// only ever wants the browser's select (RatingInput) uses this and leaves select.ts out of its
// bundle.
export function NativeSelect(props: SelectProps & { wrapRef?: Ref<HTMLDivElement> }) {
  const { options, size = "default", native = true, id, wrapRef, ...rest } = props;
  const own = useId();
  const opt = (o: SelectOption) => (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
  return (
    <div
      className="cap-select-wrap"
      data-cap="select"
      data-native={native ? "" : undefined}
      ref={wrapRef}
    >
      <select
        {...rest}
        id={id ?? own}
        className="cap-select"
        data-size={size === "default" ? undefined : size}
      >
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
