import { useId, useRef, type ReactNode } from "react";

export interface ChipOption<V extends string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

export interface FilterChipsProps<V extends string> {
  // The visible label of the group: "Status".
  label: ReactNode;
  // Up to six.
  options: Array<ChipOption<V>>;
  // Controlled: the pressed values, in any order.
  value: V[];
  // Called with the pressed values in the options' order. Keep them in the address
  // (writeParam from "capsomer/behavior/chips" makes ?status=blocked,running).
  onChange: (value: V[]) => void;
  // What the filter leaves, in words: "3 of 14 jobs". Announced politely as it changes.
  count: ReactNode;
  size?: "sm" | "default" | "lg";
}

export function FilterChips<V extends string>({
  label,
  options,
  value,
  onChange,
  count,
  size = "default",
}: FilterChipsProps<V>) {
  const labelId = useId();
  const first = useRef<HTMLButtonElement>(null);
  if (options.length > 6)
    console.warn(
      "FilterChips: chips hold at most six values; use a select or a combobox for more.",
    );
  const pressed = new Set(value);
  // A pressed value that no option carries (from a shared address) still shows, pressed,
  // after the options, so a filter is never active without a chip to say so and release it.
  const known = new Set(options.map((o) => o.value));
  const extra = value.filter((v) => !known.has(v));
  const set = (next: Set<V>) =>
    onChange([...options.map((o) => o.value), ...extra].filter((v) => next.has(v)));
  const toggle = (v: V) => {
    const next = new Set(pressed);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    set(next);
  };
  const clear = () => {
    set(new Set());
    // Clear hides itself; focus goes to the first chip rather than being lost.
    first.current?.focus();
  };

  return (
    <div className="cap-chips" role="group" aria-labelledby={labelId}>
      <span className="cap-chips-label" id={labelId}>
        {label}
      </span>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={i === 0 ? first : undefined}
          type="button"
          className="cap-chip"
          data-size={size === "default" ? undefined : size}
          aria-pressed={pressed.has(o.value)}
          aria-disabled={o.disabled || undefined}
          data-value={o.value}
          onClick={() => (o.disabled ? undefined : toggle(o.value))}
        >
          {o.label}
        </button>
      ))}
      {extra.map((v) => (
        <button
          key={v}
          type="button"
          className="cap-chip"
          aria-pressed="true"
          data-value={v}
          onClick={() => toggle(v)}
        >
          {v}
        </button>
      ))}
      <button
        type="button"
        className="cap-link-btn"
        data-cap-part="clear"
        hidden={pressed.size === 0}
        onClick={clear}
      >
        Clear
      </button>
      <span className="cap-chips-count" role="status">
        {count}
      </span>
    </div>
  );
}

export interface LinkChip {
  // The address with this filter applied (or released, for the current one).
  href: string;
  label: ReactNode;
  // How many items this filter leaves, shown after the label.
  count?: number;
  current?: boolean;
}

// Filters kept in the address, as links (no script needed): a labeled list of link chips, the
// current one marked aria-current="true" and drawn pressed, each with an optional count.
// `renderLink` draws a router link (capsomer/react/link Link); a plain a otherwise.
export function LinkChips({
  label,
  showLabel = false,
  chips,
  size = "default",
  renderLink,
}: {
  label: string;
  // Show the label before the chips (as FilterChips does); it then names the nav.
  showLabel?: boolean;
  chips: readonly LinkChip[];
  size?: "sm" | "default" | "lg";
  renderLink?: (props: {
    href: string;
    className: string;
    "aria-current"?: "true";
    "data-size"?: string;
    children: ReactNode;
  }) => ReactNode;
}) {
  const labelId = useId();
  return (
    <nav
      aria-label={showLabel ? undefined : label}
      aria-labelledby={showLabel ? labelId : undefined}
      className={showLabel ? "cap-chips" : undefined}
    >
      {showLabel ? (
        <span className="cap-chips-label" id={labelId}>
          {label}
        </span>
      ) : null}
      <ul className="cap-chips">
        {chips.map((c) => {
          const props = {
            href: c.href,
            className: "cap-chip",
            "aria-current": c.current ? ("true" as const) : undefined,
            "data-size": size === "default" ? undefined : size,
            children: (
              <>
                {c.label}
                {c.count === undefined ? null : <span className="cap-chip-count">{c.count}</span>}
              </>
            ),
          };
          return (
            <li key={c.href}>
              {renderLink ? (
                renderLink(props)
              ) : (
                <a
                  href={props.href}
                  className={props.className}
                  aria-current={props["aria-current"]}
                  data-size={props["data-size"]}
                >
                  {props.children}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// A faceted filter that works with no script: checkbox chips inside the site's GET form, each
// sending `name=value`, with an optional count. The fieldset's legend names the group.
export function CheckChips({
  legend,
  name,
  options,
  checked,
  size = "default",
}: {
  legend: ReactNode;
  name: string;
  options: ReadonlyArray<{ value: string; label: ReactNode; count?: number; disabled?: boolean }>;
  // The values checked now (from the address).
  checked: readonly string[];
  size?: "sm" | "default" | "lg";
}) {
  const on = new Set(checked);
  return (
    <fieldset className="cap-chips cap-chips-set">
      <legend className="cap-chips-label">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="cap-chip" data-size={size === "default" ? undefined : size}>
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={on.has(o.value)}
            disabled={o.disabled}
          />
          {o.label}
          {o.count === undefined ? null : <span className="cap-chip-count">{o.count}</span>}
        </label>
      ))}
    </fieldset>
  );
}
