---
name: banner
title: Banner and alert
summary: A page-level notice that keeps the last good data on screen, and an error beside its source.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [warning banner with an action, critical banner, inline alert, banner with Dismiss]
added: 0.1.0
source: Capsomer mockup (design/mockup.html, "Could not load" and the form field's error); the Capsid Portal's stale-feed notice
replaces:
  - 'class="(banner|callout|alert|error-box)[ "]'
  - "className=\"(banner|callout|alert|error-box)[ \"]"
---

# Banner and alert

Two ways to say something went wrong or needs attention, by where it belongs.

- `.cap-banner`: about the whole page. "Could not refresh. Showing data from 4 minutes ago." with Try again. The data below it stays.
- `.cap-alert`: about one thing, beside it. "Could not save the schedule: the server did not answer. Your changes are kept here; save again in a minute."

## When to use it

- A banner when a page read fails (keep the last good data on screen and say how old it is), when the session has ended, or for a page-wide condition the person should know before acting.
- An alert when an action on one thing failed, beside that thing's control or panel.

## When not to

- The result of an action that worked is a message (`.cap-message`).
- A form field's own error is the field's `.cap-field-error`, tied to the input with `aria-describedby`.
- An empty or failed panel with nothing to show is `.cap-empty` with `data-kind="failed"`.
- Never replace the data with an error: a failed refresh keeps what was there.

## The default and its reason

- **A failed page read is a banner that keeps the last good data** (patterns.md "Error"). It states how old the data is, in words.
- **Plain words, and what to do next.** Say what failed, what is safe, and the next step.
- **Warning banners are polite (`role="status"`); critical banners and alerts interrupt (`role="alert"`).** Change a live banner's text only when something changes for the reader (a new failure), never on a timer, or it is announced again.
- **An alert stays until fixed or dismissed.** Point the source at it with `aria-describedby`.
- **Shape and word with the colour**: the warning triangle or the critical octagon (Status's glyphs), and the word in the text.
- **Dismiss only for a notice that can safely be forgotten.** A stale-data banner goes when the data is fresh again, so it has no Dismiss. Dismissing moves focus to the page's main region.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the banner's actions in reading order; the banner itself takes no focus |
| Enter on Dismiss | Hides the banner; focus moves to the main region |

## Accessibility

- Banner text is `--text` on the tone's tint; alert text is the critical tone on the page's surface; both 4.5:1 in both themes. The banner's edge and glyph are 3:1.
- A live region present at load is not announced; add the banner or alert when the failure happens.
- Forced colours: the tint is removed, and the banner keeps its edge.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-banner" data-tone="warn" role="status">
  [warning glyph]
  <p class="cap-banner-text">Could not refresh. Showing data from 4 minutes ago.</p>
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
```

The glyphs are Status's (`.cap-status-glyph`). `import { enhance } from "capsomer/behaviour/banner"` wires Dismiss. In React, `import { Banner, Alert } from "capsomer/react/banner"`: `<Banner actions={<button className="cap-btn" onClick={retry}>Try again</button>}>Could not refresh. Showing data from 4 minutes ago.</Banner>`; pass `onDismiss` for a Dismiss button, and move focus yourself when the banner goes.

## Exceptions in production

None yet.
