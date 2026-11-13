---
name: inline-confirm
title: Inline confirm
summary: A row's risky action in two steps, in place, that works with no script and never lets a second Enter act.
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

The button gives way, in place, to the question, the confirm and Cancel. For one risky action on a row or in a panel, where a dialog would take the person away from the thing they are deciding about.

## When to use it

Removing a member, accepting a dispute, deleting one file: a one-line question with a yes or no.

## When not to

- When the person needs to see what will happen (a preview, a count, typing a name): the confirm dialog.
- A setting that can be undone at once: a switch, with Undo in the message region.

## The default and its reason

- **It works with no script.** The first step is a link to the page with the question open (`openHref`, such as `?confirm=<id>`, which the page reads into `defaultOpen`), Cancel a link back (`closeHref`). With script the first step is a button that opens in place.
- **Focus lands on Cancel**, never on the confirm, so a second Enter cannot act; Cancel puts it back on the first button. A question opened by the address takes focus on Cancel too.
- **The confirm is described by the question**, so it is heard as "Yes, remove member, Remove Sam Lee?".
- **While it runs** the confirm says `pendingLabel` and is `aria-disabled` (not disabled, so focus stays on it), and Cancel is withdrawn.
- **The hidden inputs that name the action are the children**; the form is the app's (`form={Form}`, or the read-only form for a demo).

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space on the first button | Opens the question; focus on Cancel |
| Enter on Cancel | Closes it; focus back on the first button |
| Enter on the confirm | Sends the form |

## Accessibility

The open form is named by its question (`aria-labelledby`). Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

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

React: `import { InlineConfirm } from "capsomer/react/inline-confirm"`.

## Exceptions in production

None yet.
