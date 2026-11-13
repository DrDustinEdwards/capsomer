---
name: range-slider
title: Range slider
summary: A two-handle range on one track with the span filled, for a filter like amount from and to.
parts: [css, behavior, react]
tool: own JavaScript
states: [full range, a chosen span, a handle under the pointer, open top (and more)]
added: 0.94.0
source: Foxhound's DualRangeSlider (app/components/dual-range-slider.tsx, .dual-range-input in app.css; Recova's AmountRangeSlider)
replaces:
  - 'dual-range-input'
  - 'function DualRangeSlider'
---

# Range slider

## Usage

```html
<div class="cap-range-slider" data-cap="range-slider" data-currency="USD" data-cents data-open-top role="group" aria-labelledby="amount-l">
  <div class="cap-range-slider-head">
    <span class="cap-range-slider-label" id="amount-l">Amount</span>
    <output class="cap-range-slider-value" aria-hidden="true">$0 – $500+</output>
  </div>
  <div class="cap-range-slider-track">
    <input type="range" class="cap-range cap-range-slider-input" name="amountMin" min="0" max="50000" step="1000" value="0" aria-label="Minimum amount" />
    <input type="range" class="cap-range cap-range-slider-input" name="amountMax" min="0" max="50000" step="1000" value="50000" aria-label="Maximum amount" />
  </div>
  <div class="cap-range-slider-ends" aria-hidden="true"><span>$0</span><span>$500+</span></div>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves to the low handle, then the high one |
| Arrow keys | Move the handle one step |
| Page Up, Page Down | Move the handle a larger step (the browser's) |
| Home, End | Move the handle to its end of the track |

- A group named by its visible label; each handle has its own name ("Minimum amount") and its value in words.
- The span over the track repeats the handles' values and is hidden from assistive technology, so they are not read twice.
- Focus is the ring around the thumb; in forced colors an outline.
