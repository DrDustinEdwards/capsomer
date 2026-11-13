---
name: eyebrow
title: Eyebrow
summary: The small uppercase label over a block or a section, in the interface face or the mono face.
parts: [css, react]
tool: native
states: [muted, accent, mono, mono accent, as a section heading]
added: 0.132.0
source: Foxhound's Eyebrow (app/routes/oauth/authorize.tsx) and its 31 `font-mono text-micro uppercase` groups; dei's mono-caps label rules (styles/post-head-blocks.css, prose.css); Foxing's cap-label font groups (styles/admin.css, social.css)
replaces:
  - 'font-mono text-micro uppercase'
  - 'function Eyebrow'
  - 'text-micro font-medium uppercase tracking-widest'
---

# Eyebrow

## Usage

```html
<p class="cap-eyebrow" data-variant="mono" data-tone="accent">Recovery</p>
```

## Accessibility

Nothing to operate.

- Uppercase is CSS, so a screen reader reads the words as written, not letter by letter.
- `--muted` and `--accent-text` at 11px reach 4.5:1 in both themes (contrast report).
