import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { SearchField } from "../field/field.react.js";
import { attachSuggest } from "./search-suggest.js";
// A site's search box that suggests pages as a person types: Capsomer's search field (a GET form
// with role="search", so it searches with no script) wired by the behavior module, the one copy of
// the combobox's keys. React draws the field and an empty list; the module fills the list, which
// React never renders into.
export function SearchSuggest({ suggest, go, search, delay, min, defaultValue = "", rootClassName, ...field }) {
    const [value, setValue] = useState(defaultValue);
    const root = useRef(null);
    const listId = useId();
    // The latest callbacks, so a new function each render does not re-wire the field.
    const latest = useRef({ suggest, go, search });
    useEffect(() => {
        latest.current = { suggest, go, search };
    });
    useEffect(() => {
        const el = root.current;
        if (!el)
            return;
        return attachSuggest(el, {
            suggest: (q, signal) => latest.current.suggest(q, signal),
            go: (href) => (latest.current.go ? latest.current.go(href) : location.assign(href)),
            search: latest.current.search ? (q) => latest.current.search?.(q) : undefined,
            delay,
            min,
        });
    }, [delay, min]);
    return (_jsxs("div", { ref: root, className: rootClassName ? `cap-search-suggest ${rootClassName}` : "cap-search-suggest", children: [_jsx(SearchField, { ...field, value: value, onChange: setValue }), _jsx("div", { id: listId, role: "listbox", "aria-label": "Suggestions", className: "cap-listbox cap-search-suggest-list", "data-variant": "surface", hidden: true })] }));
}
