---
name: form-status
title: Form status
summary: The result of a form's post, said where the form is. Focus moves to it, so a keyboard and a screen reader land on what happened.
parts: [css, react]
tool: native
states: [saved, failed, before a post]
added: 0.125.0
updated: 0.125.0
source: txasm (abstract edit, review, decisions, book and program pages; written five times)
replaces:
  - 'ref=\{statusRef\}'
---

# Form status

## What it is for

A page whose form posts and comes back to the same page (a React Router action): the answer, "Your abstract was saved." or the reason it was not, in the alert's look above the form.

## When to use it

After a post that reloads the page with the action's answer, where the person must read the result before going on.

## When not to

- A result that should not move focus (a quick setting, a row action): the message region (`message`) or the save bar.
- Errors tied to fields: the error summary (`error-summary`) and each field's own error.

## The default and its reason

- **The paragraph is in the page from the start**, empty and visually hidden, so the first result is heard (a live region added with its text is often missed).
- **A new result takes focus** (`tabIndex={-1}`), so the person lands on it, as GOV.UK's error summary does. `focus={false}` keeps focus where it is.
- **A failure is `role="alert"` in the critical tone; a success `role="status"` in ok**, each with the status glyph, so tone is never color alone.
- **`useActionStatus(actionData)`** reads the usual answers (`{ ok: "Saved." }`, `{ error }`, `{ ok: false, message }`) and keeps one object per post, so focus moves once.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | From the result, on into the form |

## Accessibility

- Focus lands on the result after each post; its words are its name.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<p tabindex="-1" role="alert" class="cap-alert cap-form-status" data-tone="crit">
  <svg class="cap-status-glyph" aria-hidden="true">...</svg>
  <span class="cap-alert-body">The title is empty. Write a title, then save again.</span>
</p>
```

A success, and the empty region before a post:

```html
<p tabindex="-1" role="status" class="cap-alert cap-form-status" data-tone="ok">
  <svg class="cap-status-glyph" aria-hidden="true">...</svg>
  <span class="cap-alert-body">Your abstract was saved.</span>
</p>
<p tabindex="-1" role="status" class="cap-sr-only cap-form-status"></p>
```

```tsx
import { FormStatus, useActionStatus } from "capsomer/react/form-status";
<FormStatus status={useActionStatus(actionData)} />
```

Load `capsomer/banner.css` (the alert's look) and `capsomer/form-status.css`.

## Exceptions in production

None yet.
