---
name: hero
title: Hero
summary: A landing page's first section, with eyebrow, h1, lead, actions, a note and an aside.
group: pattern
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

## Usage

```html
<section class="cap-hero" aria-labelledby="h" data-aside>
  <div class="cap-hero-text"><p class="cap-eyebrow" data-tone="accent">Release notes</p><h1 id="h" class="cap-hero-title">Every change, written down once</h1>
    <p class="cap-hero-lead">...</p><div class="cap-hero-actions">[button links]</div><p class="cap-hero-note">...</p></div>
  <div class="cap-hero-aside">[card or picture]</div>
</section>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Through the actions |

- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
