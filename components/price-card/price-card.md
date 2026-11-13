---
name: price-card
title: Price card and plan choice
summary: A plan's name, price, what it is for, what it includes and its call to action; and the same offers as a radio group for choosing a plan in a form.
parts: [css, react]
tool: native
states: [grid of three, featured with a flag, price with unit and label, plan choice, plan choice with one disabled, plan note, legend hidden, two text lines]
added: 0.132.0
updated: 0.136.0
source: BioScience Writers' pricing tiers (app/routes/pricing.tsx), Foxhound's pricing cards (app/routes/pricing.tsx) and ProductPricing (app/components/product-sections-cap.tsx), Foxing's paywall plans (.fx-paywall-plan in styles/account.css)
replaces:
  - 'fx-paywall-plan'
  - 'ProductPricing'
  - 'PRICING_CARDS'
---

# Price card and plan choice

**A price card** (`.cap-price-card`) is one offer: a name, the price with what it is per, a line under it, a sentence on what it is for, a checked list of what it includes and a call to action at the foot. Cards sit in `.cap-price-grid`, as many columns as fit at 14rem. `data-featured` draws the recommended one in the accent's edge, and `.cap-price-card-flag` holds its pill ("Most chosen").

**A plan choice** (`.cap-plan-choice`) is the same offers as a radio group, for choosing inside a form: each option is a card that is its own label.

## When to use it

A pricing page or section; a paywall or checkout that asks which plan.

## When not to

- **A single price in running text**: write it.
- **Comparing many features across plans**: a [table](../table/table.md).
- **A toggle between two billing periods**: a [segmented control](../segmented/segmented.md).

## The default and its reason

- **The action sits at the card's foot** (`margin-block-start: auto`), so the buttons of cards in a row line up whatever their lists' lengths.
- **The checks are drawn by CSS** with no alternative text; the list is named "Included".
- **The plan choice is radios, not buttons with `aria-pressed`.** One plan of several is a radio group (WAI-ARIA APG): arrow keys move, the choice posts with the form, and it works with no script. Foxing's paywall used pressed buttons.
- **The price is in the mono face with tabular figures, weight 600, in `--accent-text`**; a site sets `--cap-price-face`, `--cap-price-weight`, `--cap-price-color` and `--cap-price-size`. What it is per and the line under it are `--fs-detail` (`--cap-price-unit-size`, `--cap-price-label-size`), the line at weight 400 (`--cap-price-label-weight`).
- **A card is a scroll target** (`scroll-margin` clears the sticky header), so `#plan` links land on it.

## HTML contract

```html
<ul class="cap-price-grid">
  <li class="cap-price-card" id="standard" data-featured>
    <span class="cap-price-card-flag"><span class="cap-pill" data-tone="info">Most chosen</span></span>  <!-- optional -->
    <h3 class="cap-price-card-name">Standard</h3>
    <p class="cap-price-card-price"><span class="cap-price-card-amount">$0.07</span> <span class="cap-price-card-unit">/ word</span></p>
    <p class="cap-price-card-label">7 to 10 business days</p>
    <p class="cap-price-card-text">Best for manuscripts.</p>
    <p class="cap-price-card-text">A second line.</p>                         <!-- optional -->
    <ul class="cap-price-card-points" aria-label="Included"><li>...</li></ul>
    <div class="cap-price-card-action"><a class="cap-btn" data-variant="primary" href="...">Start</a></div>
  </li>
</ul>

<fieldset class="cap-plan-choice">
  <legend>Plan</legend>
  <div class="cap-plan-choice-options">
    <label class="cap-plan-option"><input type="radio" name="plan" value="monthly" checked />
      <span class="cap-plan-option-name">Monthly</span><span class="cap-plan-option-price">$5 a month</span>
      <span class="cap-plan-option-note">Save $10</span></label>  <!-- optional -->
  </div>
</fieldset>
```

The name is optional, for a card that is the page's one offer. `<legend class="cap-sr-only">` keeps the legend for screen readers and takes no room, for a choice under its own visible title.

React: `PriceCard`, `PriceGrid` and `PlanChoice` from `capsomer/react/price-card`. `PriceCard`'s `text` takes a list for more than one line; a `PlanChoice` option takes `note`, and `PlanChoice` takes `hideLegend` and `className`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to each card's action; into the plan choice, to the chosen plan |
| Arrow keys | Choose the next or previous plan |

## Accessibility

- Each card's name is a heading, so the heading list lists the plans.
- The plan choice is a `fieldset` with a `legend`; the chosen card draws a 2px accent edge, and a forced-colors outline.
- Price `--accent-text`, the rest `--muted`: in the contrast report.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
