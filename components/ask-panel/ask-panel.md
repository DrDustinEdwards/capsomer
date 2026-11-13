---
name: ask-panel
title: Ask panel
summary: An AI answer streamed into the page, labeled as AI and possibly wrong, with sources and a follow-up.
group: pattern
parts: [css, behavior]
tool: own JavaScript
states: [answered, cut off, unavailable, before asking]
added: 0.132.0
updated: 0.135.0
source: dei's Ask (app/styles/ask.css, app/enhance/ask.ts, lib/search/sse.mjs)
replaces:
  - 'ask-panel'
  - 'ask-trigger'
---

# Ask panel

## Usage

```html
<div data-cap="ask" data-ask-question="How long are the logs kept?">
  <button type="button" class="cap-btn cap-ask-trigger" data-ask-trigger hidden>Ask AI</button>
  <div data-ask-container hidden></div>
</div>
```

## Accessibility

- The panel is a labeled region ("AI answer"), focusable but not a Tab stop.
- The badge's colors are the primary pair; the note and the status are muted text that reaches 4.5:1 on the accent tint.
- Failure is said in words ("Ask is unavailable.", "Ask stopped early.", "No answer for that one.") and announced.
