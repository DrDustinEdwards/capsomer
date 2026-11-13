---
name: approval-sheet
title: Approval sheet
summary: Several waiting gates approved together in one modal sheet, each with its command and a comment.
group: pattern
parts: [css, behavior, react]
tool: native + own JavaScript
states: [open with two gates, one gate unchecked, none chosen, pending, error]
added: 0.1.0
updated: 0.2.0
source: Capsid Portal, dashboard/src/views/Queue.tsx (the approve confirm) and Agents.tsx, as drawn in design/mockup.html
replaces:
  - 'class="confirm"[^>]*>[\s\S]*?gate'
  - "approveGates?\\("
---

# Approval sheet

## Usage

```html
<button type="button" class="cap-btn" data-cap-opens="approve-sheet">Review 2 gates</button>

<dialog class="cap-dialog cap-approval" data-cap="approval-sheet" data-size="lg" data-cap-modal-lock data-cap-destructive
        id="approve-sheet" aria-labelledby="ap-title" aria-describedby="ap-lead">
  <form class="cap-approval-form">
    <div class="cap-dialog-header">
      <h2 class="cap-dialog-title" id="ap-title">2 gates are waiting</h2>
      <p class="cap-dialog-description" id="ap-lead">Each command runs once, when approved. Uncheck a gate you are not ready for; it stays waiting.</p>
    </div>
    <div class="cap-dialog-body cap-approval-gates" data-flush role="group" aria-label="Gates waiting for approval">
      <fieldset class="cap-approval-gate">
        <legend class="cap-approval-job">Deploy web to production</legend>
        <p class="cap-approval-meta">job_8c21 in web, waiting 26 minutes</p>
        <pre class="cap-approval-cmd"><code>npx wrangler deploy --env production</code></pre>
        <label class="cap-check"><input type="checkbox" data-cap-part="include" name="gate" value="job_8c21" checked> Include this gate</label>
        <div class="cap-field"><label class="cap-field-label" for="ap-c1">Comment (optional)</label><textarea class="cap-input" id="ap-c1" data-cap-part="comment" rows="2"></textarea></div>
      </fieldset>
      [more gates]
    </div>
    <div class="cap-approval-error" data-cap-part="error" hidden>
      <div class="cap-alert" data-tone="crit" role="alert"><span data-cap-part="error-text"></span></div>
    </div>
    <div class="cap-dialog-footer" data-align="between">
      <button type="button" class="cap-btn" data-cap-part="cancel" autofocus>Cancel</button>
      <p class="cap-approval-none" id="ap-none" data-cap-part="none" hidden>Choose at least one gate.</p>
      <button type="submit" class="cap-btn" data-variant="primary" data-cap-part="approve"><span data-cap-part="approve-label">Approve 2 gates</span></button>
    </div>
  </form>
</dialog>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves through the gates' checkboxes and comments, then Cancel and Approve |
| Space on a checkbox | Includes or leaves out that gate; Approve's count follows |
| Enter on Approve | Approves the chosen gates; nothing when none is chosen |
| Enter or Space on Cancel | Closes the sheet; focus returns to its button |
| Esc | Closes the sheet, except while an approval is in flight |

- The dialog is named by its title; each gate is a group named by its job.
- The disabled Approve stays in the tab order with its reason as its description.
- The error is `role="alert"` and stays until the next attempt.
- Esc is held while pending by stopping the keydown as well as the cancel event, because Chrome skips the cancel event when the page has had no user activation since the last close request.
- Forced colors: the dialog's edge (shared) and the command box keep a border.
