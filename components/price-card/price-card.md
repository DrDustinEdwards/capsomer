---
name: price-card
title: Price card and plan choice
summary: A plan's name, price, purpose, inclusions and call to action, or the offers as a radio group.
group: pattern
parts: [css, react]
tool: native
states: [grid of three, featured with a flag, price with unit and label, plan choice, plan choice with one disabled]
added: 0.132.0
source: BioScience Writers' pricing tiers (app/routes/pricing.tsx), Foxhound's pricing cards (app/routes/pricing.tsx) and ProductPricing (app/components/product-sections-cap.tsx), Foxing's paywall plans (.fx-paywall-plan in styles/account.css)
replaces:
  - 'fx-paywall-plan'
  - 'ProductPricing'
  - 'PRICING_CARDS'
---

# Price card and plan choice

## Usage

```html
<ul class="cap-price-grid">
  <li class="cap-price-card" id="standard" data-featured>
    <span class="cap-price-card-flag"><span class="cap-pill" data-tone="info">Most chosen</span></span>  <!-- optional -->
    <h3 class="cap-price-card-name">Standard</h3>
    <p class="cap-price-card-price"><span class="cap-price-card-amount">$0.07</span> <span class="cap-price-card-unit">/ word</span></p>
    <p class="cap-price-card-label">7 to 10 business days</p>
    <p class="cap-price-card-text">Best for manuscripts.</p>
    <ul class="cap-price-card-points" aria-label="Included"><li>...</li></ul>
    <div class="cap-price-card-action"><a class="cap-btn" data-variant="primary" href="...">Start</a></div>
  </li>
</ul>

<fieldset class="cap-plan-choice">
  <legend>Plan</legend>
  <div class="cap-plan-choice-options">
    <label class="cap-plan-option"><input type="radio" name="plan" value="monthly" checked />
      <span class="cap-plan-option-name">Monthly</span><span class="cap-plan-option-price">$5 a month</span></label>
  </div>
</fieldset>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to each card's action; into the plan choice, to the chosen plan |
| Arrow keys | Choose the next or previous plan |

- Each card's name is a heading, so the heading list lists the plans.
- The plan choice is a `fieldset` with a `legend`; the chosen card draws a 2px accent edge, and a forced-colors outline.
- Price `--accent-text`, the rest `--muted`: in the contrast report.
