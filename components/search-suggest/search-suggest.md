---
name: search-suggest
title: Search suggestions
summary: A site's search box that suggests pages as a person types. The search field's GET form still searches, with no script too; a suggestion is a page to go to. Focus stays in the box while the arrows move through the list.
parts: [css, behavior, react]
tool: own JavaScript
states: [closed, and with no script, label read but not shown, open with an option active, a long title that wraps]
added: 0.103.0
updated: 0.103.0
source: Foxing's search box (apps/web/app/components/search-box.tsx and its island islands/search-box.ts, which drew the same combobox twice)
replaces:
  - 'data-island="search-box"'
  - 'className="[^"]*\bfx-suggest\b'
  - '\.fx-suggest\s*\{'
---

# Search suggestions

The search field (`.cap-search`, field.css) with a list of pages under it as a person types: the books whose titles or authors match, the posts whose titles do. Import `capsomer/field.css`, `capsomer/listbox.css` and `capsomer/search-suggest.css`.

## When to use it

A site's own search box, where most searches are for one page the site already knows by name.

## When not to

- **Choosing a value for a form** (a book for a list, a reviewer): the combobox, where only a listed value can be chosen.
- **Commands from the keyboard**: the command menu.
- **A filter that answers as it is typed in**, with no results page: the search field on its own.

## The default and its reason

- **The form is the search.** Enter with no suggestion chosen submits the GET form to the results page, so the box works before the script loads and without it. A suggestion is a destination: Enter on it, or a click, goes there.
- **The field becomes a combobox only once it can suggest** (WAI-ARIA APG, list autocomplete): the module adds `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded` and `aria-controls`. With no script it stays a plain search box, so nothing claims a popup that cannot open.
- **Focus stays in the box.** The arrows move the active option, named by `aria-activedescendant`; the list is the shared listbox (listbox.ts, input mode), so its keys and look are the command menu's and the select's.
- **Suggestions wait for typing.** They are asked 180 ms (`delay`) after the last key once two letters (`min`) are typed, never for the query a results page opened with. A newer key aborts the older request, so an answer never lands out of order. A failed request suggests nothing: the form still searches.
- **A count in a status region** ("5 suggestions") tells a screen reader the list changed.
- **Esc closes the list first**; with the list closed, Esc clears the box, as the search field does.
- **No top layer.** The list sits under the box in the page, as wide as the box, so it scrolls with it and needs no popover positioning.

## Keyboard

| Key | Does |
| --- | --- |
| Typing | Asks for suggestions after two letters |
| ArrowDown | Opens the list again; then moves the active option down |
| ArrowUp | Moves the active option up |
| Enter | Goes to the active suggestion; with none active, searches |
| Esc | Closes the list; once closed, clears the box |
| Tab | Leaves the box; the list closes |

## Accessibility

- The landmark is a `search` form named by its label; the label is shown, or read and not shown with `labelHidden` where the page already makes the box plain (a hero's search with its icon).
- Options are named by their label then their hint: "A Field Guide to Ferns Rowan Hale".
- A long title wraps in the list, never cut (WCAG 1.4.12).
- Forced colors: the list's edge is `CanvasText`; the active option keeps the listbox's outline.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

The search field's own markup inside `div.cap-search-suggest[data-cap="search-suggest"]`; the module adds the list and the status region at its end.

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

`attachSuggest(root, options)` wires one root and returns a function that detaches, for an island that starts per element. Options: `suggest(query, signal)` (required, returns `{ label, hint?, href }[]`), `go(href)` (a full page load by default), `search(query)` (runs the search in place of the form's submit), `delay` (180), `min` (2), `announce(count)`.

In React:

```tsx
import { SearchSuggest } from "capsomer/react/search-suggest";
<SearchSuggest label="Search books and authors" labelHidden action="/search" name="q" placeholder="Search titles and authors" defaultValue={q} suggest={suggestBooks} go={(href) => navigate(href)} search={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
```

It takes the search field's props (`label`, `labelHidden`, `help`, `landmark`, the input's attributes) with `defaultValue` in place of `value`, and `rootClassName` for the site's own tokens on the root. React draws the field and an empty list; the module fills the list, which React never renders into.

## Exceptions in production

None yet.
