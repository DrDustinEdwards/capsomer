---
name: approval-sheet
title: Approval sheet
summary: Several waiting gates approved together in one modal sheet, each with its exact command and an optional comment.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [open with two gates, one gate unchecked, none chosen, pending, error]
added: 0.1.0
source: Capsid Portal, dashboard/src/views/Queue.tsx (the approve confirm) and Agents.tsx, as drawn in design/mockup.html
replaces:
  - 'class="confirm"[^>]*>[\s\S]*?gate'
  - "approveGates?\\("
---

# Approval sheet

A modal sheet that lists the gates waiting on you (jobs that will not run until a person approves them) so you can approve several at once. Each gate shows its job title, the exact command it will run, a checkbox to include it and an optional comment. The Approve button says how many gates it will approve.

## When to use it

When two or more gates wait at the same time and approving them is one decision: a release that needs a deploy and a migration, a morning's queue.

## When not to

One question from one agent is answered in place in its session row (`session-row`). A destructive or one-way action on one object is the confirm dialog (`confirm-dialog`). An override that bypasses a gate's checks is out of scope here and will be its own, visibly heavier path.

## The default and its reason

- **A native `<dialog>` opened with `showModal()`.** The page behind is inert and the browser handles Esc (APG Dialog (Modal)).
- **Focus starts on Cancel**, so a stray Enter does nothing that runs a command (patterns.md, "Destructive or one-way").
- **Each gate is a fieldset whose legend is the job's title**, so its checkbox and comment are heard with the job they belong to.
- **The command is shown exactly, mono and sunken, and wraps.** Nothing that will run is cut off or scrolled out of sight.
- **The count follows the checkboxes**: "Approve 2 gates", "Approve 1 gate". With none chosen the button stays focusable, `aria-disabled="true"`, and says why: "Choose at least one gate."
- **Cancel and Approve sit apart**, Cancel first.
- **A click outside does not close it**, so a comment being written is never lost.
- **Pending**: Approve shows its spinner and "Approving 2 gates"; Cancel, the gates and Esc are held until the request settles.
- **Error**: an alert beside the buttons says what happened and that nothing was approved; the choices and comments stay so you can try again.
- **Focus returns to the button that opened the sheet.**

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves through the gates' checkboxes and comments, then Cancel and Approve |
| Space on a checkbox | Includes or leaves out that gate; Approve's count follows |
| Enter on Approve | Approves the chosen gates; nothing when none is chosen |
| Enter or Space on Cancel | Closes the sheet; focus returns to its button |
| Esc | Closes the sheet, except while an approval is in flight |

## Accessibility

- The dialog is named by its title; each gate is a group named by its job.
- The disabled Approve stays in the tab order with its reason as its description.
- The error is `role="alert"` and stays until the next attempt.
- Esc is held while pending by stopping the keydown as well as the cancel event, because Chrome skips the cancel event when the page has had no user activation since the last close request.
- Forced colours: the sheet's edge and the command box keep a border.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<button type="button" class="cap-btn" data-cap-opens="approve-sheet">Review 2 gates</button>

<dialog class="cap-approval" data-cap="approval-sheet" id="approve-sheet" aria-labelledby="ap-title">
  <form class="cap-approval-form">
    <div class="cap-approval-head">
      <h2 class="cap-approval-title" id="ap-title">2 gates are waiting</h2>
      <p class="cap-approval-lead">Each command runs once, when approved. Uncheck a gate you are not ready for; it stays waiting.</p>
    </div>
    <div class="cap-approval-gates" role="group" aria-label="Gates waiting for approval" tabindex="0">
      <fieldset class="cap-approval-gate">
        <legend class="cap-approval-job">Deploy foxhound to production</legend>
        <p class="cap-approval-meta">job_8c21 in foxhound, waiting 26 minutes</p>
        <pre class="cap-approval-cmd"><code>npx wrangler deploy --env production</code></pre>
        <label class="cap-check"><input type="checkbox" data-cap-part="include" name="gate" value="job_8c21" checked> Include this gate</label>
        <div class="cap-field"><label class="cap-field-label" for="ap-c1">Comment (optional)</label><textarea class="cap-input" id="ap-c1" data-cap-part="comment" rows="2"></textarea></div>
      </fieldset>
      [more gates]
    </div>
    <div class="cap-approval-error" data-cap-part="error" hidden>
      <div class="cap-alert" data-tone="crit" role="alert"><span data-cap-part="error-text"></span></div>
    </div>
    <div class="cap-approval-foot">
      <button type="button" class="cap-btn" data-cap-part="cancel" autofocus>Cancel</button>
      <p class="cap-approval-none" id="ap-none" data-cap-part="none" hidden>Choose at least one gate.</p>
      <button type="submit" class="cap-btn" data-variant="primary" data-cap-part="approve"><span data-cap-part="approve-label">Approve 2 gates</span></button>
    </div>
  </form>
</dialog>
```

`import { enhance, open, setPending, setError } from "capsomer/behaviour/approval-sheet"`. `enhance()` wires the opener (`data-cap-opens`), the count, Cancel and Esc. Approving dispatches a bubbling `cap-approve` event on the dialog with `{ gates: [{ id, comment }] }`; call `setPending(dialog, true)`, then `dialog.close()` on success, or `setError(dialog, "...")` and `setPending(dialog, false)` on failure. `approveLabel(n)` and `titleText(n)` are exported for other code.

In React, `import { ApprovalSheet } from "capsomer/react/approval-sheet"` with `open`, `gates`, `onApprove` (return a promise to hold the sheet pending until it settles) and `onClose`.

## Exceptions in production

None yet.
