---
name: meter
title: Meter
summary: A value against a limit, as a bar always paired with its number in text.
parts: [css, behavior, react]
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

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| None | A meter is read, not operated. It takes no focus. |

- The label is `--text` and the number `--muted`, 4.5:1 in both themes; the fill is 3:1 against its track in every tone.
- Everything shown must be in `aria-valuetext` or in text beside the bar: the tick, the projection and the tone are never color or position alone.
- Reduced motion: the fill does not ease and the measuring segment does not slide.
- Forced colors: the bar gains an edge, the fill and the tick are painted in CanvasText and the hatching in CanvasText on Canvas.
