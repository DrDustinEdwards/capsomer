---
name: eyebrow
title: Eyebrow
summary: The small uppercase label over a block or a section, in the interface face or the mono face.
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

A short uppercase label over the thing it names: a feature's topic, a section of a page, a field group in a preview. `data-variant="mono"` sets it in the mono face; `data-tone="accent"` in the accent's text color.

## When to use it

Over a title, to name its topic in a word or two; as a section's own heading when the section is small (a preview's "Recovery queue").

## When not to

- **A field's label**: the field's own `label`.
- **A status**: a [pill](../status/status.md).
- **A sentence**: an eyebrow is one to three words.

## The default and its reason

- **`--fs-label` (11 to 12px), weight 600, tracked 0.1em**: small caps need the tracking to stay legible. Mono takes weight 500 and 0.06em. A site sets its own with `--cap-eyebrow-size`, `--cap-eyebrow-weight` and `--cap-eyebrow-tracking` (dustinedwards.info's entry sets 0.08em).
- **Muted by default** (`--cap-eyebrow-color`), accent when it leads a feature block; `data-tone="dim"` for a quieter one (an archived group), `"text"` for the text color.
- **A `p` by default.** When the eyebrow is the only heading a section has, render it as `h2` or `h3` (`as`) so the heading list finds it.

## HTML contract

```html
<p class="cap-eyebrow" data-variant="mono" data-tone="accent">Recovery</p>
```

The utility `.cap-label` takes `data-variant="mono"` too.

React: `Eyebrow` from `capsomer/react/eyebrow` takes `variant`, `tone`, `as` and `className`.

## Keyboard

Nothing to operate.

## Accessibility

- Uppercase is CSS, so a screen reader reads the words as written, not letter by letter.
- `--muted`, `--dim` and `--accent-text` at 11px reach 4.5:1 in both themes (contrast report).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
