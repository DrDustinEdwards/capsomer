---
name: empty
title: Empty
summary: Which kind of empty an area is, and what a long wait says.
parts: [css, react]
tool: native
states: [nothing yet, no match, all clear, could not load, with an icon, flush, long wait, comfortable, no value]
added: 0.1.0
updated: 0.100.0
source: Capsomer mockup (design/mockup.html, "Empty, loading and error")
replaces:
  - 'class="(empty|empty-state)[ "]'
  - "className=\"(empty|empty-state)[ \"]"
---

# Empty

## Usage

```html
<div class="cap-empty" data-kind="nothing-yet">
  <div class="cap-empty-media" data-variant="icon" aria-hidden="true"><svg>...</svg></div>
  <div class="cap-empty-header">
    <p class="cap-empty-title">No sites are watched yet</p>
    <p class="cap-empty-text">Add the first one and its checks start on the next pass.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn" data-variant="primary">Add a site</button></div>
</div>

<div class="cap-empty" data-kind="no-match" data-flush>
  <div class="cap-empty-header">
    <p class="cap-empty-title">No jobs match “Blocked”</p>
    <p class="cap-empty-text">14 jobs are hidden by this filter.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn">Clear filter</button></div>
</div>

<div class="cap-empty" data-kind="all-clear">
  <div class="cap-empty-header">
    <p class="cap-empty-title"><span class="cap-status" data-tone="ok">[ok glyph]All clear</span></p>
    <p class="cap-empty-text">No mentions are waiting.</p>
  </div>
</div>

<div class="cap-empty" data-kind="failed" role="alert">
  <div class="cap-empty-header">
    <p class="cap-empty-title">[critical glyph]Could not load the queue</p>
    <p class="cap-empty-text">The server answered with an error (502). Nothing changed on your side.</p>
  </div>
  <div class="cap-empty-content"><button type="button" class="cap-btn">Try again</button></div>
</div>

<div class="cap-empty-wait" aria-busy="true">
  [spinner, labeled "Building the site"]
  <p class="cap-empty-text">This usually takes about 30 seconds.</p>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the kind's action (Add, Clear filter, Try again); all clear has none |

- The title is `--text`, the line under it `--muted`, the failed title `--crit`: 4.5:1 in both themes.
- `failed` is `role="alert"`; add it when the read fails so it is announced.
- The icon tile is decorative (`aria-hidden`); the title carries the meaning.
- Forced colors: the dashed edge and the icon tile take the system text color.
