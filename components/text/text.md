---
name: text
title: Text and Title
summary: React Title and Text for the text roles and title sizes, so a page does not repeat the class and data attributes on every line.
parts: [react]
tool: native
states: []
added: 0.147.0
updated: 0.147.0
source: txasm (46 `cap-title` size 2, 46 `cap-text cap-muted` small and 130 more runs of the same attributes in its server bundle, which put its Worker 5.8 KiB over its size budget)
replaces:
  - 'className="cap-title"'
  - 'className="cap-text( [a-z-]+)*"'
---

# Text and Title

`Title` and `Text` from `capsomer/react/text` render the `.cap-title` and `.cap-text` roles from `capsomer/text.css`. They exist for the server bundle: a page of React that spells `className="cap-text" data-size="small" data-tone="muted"` on every line carries that string in its bundle each time, and a component carries it once.

## HTML contract

```html
<h2 class="cap-title" data-size="2">Abstracts</h2>
<p class="cap-text" data-size="small" data-tone="muted">Submitted by the author.</p>
```

## Props

| Component | Props |
| --- | --- |
| `Title` | `size` 1 to 6 (4 when omitted; the look), `as` (any element; `h2` when omitted; the heading level is the outline, set it), `className`, `id` |
| `Text` | `size` (`tiny`, `small`, `lead`), `tone` (`muted`, `dim`, `ink`, `accent`, `ok`, `crit`), `weight` (`strong`), `face`, `align` (`center`, `end`), `as` (any element; `p` when omitted), `className`, `id` |

The element's own props (a `ref`, `tabIndex`, `htmlFor`, `scope`, an aria attribute, a handler) reach the element.

## When not to

- **A heading a component owns** (a card's, a dialog's): the component sets it.
- **A label for a field**: the field's own label.

## Accessibility

The element is yours to choose and stays in the document outline: `Title` renders an `h2` by default and `size` changes only the look, so an `h1` that looks like a 2 is `<Title as="h1" size={2}>`. Tones keep their contrast on every surface (contrast report).
