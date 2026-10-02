import { Fragment, useId, type HTMLAttributes, type ReactNode } from "react";
import { resultsText, type ListboxMode, type Selection } from "./listbox.ts";

export { emptyText, filterCommands, groupBy, matchesQuery, nextTypeahead, resultsText, step, stepEnabled } from "./listbox.ts";
export type { ListboxMode, Selection } from "./listbox.ts";

// The listbox's HTML contract, rendered from props. The state that changes (which option is
// active, which is chosen, what is filtered out) is the caller's React state, passed down as
// `active` and `selected`; use the pure functions above for the filtering and the stepping.
// For an input that holds focus, give it aria-activedescendant={the active option's id}.
// Nothing here sets a `style` prop, so it renders on the server under style-src 'self'.

export interface ListboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  // Name it: aria-label or aria-labelledby.
  selection?: Selection;
  mode?: ListboxMode;
  // Draws its own border and surface, for a list on its own page.
  variant?: "surface";
  // Set when something else (Base UI, your own handler) moves the highlight, so the pointer
  // does not also light the row under it.
  controlled?: boolean;
}

export function Listbox({ selection = "none", mode = "descendant", variant, controlled, className, children, ...rest }: ListboxProps) {
  return (
    <div
      tabIndex={mode === "descendant" ? 0 : undefined}
      {...rest}
      role="listbox"
      className={className ? `cap-listbox ${className}` : "cap-listbox"}
      aria-multiselectable={selection === "multi" ? true : undefined}
      data-selection={selection}
      data-mode={mode}
      data-variant={variant}
      data-controlled={controlled ? "" : undefined}
    >
      {children}
    </div>
  );
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </svg>
);

export interface OptionProps extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "id"> {
  // Required for aria-activedescendant to name it.
  id: string;
  value?: string;
  // Chosen. Leave undefined in a list where nothing is chosen (a command menu).
  selected?: boolean;
  // The current option (the one Enter acts on).
  active?: boolean;
  disabled?: boolean;
  tone?: "crit";
  // Other words that find it.
  keywords?: readonly string[];
  icon?: ReactNode;
  // A note in words, read after the label: "asks a reason".
  hint?: ReactNode;
  // Shortcut caps ["g", "o"], or any node.
  keys?: readonly string[] | ReactNode;
}

export function Option({ id, value, selected, active, disabled, tone, keywords, icon, hint, keys, className, children, ...rest }: OptionProps) {
  const caps = Array.isArray(keys) ? (keys as readonly string[]) : null;
  const hasKeys = hint != null || (caps ? caps.length > 0 : keys != null);
  return (
    <div
      {...rest}
      id={id}
      role="option"
      className={className ? `cap-option ${className}` : "cap-option"}
      aria-selected={selected === undefined ? undefined : selected}
      aria-disabled={disabled ? true : undefined}
      data-active={active ? "" : undefined}
      data-tone={tone}
      data-value={value}
      data-keywords={keywords?.length ? keywords.join(",") : undefined}
    >
      {icon != null ? <span className="cap-option-icon">{icon}</span> : null}
      <span className="cap-option-label">{children}</span>
      {hasKeys ? (
        <span className="cap-option-keys">
          {hint != null ? (
            <>
              <span className="cap-sr-only">, </span>
              <span className="cap-option-hint">{hint}</span>
            </>
          ) : null}
          {caps ? (
            <>
              <span className="cap-sr-only">, shortcut </span>
              {caps.map((cap, i) => (
                <Fragment key={`${cap}-${i}`}>
                  {i > 0 ? " " : null}
                  <kbd>{cap}</kbd>
                </Fragment>
              ))}
            </>
          ) : (
            (keys as ReactNode)
          )}
        </span>
      ) : null}
      {selected !== undefined ? (
        <span className="cap-option-indicator" aria-hidden="true">
          <Check />
        </span>
      ) : null}
    </div>
  );
}

export interface OptionGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  label: ReactNode;
}

export function OptionGroup({ label, className, children, ...rest }: OptionGroupProps) {
  const labelId = useId();
  return (
    <div {...rest} role="group" aria-labelledby={labelId} className={className ? `cap-listbox-group ${className}` : "cap-listbox-group"}>
      <div className="cap-listbox-label" id={labelId} role="presentation">
        {label}
      </div>
      {children}
    </div>
  );
}

export function ListboxSeparator() {
  return <div className="cap-listbox-separator" aria-hidden="true" />;
}

// "No results for ..." beside the list, in a status region. Takes no room while empty.
export function ListboxEmpty({ children }: { children?: ReactNode }) {
  return (
    <p className="cap-listbox-empty" role="status">
      {children}
    </p>
  );
}

// The polite live region that says the count after a filter. Visually hidden.
export function ListboxStatus({ count, filtered }: { count: number; filtered: boolean }) {
  return (
    <div className="cap-sr-only" role="status" aria-atomic="true">
      {filtered && count > 0 ? resultsText(count) : ""}
    </div>
  );
}
