---
name: save-bar
title: Save bar
summary: The foot of a settings form. The result of the last save, then the Save button, at the end of the form, with the result announced when it arrives.
parts: [css, react]
tool: native
states: [nothing saved yet, saving, saved, failed, no button, saves as it changes, sticky]
added: 0.113.0
updated: 0.125.0
source: Foxhound, app/routes/app/settings/ (notifications, email twice, account, brand-voice, disputes, audit), each a copy of Recova's SaveBar.
---

# Save bar

The last line of a settings form: "Saved" or what went wrong, then Save changes.

**Provenance.** EXTRACTED from Foxhound's seven hand-written bars (a wrapping flex row at the end of the form, `gap` 12px, 24px above, the result in a `role="status"` beside a primary button). Changed: one live region for both results. Foxhound's audit settings put a failure in a `role="alert"` that appeared with its text, which some screen readers miss; the region here is on the page from the start.

## When to use it

A form of settings that saves as a whole: notifications, a sender address, an account's details.

## When not to

- A setting that saves as it changes (a switch): the switch says its own state.
- Publishing or anything that cannot be undone: the publish gate or a confirm dialog.
- Starting a new item by name: the inline add form.

## The default and its reason

- **The result sits beside the button**, at the end of the form, where the eye is after pressing it.
- **One status region, always present.** A region added with its text is often not read; one that is there from the start is.
- **A failure says what to do** ("Failed to save. Please try again."), or the server's own words when it gave a reason.
- **"Saved" clears itself** after a few seconds; a failure stays. Pair it with `useShownFor` from `capsomer/react/hooks`.

## Options

- **No button** (`button={false}`): a form that saves as each control changes (Foxhound's audit settings). The bar only says what happened, and "Saving…" while a save is in flight.
- **Another action** as children, before Save (dustinedwards.info's knowledge base editor puts Check there).
- **`disabledReason`** keeps Save visible but unusable and says why (a feature that is off), as Button's does.
- **`sticky`** keeps the bar on the window's bottom edge while a long form scrolls.
- **`form`, `name`, `value`** go to the button: a bar outside its form, or a form with several actions posting to one route.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the button after the form's fields |
| Enter in a field | Posts the form |

## Accessibility

- `role="status"` is polite: the result is read after what the reader is saying.
- The result carries its glyph as well as its color (the status component).
- The button keeps its words while saving and shows the spinner (`aria-busy`).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-save-bar">
  <p role="status" class="cap-save-bar-status"><span class="cap-status" data-tone="ok">...Saved</span></p>
  <button type="submit" class="cap-btn" data-variant="primary">Save changes</button>
</div>
```

```tsx
import { SaveBar } from "capsomer/react/save-bar";

<SaveBar pending={busy} saved={result?.ok === true} error={result?.ok === false ? "Failed to save. Please try again." : null} />
```

Props: `pending`, `saved` (true, or the words to say in place of "Saved"), `error` (words; shown in place of "Saved"), `submit` (the button's words, "Save changes"), `button` (false leaves it out), `children`, `disabledReason`, `sticky`, `form`, `name`, `value`, `className`.

## Exceptions in production

None yet.
