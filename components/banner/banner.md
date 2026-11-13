---
name: banner
title: Banner and alert
summary: "A page-level notice that keeps the last good data on screen, and an alert beside its source: glyph, title, words and an action, in five tones."
parts: [css, behavior, react]
tool: native + own JavaScript
states: [neutral, notice, ok, warning banner with an action, critical banner, banner with a title, inline alert, alert with a title, warning alert, neutral alert, banner with Dismiss, comfortable]
added: 0.1.0
updated: 0.2.0
source: Capsomer mockup (design/mockup.html, "Could not load" and the form field's error); the Capsid Portal's stale-feed notice
replaces:
  - 'class="(banner|callout|alert|error-box)[ "]'
  - "className=\"(banner|callout|alert|error-box)[ \"]"
---

# Banner and alert

## Usage

```html
<div class="cap-banner" data-tone="warn" role="status">
  [warning glyph]
  <p class="cap-banner-text">Could not refresh. Showing data from 4 minutes ago.</p>
  <div class="cap-banner-actions"><button type="button" class="cap-btn">Try again</button></div>
</div>

<div class="cap-banner" data-tone="warn" role="status">
  [warning glyph]
  <div class="cap-banner-body">
    <p class="cap-banner-title">Showing data from 4 minutes ago</p>
    <p class="cap-banner-text">The watcher did not answer. Nothing you changed is lost.</p>
  </div>
  <div class="cap-banner-actions"><button type="button" class="cap-btn">Try again</button></div>
</div>

<div class="cap-banner" data-tone="warn" role="status" data-cap="banner">
  [warning glyph]
  <p class="cap-banner-text">The usage numbers for D1 are a day behind.</p>
  <div class="cap-banner-actions"><button type="button" class="cap-btn" data-variant="quiet" data-cap-part="dismiss">Dismiss</button></div>
</div>

<button type="button" class="cap-btn" aria-describedby="save-error">Save schedule</button>
<div class="cap-alert" role="alert" id="save-error">
  [critical glyph]
  <span class="cap-alert-text">Could not save the schedule: the server did not answer. Save again in a minute.</span>
</div>

<div class="cap-alert" data-tone="warn" role="alert">
  [warning glyph]
  <div class="cap-alert-body">
    <p class="cap-alert-title">This token expires in 3 days</p>
    <p class="cap-alert-text">Replace it in Settings before then.</p>
  </div>
  <div class="cap-alert-action"><button type="button" class="cap-btn" data-variant="quiet">Open Settings</button></div>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the banner's actions in reading order; the banner itself takes no focus |
| Enter on Dismiss | Hides the banner; focus moves to the main region |

- Banner and alert text is `--text` on the tone's tint, and an alert's title is the tone's color on its tint; all 4.5:1 in both themes. The edge and glyph are 3:1 (the neutral edge is `--dim`).
- Links in the words are semibold, so they are not told apart by color alone (WCAG F73 names weight as a cue).
- A live region present at load is not announced; add the banner or alert when the failure happens.
- Forced colors: the tint is removed, and the banner keeps its edge.
