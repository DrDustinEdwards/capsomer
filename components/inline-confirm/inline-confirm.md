---
name: inline-confirm
title: Inline confirm
summary: A row's risky action in two steps, in place, that works with no script.
parts: [css, react]
tool: native + own JavaScript (React)
states: [first step, question open, running]
added: 0.118.0
source: Foxhound, routes/app/settings/team.tsx (remove member), components/dispute-detail-parts.tsx (AcceptControl) and routes/app/settings/account.tsx (DangerZone's two steps)
replaces:
  - '\?confirm='
  - 'Yes, (remove|accept|delete)'
---

# Inline confirm

## Usage

```html
<form class="cap-inline-confirm" method="post" aria-labelledby="q1">
  <input type="hidden" name="_action" value="remove" />
  <span class="cap-inline-confirm-question" id="q1">Remove Sam Lee?</span>
  <span class="cap-inline-confirm-actions">
    <button type="submit" class="cap-btn" data-size="sm" data-variant="danger" aria-describedby="q1">Yes, remove member</button>
    <a href="?" class="cap-btn" data-size="sm" data-variant="quiet">Cancel</a>
  </span>
</form>
```

## Accessibility

| Key | Does |
| --- | --- |
| Enter or Space on the first button | Opens the question; focus on Cancel |
| Enter on Cancel | Closes it; focus back on the first button |
| Enter on the confirm | Sends the form |

The open form is named by its question (`aria-labelledby`). Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
