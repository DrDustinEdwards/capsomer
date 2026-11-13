---
name: draft-notice
title: Draft notice
summary: "The line at the top of a page only its author can see yet, \"Draft: only you can see this page.\", as a word in a dashed box and a sentence."
group: pattern
parts: [css, react]
tool: native
states: [default at the top of a page, other words, not a draft]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info app/routes/content-page.tsx:148, protocols.tsx:155, procedure.tsx:110 (p.procedure-draft, styles/procedure.css:65), phages.tsx:138, lab.kind.tsx:359, about.tsx:108
replaces:
  - "Draft: only you can see this page"
  - 'className="[^"]*-draft"'
---

# Draft notice

## Usage

```html
<p class="cap-draft-notice">
  <span class="cap-draft-notice-tag">Draft<span class="cap-sr-only">:</span></span>
  <span>Only you can see this page.</span>
</p>
```

## Accessibility

| Key | Does |
| --- | --- |
| None | The notice is text |

- Read as one sentence, "Draft: Only you can see this page.": the colon after the word is visually hidden.
- The word and the sentence are `--text`; the dashed edge is `--warn` at 3:1, and `CanvasText` in forced colors.
