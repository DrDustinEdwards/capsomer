---
name: confirm-dialog
title: Confirm dialog
summary: Preview, then perform, for an action that cannot be undone.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [open, busy, failed with Try again, reason required and empty, typed-word guard not typed, typed-word guard matched]
added: 0.1.0
source: Capsid Portal, dashboard/src/app/ConfirmDialog.tsx and styles.css (.help), as of capsid master 2026-10-01; dustinedwards.info app/components/admin/confirm-dialog.tsx for the typed word
replaces:
  - 'className="(help )?confirm'
  - "confirm-dialog"
  - 'window\.confirm\('
---

# Confirm dialog

**Provenance.** MIXED, against the Portal's `app/ConfirmDialog.tsx` and `styles.css` (`.help`, `.confirm`) as of capsid master on 2026-10-01. The rules and their reasoning are extracted: no light dismiss, focus on Cancel for a one-way action, the perform button named for the action and set at the far end, Esc held while busy, a required reason that says so when empty (`aria-invalid`, described by the error), focus handed back after the next frame to the opener, then the open panel, then `main`. The CSS and the markup are written for Capsomer's tokens (the Portal wraps a `.card` in a bare dialog), and the behaviour is framework-free and generic: the Portal's preview call, its `ConfirmRequest` and its router are not carried over; the app passes `perform`.

A modal dialog that shows what a one-way action will change before it is done: revoking an agent's key, deleting a site record, failing a job. The person reads the list, then performs or cancels.

## When to use it

Only for an action that cannot be undone, or is costly to undo: it destroys data, ends a credential, or tells someone else.

## When not to

A reversible action happens at once and offers Undo through the message region (`.cap-message`). Asking "are you sure" before something reversible teaches people to press through the question. Never `window.confirm()`: it cannot show what changes, and it blocks the page.

## The default and its reason

- **The title names the action and the object**: "Revoke foxhound-driver?", never "Are you sure?".
- **The body lists what will change**, one line each, from the server's preview where there is one.
- **The perform button is named for the action** ("Revoke agent"), danger style, at the far end from Cancel, so a slip does not land on it.
- **Focus starts on Cancel.** Enter on arrival cancels (patterns.md, "Destructive or one-way").
- **A click outside does nothing.** A dialog that closes on a stray click loses what the person was reading, or a reason they typed. The press on the backdrop does not take focus off the control that had it either.
- **A reason, where the audit row must carry one** (`reason`): a labelled textarea, "Reason (required)", with a note that it is recorded with the change. The perform button is never silently disabled for an empty reason: pressing it says "A reason is required." in the error box, marks the field `aria-invalid` and describes it by the error, and puts focus in it. The reason is read from the field itself, so a value the browser filled in without an input event counts. A plain Enter is a new line; Ctrl or Cmd with Enter performs.
- **Esc closes it, except while the action runs.** Busy sets `aria-busy` on the dialog and the perform button, and both buttons refuse; Esc is held (the cancel event and the keydown), because closing would hide the answer.
- **A failure stays inside the dialog** in a `role="alert"` box: "Not done. Nothing was changed.", the reason, and the perform button becomes Try again.
- **Focus returns to the opener on close**, after the next frame so the page has re-rendered. When the opener has gone (a revoked agent's row is removed), focus goes to `data-cap-return` if set, then to the Close button of a detail panel still open behind the dialog, then to `main`.
- **Type a short word only for what cannot be recovered** ("Type delete to confirm"). Case does not matter. Until it matches, the perform button is `aria-disabled` and described by that line; pressing it moves to the field. No hold or slide to confirm (decision for 0.1).
- Busy uses `aria-disabled`, not `disabled`, so focus stays on the button that was pressed.

## Keyboard

| Key | Does |
| --- | --- |
| (on open) | Focus is on Cancel |
| Tab, Shift Tab | Moves between the fields (when there are any), Cancel and the action; stays inside the dialog |
| Ctrl Enter, Cmd Enter in the reason field | Performs; with the reason empty, says a reason is required and keeps focus in the field |
| Enter or Space on Cancel | Closes; focus returns to the opener |
| Enter or Space on the action | Performs; the dialog shows busy until it ends |
| Enter in the typed-word field | Performs once the word matches |
| Esc | Closes, unless the action is running |

## Accessibility

- A native `dialog` opened with `showModal()`: the page behind is inert, and the dialog is named by its title (`aria-labelledby`) and described by its body (`aria-describedby`).
- The error is `role="alert"`, present and empty until it is needed, so it is announced when filled.
- The guard's reason is the perform button's description, so a screen reader hears why it is off.
- An empty reason is `aria-invalid="true"` and described by the error box; the border also turns critical, never alone.
- Forced colours: the dialog and the error keep their borders.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<dialog class="cap-dialog" data-cap="confirm-dialog" id="revoke" aria-labelledby="revoke-title" aria-describedby="revoke-body">
  <h2 class="cap-dialog-title" id="revoke-title">Revoke foxhound-driver?</h2>
  <div class="cap-dialog-body" id="revoke-body">
    <p>This cannot be undone. The agent stops working at once.</p>
    <ul><li>Its key stops being accepted.</li><li>Its 1 claimed job goes back to the queue.</li></ul>
  </div>
  <!-- Only where the audit row carries a reason: -->
  <div class="cap-dialog-reason">
    <label for="revoke-reason">Reason (required)</label>
    <textarea class="cap-input" id="revoke-reason" rows="3" aria-required="true" aria-describedby="revoke-reason-note" data-cap-part="reason"></textarea>
    <p class="cap-dialog-note" id="revoke-reason-note" data-cap-part="reason-note">Recorded with the change.</p>
  </div>
  <!-- Only for what cannot be recovered: -->
  <div class="cap-dialog-typed">
    <label id="revoke-typed-label" for="revoke-typed">Type <b>revoke</b> to confirm</label>
    <input class="cap-input" id="revoke-typed" autocomplete="off" spellcheck="false" data-cap-part="typed" data-cap-word="revoke">
  </div>
  <div class="cap-dialog-error" role="alert" id="revoke-error" data-cap-part="error"></div>
  <div class="cap-dialog-actions">
    <button type="button" class="cap-btn" data-cap-part="cancel">Cancel</button>
    <button type="button" class="cap-btn" data-variant="danger" data-cap-part="perform">Revoke agent</button>
  </div>
</dialog>
<button type="button" class="cap-btn" data-variant="danger" data-cap-confirm-open="revoke">Revoke foxhound-driver…</button>
```

Keep `.cap-dialog-error` empty with no whitespace; it hides while `:empty`.

```js
import { confirm } from "capsomer/behaviour/confirm-dialog";
const done = await confirm({
  title: "Revoke foxhound-driver?",
  lead: "This cannot be undone.",
  body: ["Its key stops being accepted.", "Its 1 claimed job goes back to the queue."],
  action: "Revoke agent",
  reason: {}, // only where the audit row carries a reason; perform gets it
  typeToConfirm: "revoke", // only for what cannot be recovered
  perform: (reason) => api.revoke("foxhound-driver", reason), // reject with an Error whose message says what happened
});
```

For a dialog written in markup, `enhance()` wires it and its `[data-cap-confirm-open]` triggers, and `bindPerform(dialog, fn)` says what the action does; without it, a `type="submit"` perform button posts its form and the dialog shows busy meanwhile. In React, `import { ConfirmDialog } from "capsomer/react/confirm-dialog"` with `open`, `perform` and `onClose(performed)`. The Portal's two-step flow (type a reason, press Preview, read what changes, then perform) is the app's: show the preview's lines as `body` and call `confirm()` when it arrives.

## Exceptions in production

None yet.
