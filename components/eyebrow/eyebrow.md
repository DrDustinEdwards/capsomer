---
name: eyebrow
title: Eyebrow
summary: A small uppercase label that carries a fact about a block, never a kicker over a heading.
parts: [css, react]
tool: native
states: [muted, dim, accent, text, mono, mono accent, as a section heading]
added: 0.132.0
updated: 0.142.0
source: Foxhound's Eyebrow (app/routes/oauth/authorize.tsx) and its 31 `font-mono text-micro uppercase` groups; dei's mono-caps label rules (styles/post-head-blocks.css, prose.css); Foxing's cap-label font groups (styles/admin.css, social.css)
replaces:
  - 'font-mono text-micro uppercase'
  - 'function Eyebrow'
  - 'text-micro font-medium uppercase tracking-widest'
---

# Eyebrow

## Usage

```html
<!-- A fact the block needs said: "Sample data", "Account" over the consent permissions. Never a tag line over a heading. -->
<p class="cap-eyebrow" data-variant="mono" data-tone="accent">Sample data</p>
```

## Accessibility

Nothing to operate.

- Uppercase is CSS, so a screen reader reads the words as written, not letter by letter.
- `--muted` and `--accent-text` at 11px reach 4.5:1 in both themes (contrast report).
