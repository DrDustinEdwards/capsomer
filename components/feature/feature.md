---
name: feature
title: Feature blocks and cards
summary: A feature told at length (eyebrow, title, paragraph and a picture of it working) or in a card in a grid (icon, title, line).
parts: [css, react]
tool: native
states: [stacked block, beside, alternating, lifted, tall preview that scrolls, card grid, card without an icon, card with a tag]
added: 0.132.0
updated: 0.142.0
source: Foxhound's FeatureBlocks (app/components/product-sections-cap.tsx), the guide's AuditScopes cards (app/components/docs/doc-widgets.tsx) and the features page's FeatureCard
replaces:
  - 'FeatureBlocks'
  - 'FeatureCard\b'
  - 'AuditScopes'
---

# Feature blocks and cards

**A block** (`.cap-feature`) tells one feature at length: an [eyebrow](../eyebrow/eyebrow.md), a title, a paragraph, and a bordered picture of the feature working. Stacked, the text is centered over the picture; `beside`, they sit side by side once the `.cap-features` stack around them is 48rem wide (a container query: a beside block always sits in a stack, even alone). Blocks in `.cap-features[data-alternate]` swap sides each time. `lifted` raises one block on its own card.

**A card** (`.cap-feature-card`) is one feature in a grid (`.cap-feature-grid`): an icon, a title and a line, as many columns as fit at 16rem each.

## When to use it

A product or landing page; a guide page that names what something covers.

## When not to

- **Steps in an order**: [steps](../process/process.md).
- **A number with a label**: the [stat tile](../stat-tile/stat-tile.md).
- **A card that links somewhere**: a post or catalog card.

## The default and its reason

- **The picture has no padding of its own**, so a preview (a table, a queue) sets its own and fills the border.
- **A tall picture scrolls in a 30rem window** (`--cap-feature-scroll-h`), a named region with `tabindex="0"`, so a keyboard can scroll it (WCAG 2.1.1).
- **Icons are decoration** (`aria-hidden`): the title names the feature.

## HTML contract

```html
<div class="cap-features" data-alternate>
  <div class="cap-feature" data-layout="beside">        <!-- data-variant="lifted", data-align="start" -->
    <div class="cap-feature-text">
      <p class="cap-eyebrow" data-tone="accent">Recovery</p>
      <h3 class="cap-feature-title">Title</h3>
      <p class="cap-feature-body">Paragraph.</p>
    </div>
    <div class="cap-feature-media">
      <div class="cap-feature-scroll" role="region" aria-label="Sample queue" tabindex="0">[preview]</div>  <!-- tall only -->
    </div>
  </div>
</div>

<ul class="cap-feature-grid">
  <li class="cap-feature-card">
    <span class="cap-feature-card-icon" aria-hidden="true"><svg>...</svg></span>
    <h3 class="cap-feature-card-title">Failed invoices</h3>
    <p class="cap-feature-card-text">One line.</p>
  </li>
  <li class="cap-feature-card">                       <!-- a tag at the end of the title's line -->
    <div class="cap-feature-card-head"><h3 class="cap-feature-card-title">Retry schedule</h3><span class="cap-feature-card-tag"><span class="cap-pill">Recovery</span></span></div>
    <p class="cap-feature-card-text">One line.</p>
  </li>
</ul>
```

A card item takes `tag` (the head and its tag are drawn for you) and `attributes`, the site's own `data-*` attributes on the `li` (a filter's hooks).

React: `FeatureBlock`, `Features`, `FeatureGrid` and `FeatureCard` from `capsomer/react/feature`. Load `feature.css` and `eyebrow.css`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches a tall preview's scrolling window |
| Arrow keys | Scroll that window |

## Accessibility

- A tall preview is `role="region"` with a name and a Tab stop.
- Title `--text`, paragraph `--muted`, eyebrow `--accent-text`: in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
