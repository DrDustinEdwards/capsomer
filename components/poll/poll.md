---
name: poll
title: Poll
summary: A poll's options as buttons, each filled by its share of the votes, the reader's own vote pressed.
parts: [css, behavior, react]
tool: own JavaScript
states: [open, voted, hover, closed, no votes yet]
added: 0.132.0
updated: 0.138.0
source: Foxing's club polls (.fx-poll-option in apps/web/app/styles/clubs.css, components/clubs/club-schedule.tsx)
replaces:
  - 'fx-poll-option'
---

# Poll

The options of a poll as a list of buttons. Each is filled from the start edge by its share of the votes; the reader's own vote is `aria-pressed="true"`; a closed poll's options cannot be pressed and keep their shares.

## When to use it

A vote among a few options inside a page: a club choosing its next book.

## When not to

- **A choice in a form that posts once**: a radio group.
- **The results on their own**: a chart in the [chart frame](../chart-frame/chart-frame.md).

## The default and its reason

- **Buttons with `aria-pressed`**: each press is an action that saves at once (a vote), not a field in a form.
- **The count is read with its word** ("3 votes"), from a polite live region, so a vote that changes it is announced (Foxing's own poll had it); the share bar is decoration behind the words.
- **The share goes through the CSSOM** (`--share`, set from each option's `data-votes` by `setShares`), never a style attribute.
- **The bar grows** under no-preference motion only.
- **The options are in the interface face** (`--ui`), as every control is, not the reading face around them.

## HTML contract

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

`enhance()` from `capsomer/behavior/poll` sets the shares and keeps them in step when a `data-votes` changes. React: `Poll` from `capsomer/react/poll` takes `options`, `mine`, `onVote`, `closed`, `pending` and `label`.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves from option to option |
| Enter, Space | Votes for the option |

## Accessibility

- Pressed: an accent edge, bold and a stronger fill, not color alone; forced colors: a Highlight outline.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
