---
name: feature
title: Feature blocks and cards
summary: A feature told at length with a picture, or in a card in a grid with an icon, title and line.
group: pattern
parts: [css, react]
tool: native
states: [stacked block, beside, alternating, lifted, tall preview that scrolls, card grid, card without an icon]
added: 0.132.0
source: Foxhound's FeatureBlocks (app/components/product-sections-cap.tsx), the guide's AuditScopes cards (app/components/docs/doc-widgets.tsx) and the features page's FeatureCard
replaces:
  - 'FeatureBlocks'
  - 'FeatureCard\b'
  - 'AuditScopes'
---

# Feature blocks and cards

## Usage

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
</ul>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches a tall preview's scrolling window |
| Arrow keys | Scroll that window |

- A tall preview is `role="region"` with a name and a Tab stop.
- Title `--text`, paragraph `--muted`, eyebrow `--accent-text`: in the contrast report.
