import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { SearchField } from "../field/field.react.tsx";
import { attachSuggest, type SuggestOptions } from "./search-suggest.ts";

export type { Suggestion, SuggestOptions } from "./search-suggest.ts";

// A server build (Vite sets import.meta.env.SSR) drops search-suggest.ts: the effect that wires it
// never runs there.
const SERVER = (import.meta as { env?: { SSR?: boolean } }).env?.SSR;

export type SearchSuggestProps = Omit<
  ComponentProps<typeof SearchField>,
  "value" | "onChange" | "action"
> &
  Pick<SuggestOptions, "suggest" | "go" | "search" | "delay" | "min"> & {
    action: string;
    defaultValue?: string;
    rootClassName?: string;
  };

export function SearchSuggest({
  suggest,
  go,
  search,
  delay,
  min,
  defaultValue = "",
  rootClassName,
  ...field
}: SearchSuggestProps) {
  const [value, setValue] = useState(defaultValue);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  // The latest callbacks, so a new function each render does not re-wire the field.
  const latest = useRef({ suggest, go, search });
  useEffect(() => {
    latest.current = { suggest, go, search };
  });

  useEffect(() => {
    const el = root.current;
    if (SERVER || !el) return;
    return attachSuggest(el, {
      suggest: (q, signal) => latest.current.suggest(q, signal),
      go: (href) => (latest.current.go ? latest.current.go(href) : location.assign(href)),
      search: latest.current.search ? (q) => latest.current.search?.(q) : undefined,
      delay,
      min,
    });
  }, [delay, min]);

  return (
    <div
      ref={root}
      className={rootClassName ? `cap-search-suggest ${rootClassName}` : "cap-search-suggest"}
    >
      <SearchField {...field} value={value} onChange={setValue} />
      <div
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        className="cap-listbox cap-search-suggest-list"
        data-variant="surface"
        hidden
      />
    </div>
  );
}
