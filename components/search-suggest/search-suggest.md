---
name: search-suggest
title: Search suggestions
summary: A site's search box that suggests pages as a person types.
parts: [css, behavior, react]
tool: own JavaScript
states: [closed, and with no script, label read but not shown, open with an option active, a long title that wraps]
added: 0.104.0
updated: 0.104.0
source: Foxing's search box (apps/web/app/components/search-box.tsx and its island islands/search-box.ts, which drew the same combobox twice)
replaces:
  - 'data-island="search-box"'
  - 'className="[^"]*\bfx-suggest\b'
  - '\.fx-suggest\s*\{'
---

# Search suggestions

## Usage

```ts
import { enhance, attachSuggest } from "capsomer/behavior/search-suggest";
enhance({
  suggest: async (q, signal) => {
    const res = await fetch(`/api/v1/search/suggest?q=${encodeURIComponent(q)}`, { signal });
    const { books } = await res.json();
    return books.map((b) => ({ label: b.title, hint: b.author, href: `/books/${b.slug}` }));
  },
});
```

```tsx
import { SearchSuggest } from "capsomer/react/search-suggest";
<SearchSuggest label="Search books and authors" labelHidden action="/search" name="q" placeholder="Search titles and authors" defaultValue={q} suggest={suggestBooks} go={(href) => navigate(href)} search={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Typing | Asks for suggestions after two letters |
| ArrowDown | Opens the list again; then moves the active option down |
| ArrowUp | Moves the active option up |
| Enter | Goes to the active suggestion; with none active, searches |
| Esc | Closes the list; once closed, clears the box |
| Tab | Leaves the box; the list closes |

- The landmark is a `search` form named by its label; the label is shown, or read and not shown with `labelHidden` where the page already makes the box plain (a hero's search with its icon).
- Options are named by their label then their hint: "A Field Guide to Ferns Rowan Hale".
- A long title wraps in the list, never cut (WCAG 1.4.12).
- Forced colors: the list's edge is `CanvasText`; the active option keeps the listbox's outline.
