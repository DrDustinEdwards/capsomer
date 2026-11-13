---
name: like-button
title: Like button
summary: A toggle button with a heart and its count, pressed when the reader has liked the thing.
parts: [css, react]
tool: native
states: [not liked, liked, hover, signed out, saving, failed]
added: 0.132.0
source: Foxing's LikeButton (apps/web/app/components/social/like-button.tsx, .fx-like-button-* in styles/social.css and styles/clubs.css)
replaces:
  - 'fx-like-button'
---

# Like button

A toggle button: a heart and the count. `aria-pressed="true"` when the reader has liked it, and the heart fills. A failed write shows its error under the button.

## When to use it

A reader's like of a list, a post or a review.

## When not to

- **Saving something for later**: the save toggle.
- **A vote among options**: the [poll](../poll/poll.md).

## The default and its reason

- **The name stays the same, pressed or not** ("Like, 12"); the pressed state says whether it is on (WAI-ARIA APG, toggle button: a name that flips with the state reads as two different buttons). Foxing's name flipped between "Like" and "Remove like" and hid the count.
- **The state is shape as well as color**: the heart fills.
- **The page does the write** and passes `liked` and `count` back; while it runs the button is busy and cannot be pressed twice.
- **Signed out it is disabled** and still shows the count.

## HTML contract

```html
<div class="cap-like">
  <button type="button" class="cap-like-button" aria-pressed="true">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>
    <span class="cap-sr-only">Like Field notes, </span><span>12</span>
  </button>
  <p class="cap-like-error" role="alert">That did not save. Try again.</p>   <!-- on failure -->
</div>
```

React: `LikeButton` from `capsomer/react/like-button` takes `liked`, `count`, `onChange`, `label`, `pending`, `disabled` and `error`.

## Keyboard

| Key | Does |
| --- | --- |
| Enter, Space | Likes or unlikes |

## Accessibility

- A 24px target at least (`--target`).
- Pressed: `--accent-text` and a filled heart; forced colors: a Highlight edge.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
