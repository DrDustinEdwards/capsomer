---
name: trusted-html
title: Trusted HTML and rich text
summary: The one Trusted Types policy Capsomer's scripts use, and RichText, which renders stored, already sanitized HTML through it, with the reading measure as an option.
group: primitive
parts: [css, behavior, react]
tool: own JavaScript
states: [stored statement kept to the measure, titles inside a line, an empty title with its fallback, a paragraph with the page's class]
added: 0.79.3
updated: 0.98.0
source: Capsomer's own scripts (0.79.3, trusted-html.ts); RichText from txasm, 28 dangerouslySetInnerHTML of stored sanitized HTML in 20 files (routes/meetings.$slug.abstracts.$ref.tsx, awards.$slug.tsx, review.$assignmentId.tsx and the rest) and routes/accessibility.tsx's inline maxWidth 65ch
replaces:
  - "dangerouslySetInnerHTML=\\{\\{\\s*__html:\\s*(?!jsonLdText)"
  - "style=\\{\\{\\s*maxWidth:\\s*\"65ch\""
---

# Trusted HTML and rich text

## Usage

```html
<div class="cap-rich-text" data-measure="text"><p>Stored, sanitized HTML.</p></div>
<span class="cap-rich-text">Field notes on <em>Quercus alba</em></span>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through links in the stored HTML, as any link |

- The stored HTML keeps its own structure (paragraphs, lists, `em`, `abbr`); RichText adds no role.
- It takes the text color and links of where it sits; the fallback a site passes (`.cap-muted`) is 4.5:1.
