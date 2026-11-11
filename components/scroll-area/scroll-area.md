---
name: scroll-area
title: Scroll area
summary: A box of fixed height whose content scrolls inside it, with a thin scrollbar that keeps 3:1 against its track and goes to full contrast when more is asked for. Reachable by keyboard.
parts: [css]
tool: native
states: [rest, keyboard focus, more contrast, no frame]
added: 0.93.0
updated: 0.93.0
source: Chrome's Modern Web Guidance adapt-scrollbar-to-contrast-preferences guide; WCAG 1.4.11 and 2.1.1; replaces bsw's manuscript scroll boxes (app.css .psms-scroll-box)
replaces:
  - '::-webkit-scrollbar-thumb\s*\{'
  - 'scrollbar-color:'
---

# Scroll area

```html
<div class="cap-scroll-area" tabindex="0" role="region" aria-label="Sample manuscript">…</div>
```

Import `capsomer/scroll-area.css`. `--scroll-area-max` sets the height (24rem); `data-frame="none"` drops the border and padding.

## When to use it

A long block that must sit in a fixed space beside other content: a sample excerpt, a log, a terms box in a form.

## When not to

- **The page's main content**: let the page scroll. A box inside a page is a second scroll to manage.
- **A row of cards**: a carousel, or a row with the scroll fade (`css/utilities.css`).

## The default and its reason

- **Thumb `--muted` on track `--sunken`**: at least 3:1 in every family and theme (WCAG 1.4.11), never a pale gray. Under `prefers-contrast: more`, `--text` on `--surface`.
- **`scrollbar-width: thin` and `scrollbar-gutter: stable`**: macOS ignores custom colors without a width, and draws the track only with a stable gutter. The thumb never relies on the track to be seen.
- **The old `::-webkit-scrollbar` rules only under `@supports not (scrollbar-color: auto)`**, so a browser with both does not mix them.
- **`scrollbar-color` never animates** (a WebKit bug flickers it).
- **Focusable**: `tabindex="0"` with a `role="region"` and a name, so the arrow keys scroll it (WCAG 2.1.1) and a screen reader can find it.
- **`overscroll-behavior: contain`**: reaching the end does not scroll the page behind it.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the area (skip `tabindex` only when something inside it already takes focus) |
| Arrow keys, Page Up, Page Down, Home, End | Scroll it |
