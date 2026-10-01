---
name: meter
title: Meter
summary: A value against a limit, as a bar always paired with its number in text.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [low, warning, critical, full, no data, native meter]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, the usage meters)
replaces:
  - 'class="(bar|meter|progress-bar|gauge)[ "]'
  - "className=\"(bar|meter|progress-bar|gauge)[ \"]"
---

# Meter

How much of a limit is used: "78,000 of 100,000" in words, and a bar that repeats it.

## When to use it

A value with a known minimum and maximum that is a measurement, not progress through a task: storage used, requests today, a draft's length against its target.

## When not to

- Progress through a task that will finish is a `<progress>` element, or the spinner and a sentence saying how long (Empty and loading).
- Usage with a projection, a reset time and what happens at the limit is the console's usage meter (`.cap-usage`), built on this one.
- A value with no limit is a number (`.cap-num`), perhaps a stat tile.

## The default and its reason

- **`role="meter"` with `aria-valuenow` and `aria-valuetext`** (patterns.md "Value against a limit"). The value text is the whole sentence a listener needs: "78,000 of 100,000 requests today. Warning: near the limit."
- **The number is always in the text beside the label.** The bar repeats it; it never carries it alone.
- **A tone has a word.** `data-tone="warn"` or `"crit"` colours the fill and needs a status word in `.cap-meter-note` ("Near the limit", "Limit reached"), so colour is never alone. Which value earns which tone is the caller's rule (usage: warning at 75%, critical at 90%).
- **No data is not zero.** `data-tone="nodata"` drops the meter role, shows the no data status in place of the number, hatches the bar, and says why.
- **The fill is drawn through the CSSOM** (`--cap-meter-ratio`, from `data-value` and `data-max` or the ARIA values), never a style attribute, so apps keep `style-src 'self'`. The behaviour module redraws when the value changes; the React wrapper sets it in an effect through a ref.
- **A native `<meter>` is fine** when its low, high and optimum say all there is to say, the page is content rather than a console (a draft's length in the writing hub), and no status word is needed beyond the number beside it. Give it `class="cap-meter"`, a `<label>`, and the number in text next to it. Its colours come from its own low, high and optimum.

## Keyboard

| Key | Does |
| --- | --- |
| None | A meter is read, not operated. It takes no focus. |

## Accessibility

- The label is `--text` and the number `--muted`, 4.5:1 in both themes; the fill is 3:1 against its track.
- The meter's children are presentational to a screen reader, so everything shown must be in `aria-valuetext`.
- Forced colours: the bar gains an edge and the fill is painted in CanvasText.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-meter" data-cap="meter" data-tone="warn" role="meter"
     aria-labelledby="req-l" aria-valuemin="0" aria-valuemax="100000" aria-valuenow="78000"
     aria-valuetext="78,000 of 100,000 requests today. Warning: near the limit."
     data-value="78000" data-max="100000">
  <span class="cap-meter-label" id="req-l">Worker requests</span>
  <span class="cap-meter-value">78,000 of 100,000</span>
  <span class="cap-meter-bar"><span class="cap-meter-fill"></span></span>
  <span class="cap-meter-note"><span class="cap-status" data-tone="warn">[warning glyph]Near the limit</span> Resets at midnight UTC.</span>
</div>
```

`import { enhance } from "capsomer/behaviour/meter"` draws every fill. In React, `import { Meter } from "capsomer/react/meter"`: `<Meter label="Worker requests" value={78000} max={100000} tone="warn" valueText="78,000 of 100,000 requests today. Warning: near the limit." note={...} />`; `value={null}` is no data.

## Exceptions in production

None yet.
