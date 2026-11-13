---
name: hero
title: Hero
summary: A landing page's first section - eyebrow, the page's h1, a lead, the actions and a note, with an aside beside them and an optional decorative layer. Structure is shared; each site's look is its tokens.
parts: [css, react]
tool: native
states: [words and an aside, centered, on a card over a backdrop]
added: 0.125.0
updated: 0.125.0
source: Carrel www/site.css .hero, julieedwards.info .hero, Capsid explorer .hero, Foxing .fx-hero, BioScience Writers home and PageHero, Foxhound product hero
replaces:
  - 'class(Name)?="(fx-)?hero[ "]'
---

# Hero

## What it is for

The first screen of a landing page: what the product is and the one thing to do next.

## When to use it

Once, at the top of a home or product page.

## When not to

Any other page: the page head (`page-head`) names a page; a band of actions at the end is the call to action band.

## The default and its reason

- **A section named by its h1**, with the actions as button links (`ButtonLink`), the first primary.
- **The aside moves beside the words where the section is 56rem wide** (a container query), under them before, so it works in any column.
- **The backdrop is decoration**: `aria-hidden`, behind everything, gone in forced colors.
- **The card** (`card`) is a raised surface with a blur over the backdrop; with `prefers-reduced-transparency` it is solid.
- **Look comes from tokens**, not classes, so a site outside dustinedwards.info keeps its own design. Each defaults to the look shown here: the title's `--hero-title` (size), `--hero-face`, `--hero-title-weight` (`--weight-title`), `--hero-title-leading` (1.05) and `--hero-title-tracking` (-0.02em); the lead's `--hero-lead-face`, `--hero-lead-size` (1.25rem), `--hero-lead-weight` (400) and `--hero-lead-leading` (1.5); `--hero-gap`; the card's `--hero-card-bg`, `--hero-card-pad` (`--space-7`), `--hero-card-radius` (`--radius-xl`), `--hero-card-blur` (12px), `--hero-card-shadow` (none) and `--hero-card-max` (48rem). The eyebrow is the eyebrow component in the accent tone.

## Options

- `children` sit between the lead and the actions, in body type: further paragraphs (BioScience Writers' home), a price line (Foxhound's product pages). A lead that names the page for voice assistants can carry its own class on a span inside `lead`.
- `id` names the section for a "back to top" link (julieedwards.info).

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Through the actions |

## Accessibility

- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<section class="cap-hero" aria-labelledby="h" data-aside>
  <div class="cap-hero-text"><p class="cap-eyebrow" data-tone="accent">Release notes</p><h1 id="h" class="cap-hero-title">Every change, written down once</h1>
    <p class="cap-hero-lead">...</p><div class="cap-hero-actions">[button links]</div><p class="cap-hero-note">...</p></div>
  <div class="cap-hero-aside">[card or picture]</div>
</section>
```

## Exceptions in production

None yet.
