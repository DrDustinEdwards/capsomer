---
name: save-bar
title: Save bar
summary: The row that ends a settings form - the result, other actions, then Save - or, for a form that saves on change, the result alone.
parts: [css, react]
tool: native
states: [before saving, saving, saved, failed, autosave, sticky]
added: 0.92.0
updated: 0.92.0
source: Foxhound settings (account, audit, brand voice, disputes, email, notifications; seven copies of Recova's SaveBar)
replaces:
  - "Recova's SaveBar"
  - "Legacy's SaveBar"
---

# Save bar

## What it is for

The end of a settings form: "Saved" or "Failed to save. Please try again." beside the primary Save, at the end of the row.

## When to use it

A form of settings that saves as a whole. With `autosave`, a form that saves each change (the bar has no button and only says what happened).

## When not to

- A form that posts and must move focus to its answer: form status.
- One switch that applies at once: the switch with its own result.

## The default and its reason

- **The result is a polite live region in the page from the start**, so "Saved" is heard without moving focus.
- **Saving keeps the button's width** (the button's pending state) and says nothing until there is a result.
- **When autosaving, a success fades from sight after three seconds**; a failure stays until the next try, since it asks for something.
- **The words are the family's**: `SAVE_WORDS` (Saving…, Saved, Failed to save. Please try again.); `failed` takes the server's own reason.

## Options

- `sticky` keeps the bar on the window's bottom edge while a long form scrolls (dustinedwards.info's knowledge base editor, with its Check button as a child).
- `disabledReason` keeps Save visible but unusable, and says why (a feature that is off), the same as Button's.

## Keyboard

| Key | Does |
| --- | --- |
| Enter or Space on Save | Submits the form |

## Accessibility

- The result is `role="status"` and carries the status glyph, so tone is not color alone.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-save-bar">
  <p class="cap-save-bar-result" role="status"><span class="cap-status" data-tone="ok">...Saved</span></p>
  <button type="submit" class="cap-btn" data-variant="primary">Save changes</button>
</div>
```

```tsx
import { SaveBar } from "capsomer/react/save-bar";
<SaveBar state={saving ? "saving" : result?.ok ? "saved" : result ? "failed" : "idle"} />
```

## Exceptions in production

None yet.
