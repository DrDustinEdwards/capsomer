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

## Usage

```html
<div class="cap-like">
  <button type="button" class="cap-like-button" aria-pressed="true">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>
    <span class="cap-sr-only">Like Field notes, </span><span>12</span>
  </button>
  <p class="cap-like-error" role="alert">That did not save. Try again.</p>   <!-- on failure -->
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter, Space | Likes or unlikes |

- A 24px target at least (`--target`).
- Pressed: `--accent-text` and a filled heart; forced colors: a Highlight edge.
