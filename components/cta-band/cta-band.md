---
name: cta-band
title: Call to action band
summary: A page's closing call to action, with a heading, one sentence and actions in a band.
group: pattern
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

## Usage

```html
<section class="cap-cta-band" aria-labelledby="c"><p class="cap-eyebrow" data-tone="accent">Start here</p><h2 id="c" class="cap-cta-band-title">Ready to write it down?</h2>
  <p class="cap-cta-band-text">Set up a notebook in two minutes.</p><div class="cap-cta-band-actions">[button links]</div>
  <p class="cap-cta-band-note">Apps for phones are coming.</p></section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Through the actions |

- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
