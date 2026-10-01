import { useId, useRef, type ReactNode } from "react";

export interface ChipOption<V extends string> {
  value: V;
  label: ReactNode;
}

export interface FilterChipsProps<V extends string> {
  // The visible label of the group: "Status".
  label: ReactNode;
  // Up to six.
  options: Array<ChipOption<V>>;
  // Controlled: the pressed values, in any order.
  value: V[];
  // Called with the pressed values in the options' order. Keep them in the address
  // (writeParam from "capsomer/behaviour/chips" makes ?status=blocked,running).
  onChange: (value: V[]) => void;
  // What the filter leaves, in words: "3 of 14 jobs". Announced politely as it changes.
  count: ReactNode;
}

export function FilterChips<V extends string>({ label, options, value, onChange, count }: FilterChipsProps<V>) {
  const labelId = useId();
  const first = useRef<HTMLButtonElement>(null);
  if (options.length > 6) console.warn("FilterChips: chips hold at most six values; use a select or a combobox for more.");
  const pressed = new Set(value);
  const set = (next: Set<V>) => onChange(options.map((o) => o.value).filter((v) => next.has(v)));
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
        <button key={o.value} ref={i === 0 ? first : undefined} type="button" className="cap-chip" aria-pressed={pressed.has(o.value)} data-value={o.value} onClick={() => toggle(o.value)}>
          {o.label}
        </button>
      ))}
      <button type="button" className="cap-link-btn" data-cap-part="clear" hidden={pressed.size === 0} onClick={clear}>
        Clear
      </button>
      <span className="cap-chips-count" role="status">
        {count}
      </span>
    </div>
  );
}
