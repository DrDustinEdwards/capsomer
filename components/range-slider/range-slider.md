---
name: range-slider
title: Range slider
summary: A two-handle range on one track, the span filled between the handles, for a filter like an amount from and to.
parts: [css, behavior, react]
tool: own JavaScript
states: [full range, a chosen span, a handle under the pointer, open top (and more)]
added: 0.91.0
source: Foxhound's DualRangeSlider (app/components/dual-range-slider.tsx, .dual-range-input in app.css; Recova's AmountRangeSlider)
replaces:
  - 'dual-range-input'
  - 'function DualRangeSlider'
---

# Range slider

A filter for a span of values (an amount from $10 to $500): a label with the chosen span over a track, the track filled between two handles, and the track's ends under it. A list filters a quarter second after a handle stops.

## When to use it

A list filter where the reader narrows a numeric span and the exact ends matter less than the shape: amounts, durations, counts.

## When not to

- **One value**: the single slider (`input.cap-range` in the field).
- **Exact numbers a person types**: two number fields ("From", "To").
- **A few fixed bands** ("Under $50", "$50 to $500"): filter chips.

## The default and its reason

- **Two native range inputs on one track**, so each handle takes the arrow keys, Home, End and Page keys with no script, and a form submits both values with no script (each has a `name`).
- **The inputs' tracks let the pointer through**; only the thumbs take it, so either handle drags on its own.
- **The low handle stays a step under the high one.**
- **The span is filled between the handles** in `--primary`, the rest `--line-strong`, from `--cap-range-lo` and `--cap-range-hi` set through the CSSOM.
- **Each handle says its value in words** (`aria-valuetext`: "$120"), and the top of an open-ended track says "and more" (`data-open-top`: "$500+").
- **The list filters 250ms after a handle stops** (`onCommit`, or the `cap:range-commit` event), Recova's delay: one request, not one per step.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves to the low handle, then the high one |
| Arrow keys | Move the handle one step |
| Page Up, Page Down | Move the handle a larger step (the browser's) |
| Home, End | Move the handle to its end of the track |

## Accessibility

- A group named by its visible label; each handle has its own name ("Minimum amount") and its value in words.
- The span over the track repeats the handles' values and is hidden from assistive technology, so they are not read twice.
- Focus is the ring around the thumb; in forced colors an outline.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

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

React: `RangeSlider` from `capsomer/react/range-slider` takes `label`, `min`, `max`, `low`, `high`, `step`, `names`, `handleLabels`, `format`, `onCommit` and `className`. A page with no React calls `enhance()` from `capsomer/behavior/range-slider` and listens for `cap:range-commit`; `rangeFill(value, min, max)` gives a single slider's `--cap-range-fill`. Load `field.css` (each handle is its `.cap-range`) and `range-slider.css`.

## Exceptions in production

None yet.
