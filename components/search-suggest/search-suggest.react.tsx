import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { SearchField } from "../field/field.react.tsx";
import { attachSuggest, type SuggestOptions } from "./search-suggest.ts";

export type { Suggestion, SuggestOptions } from "./search-suggest.ts";

export type SearchSuggestProps = Omit<
  ComponentProps<typeof SearchField>,
  "value" | "onChange" | "action"
> &
  Pick<SuggestOptions, "suggest" | "go" | "search" | "delay" | "min"> & {
    // Where the search runs with no script, and the form's GET target: "/search".
    action: string;
    // The text the box opens with (the query a results page shows). Suggestions start only once
    // the person types.
    defaultValue?: string;
    // A class of the site's own on the root, for its tokens (a taller box).
    rootClassName?: string;
  };

// A site's search box that suggests pages as a person types: Capsomer's search field (a GET form
// with role="search", so it searches with no script) wired by the behavior module, the one copy of
// the combobox's keys. React draws the field and an empty list; the module fills the list, which
// React never renders into.
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
    if (!el) return;
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
