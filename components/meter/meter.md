---
name: meter
title: Meter
summary: A value against a limit, as a bar always paired with its number in text. The one bar every Capsomer meter draws.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [low, warning, critical, full, threshold tick, projection, sizes, no data, measuring, native meter]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html, the usage meters)
replaces:
  - 'class="(bar|meter|progress-bar|gauge)[ "]'
  - "className=\"(bar|meter|progress-bar|gauge)[ \"]"
---

# Meter

How much of a limit is used: "78,000 of 100,000" in words, and a bar that repeats it. This is the one bar: the usage meter, the stat tile and any app's bar are drawn with it.

## When to use it

A value with a known minimum and maximum that is a measurement, not progress through a task: storage used, requests today, a draft's length against its target.

## When not to

- Progress through a task that will finish is a `<progress>` element, or the spinner and a sentence saying how long (Empty and loading).
- Usage with a rate, a reset time and what happens at the limit is the usage meter (`.cap-usage`), which composes this one.
- A value with no limit is a number (`.cap-num`), perhaps a stat tile.

## The default and its reason

- **A label and a value on one row, the bar under them** (shadcn's Progress: label left, tabular value right, a rounded track with a fill). The bar is 8 px by default; `data-size="sm"` is 4 px (shadcn's `h-1`), `"lg"` is 12 px. 8 px is the default because a fill must read at 3:1 against its track and a projection's hatching needs height to be legible.
- **`role="meter"` is on the bar** (`.cap-meter-bar`), with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and `aria-valuetext`, named by the label (`aria-labelledby`). A meter's children are presentational, so the status word and the note sit beside the bar, not inside the role, and stay read as text. The value text is the whole sentence a listener needs: "78,000 of 100,000 requests today. Warning: near the limit."
- **The number is always in text beside the label.** The bar repeats it; it never carries it alone.
- **Tone by threshold, and a tone is a word, a glyph and a colour.** `data-tone="warn"` or `"crit"` colours the fill and needs a `.cap-status` word beside the label ("Near the limit", "Limit reached"). `toneFor(value, max, { warnAt, critAt })` gives the tone (warning from 75% and critical from 90% unless you say otherwise); writing the word is the caller's, and the React wrapper writes it when you pass `warnAt`/`critAt` or `words`.
- **No data is not zero.** `data-tone="nodata"` drops the meter role and hides the bar, shows the no data status in place of the number, hatches the track, and says why in the note. **Measuring** is `data-state="indeterminate"` with `aria-busy="true"`: a hatched segment that slides only where motion is allowed, and a word.
- **A threshold tick** (`data-threshold` on the bar, in the bar's unit) marks a target or a line. It is drawn as a line edged in the surface colour, and what it marks is said in the note and in the value text.
- **A projection** (`data-projected` on the bar, in the bar's unit) draws a hatched segment from the start to where the period ends at the current rate, with its end marked. The used part stays solid on top. It is always explained in text (the usage meter adds a legend).
- **The positions are drawn through the CSSOM** (`--cap-meter-ratio`, `--cap-meter-projected` and `--cap-meter-threshold`, from the bar's ARIA values and data attributes), never a style attribute, so apps keep `style-src 'self'`. The behaviour module redraws when a value changes; the React wrapper sets them in a layout effect through a ref.
- **The fill's width eases with a transform** over 400 ms, only where motion is allowed (shadcn's `transition-all` on the indicator, kept to transform).
- **A native `<meter>` is fine** when its low, high and optimum say all there is to say, the page is content rather than a console (a draft's length in the writing hub), and no status word is needed beyond the number beside it. Give it `class="cap-meter"`, a `<label>`, and the number in text next to it.

## Keyboard

| Key | Does |
| --- | --- |
| None | A meter is read, not operated. It takes no focus. |

## Accessibility

- The label is `--text` and the number `--muted`, 4.5:1 in both themes; the fill is 3:1 against its track in every tone.
- Everything shown must be in `aria-valuetext` or in text beside the bar: the tick, the projection and the tone are never colour or position alone.
- Reduced motion: the fill does not ease and the measuring segment does not slide.
- Forced colours: the bar gains an edge, the fill and the tick are painted in CanvasText and the hatching in CanvasText on Canvas.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-meter" data-cap="meter" data-tone="warn" data-size="md">
  <span class="cap-meter-label" id="req-l">Worker requests</span>
  <span class="cap-status" data-tone="warn">[warning glyph]Near the limit</span>
  <span class="cap-meter-value">78,000 of 100,000</span>
  <span class="cap-meter-bar" role="meter" aria-labelledby="req-l"
        aria-valuemin="0" aria-valuemax="100000" aria-valuenow="78000"
        aria-valuetext="78,000 of 100,000 requests today. Warning: near the limit."
        data-threshold="75000" data-projected="91000"><span class="cap-meter-fill"></span></span>
  <span class="cap-meter-note">The tick marks the 75,000 warning line. Resets at midnight UTC.</span>
</div>
```

No data: `<div class="cap-meter" data-tone="nodata">` with the label, `<span class="cap-meter-value"><span class="cap-status" data-tone="nodata">[glyph]No data</span></span>`, `<span class="cap-meter-bar" aria-hidden="true"><span class="cap-meter-fill"></span></span>` and a note that says why. Measuring: the same with `data-state="indeterminate" aria-busy="true"` and the word Measuring.

`import { enhance, setBar, ratio, toneFor } from "capsomer/behaviour/meter"`: `enhance()` draws every `[data-cap="meter"]`. In React, `import { Meter } from "capsomer/react/meter"`: `<Meter label="Worker requests" value={78000} max={100000} warnAt={0.75} critAt={0.9} threshold={75000} valueText="78,000 of 100,000 requests today. Warning: near the limit." note={...} />`; `value={null}` is no data and `measuring` is the measuring state.

## The reference and what is different

Matches shadcn/ui's Progress (Base UI): the label and the tabular value on one row, a rounded full-width track, a primary fill that eases. Different on purpose: it is a meter (`role="meter"`, a known range and a unit), not a progress bar (`role="progressbar"`, a task); it carries a threshold, a projection and a no-data state, which Progress has no need for; the fill is the accent, not a neutral, and warn and crit tones always come with a word.

## Exceptions in production

None yet.
