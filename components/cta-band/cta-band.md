---
name: cta-band
title: Call to action band
summary: A page's closing call to action - a heading, one sentence and the actions in a band set apart from the page.
parts: [css, react]
tool: native
states: [band, quiet]
added: 0.125.0
updated: 0.125.0
source: Foxing .fx-cta, BioScience Writers' closing "ready to ..." blocks on nine service pages, Foxhound's product and pricing closing band
replaces:
  - 'fx-cta'
---

# Call to action band

## What it is for

The end of a marketing or service page: one heading, one sentence, one or two actions.

## When to use it

Once, at the end of a page that asks the reader to do something.

## When not to

The top of the page: the hero. An action inside a form: a button.

## The default and its reason

- **A section named by its heading**, so it is a region a screen reader lists.
- **A tinted band with the accent's edge**, the edge carrying it in forced colors; `quiet` is a rule above and no fill, for a page that already has many panels.
- **Look comes from tokens** (`--cta-band-bg`).
- **`eyebrow` and `note`** are optional small lines above the heading and under the actions (Foxing's "Start reading" and its apps note).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the actions |

## Accessibility

- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-cta-band" aria-labelledby="c"><p class="cap-cta-band-eyebrow">Start here</p><h2 id="c" class="cap-cta-band-title">Ready to write it down?</h2>
  <p class="cap-cta-band-text">Set up a notebook in two minutes.</p><div class="cap-cta-band-actions">[button links]</div>
  <p class="cap-cta-band-note">Apps for phones are coming.</p></section>
```

## Exceptions in production

None yet.
