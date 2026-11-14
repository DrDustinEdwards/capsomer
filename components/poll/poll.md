---
name: poll
title: Poll
summary: A poll's options as buttons, each filled by its share of the votes, the reader's own vote pressed.
parts: [css, behavior, react]
tool: own JavaScript
states: [open, voted, hover, closed, no votes yet]
added: 0.132.0
updated: 0.142.0
source: Foxing's club polls (.fx-poll-option in apps/web/app/styles/clubs.css, components/clubs/club-schedule.tsx)
replaces:
  - 'fx-poll-option'
---

# Poll

## Usage

```html
<ul class="cap-poll" data-cap="poll" aria-label="Next book">
  <li>
    <button type="button" class="cap-poll-option" data-votes="3" aria-pressed="true">
      <span class="cap-poll-label">Field notes</span>
      <span class="cap-poll-count" aria-live="polite" aria-atomic="true">3<span class="cap-sr-only"> votes</span></span>
    </button>
  </li>
</ul>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves from option to option |
| Enter, Space | Votes for the option |

- Pressed: an accent edge, bold and a stronger fill, not color alone; forced colors: a Highlight outline.
