---
name: scroll-area
title: Scroll area
summary: A box of fixed height whose content scrolls inside it, with a thin scrollbar that keeps 3:1 against its track and goes to full contrast when more is asked for.
parts: [css]
tool: native
states: [rest, keyboard focus, more contrast, no frame]
added: 0.99.0
updated: 0.99.0
source: Chrome's Modern Web Guidance adapt-scrollbar-to-contrast-preferences guide; WCAG 1.4.11 and 2.1.1; replaces bsw's manuscript scroll boxes (app.css .psms-scroll-box)
replaces:
  - '::-webkit-scrollbar-thumb\s*\{'
  - 'scrollbar-color:'
---

# Scroll area

## Usage

```html
<div class="cap-scroll-area" tabindex="0" role="region" aria-label="Sample manuscript">…</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the area (skip `tabindex` only when something inside it already takes focus) |
| Arrow keys, Page Up, Page Down, Home, End | Scroll it |
