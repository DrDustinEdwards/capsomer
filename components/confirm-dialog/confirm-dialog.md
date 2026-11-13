---
name: confirm-dialog
title: Confirm dialog
summary: Preview, then perform, for an action that cannot be undone.
parts: [css, behavior, react]
tool: native + own JavaScript (the shared dialog)
states: [the confirm page, the confirm page after the server refused, open, busy, failed with Try again, reason required and empty, typed-word guard not typed, typed-word guard matched]
added: 0.1.0
updated: 0.131.0
source: Capsid Portal, dashboard/src/app/ConfirmDialog.tsx and styles.css (.help), as of capsid master 2026-10-01; dustinedwards.info app/components/admin/confirm-dialog.tsx for the typed word
replaces:
  - 'className="(help )?confirm'
  - '(?<![\w/.-])confirm-dialog'
  - 'window\.confirm\('
---

# Confirm dialog

## Usage

```html
<dialog class="cap-dialog" data-cap="confirm-dialog" data-placement="center" data-size="md" role="alertdialog"
        id="revoke" aria-labelledby="revoke-title" aria-describedby="revoke-desc revoke-list">
  <div class="cap-dialog-header">
    <div class="cap-dialog-media" data-tone="crit" aria-hidden="true"><svg>…</svg></div>
    <h2 class="cap-dialog-title" id="revoke-title">Revoke deploy-agent?</h2>
    <p class="cap-dialog-description" id="revoke-desc">This cannot be undone. The agent stops working at once.</p>
  </div>
  <div class="cap-dialog-body">
    <ul id="revoke-list"><li>Its key stops being accepted.</li><li>Its 1 claimed job goes back to the queue.</li></ul>
    <!-- Only where the audit row carries a reason: -->
    <div class="cap-confirm-reason">
      <label for="revoke-reason">Reason (required)</label>
      <textarea class="cap-input" id="revoke-reason" rows="3" aria-required="true" aria-describedby="revoke-reason-note" data-cap-part="reason"></textarea>
      <p class="cap-confirm-note" id="revoke-reason-note" data-cap-part="reason-note">Recorded with the change.</p>
    </div>
    <!-- Only for what cannot be recovered: -->
    <div class="cap-confirm-typed">
      <label id="revoke-typed-label" for="revoke-typed">Type <b>revoke</b> to confirm</label>
      <input class="cap-input" id="revoke-typed" autocomplete="off" spellcheck="false" data-cap-part="typed" data-cap-word="revoke">
    </div>
  </div>
  <div class="cap-confirm-error" role="alert" id="revoke-error" data-cap-part="error"></div>
  <div class="cap-dialog-footer" data-align="between">
    <button type="button" class="cap-btn" data-cap-part="cancel">Cancel</button>
    <button type="button" class="cap-btn" data-variant="danger" data-cap-part="perform">Revoke agent</button>
  </div>
</dialog>
<button type="button" class="cap-btn" data-variant="danger" data-cap-confirm-open="revoke">Revoke deploy-agent…</button>
```

```js
import { confirm } from "capsomer/behavior/confirm-dialog";
const done = await confirm({
  title: "Revoke deploy-agent?",
  lead: "This cannot be undone.",
  body: ["Its key stops being accepted.", "Its 1 claimed job goes back to the queue."],
  action: "Revoke agent",
  reason: {}, // only where the audit row carries a reason; perform gets it
  typeToConfirm: "revoke", // only for what cannot be recovered
  perform: (reason) => api.revoke("deploy-agent", reason), // reject with an Error whose message says what happened
});
```

```html
<form class="cap-confirm-page" data-cap="confirm-page" action="/admin/sites/example" method="post"
      aria-labelledby="del-title" aria-describedby="del-desc del-list">
  <input type="hidden" name="intent" value="delete" /><input type="hidden" name="site" value="example" />
  <div class="cap-dialog-header">
    <div class="cap-dialog-media" data-tone="crit" aria-hidden="true"><svg>…</svg></div>
    <h1 class="cap-dialog-title" id="del-title">Delete example.com?</h1>
    <p class="cap-dialog-description" id="del-desc">This cannot be undone.</p>
  </div>
  <div class="cap-dialog-body">
    <ul id="del-list"><li>Its 14 checks stop running.</li></ul>
    <div class="cap-confirm-reason"><label for="del-reason">Reason (required)</label>
      <textarea class="cap-input" id="del-reason" name="reason" rows="3" required></textarea></div>
    <div class="cap-confirm-typed"><label for="del-typed">Type <b>delete</b> to confirm</label>
      <input class="cap-input" id="del-typed" name="confirm" required pattern="[Dd][Ee][Ll][Ee][Tt][Ee]" title="Type delete" autocomplete="off" spellcheck="false" /></div>
  </div>
  <div class="cap-confirm-error" role="alert"><!-- empty, or what the server refused --></div>
  <div class="cap-dialog-footer" data-align="between">
    <a class="cap-btn" href="/admin/sites/example">Cancel</a>
    <button type="submit" class="cap-btn" data-variant="danger">Delete site</button>
  </div>
</form>
```

```tsx
<ConfirmModal title="Delete this mention" lead="This removes the only copy of it." typeToConfirm="1" action_label="Delete permanently" cancelHref={cancelHref} onCancel={() => navigate(cancelHref)} renderForm={(p) => <Form {...p} />}>
  <input type="hidden" name="intent" value="delete" />
</ConfirmModal>
```

```tsx
<Form method="post" onSubmit={(e) => confirmSubmit(e, { title: `Remove ${sponsor.name}?`, action: "Remove sponsor" })}>
```

## Accessibility

| Key | Does |
| --- | --- |
| (on open) | Focus is on Cancel |
| Tab, Shift Tab | Moves between the fields (when there are any), Cancel and the action; stays inside the dialog |
| Ctrl Enter, Cmd Enter in the reason field | Performs; with the reason empty, says a reason is required and keeps focus in the field |
| Enter or Space on Cancel | Closes; focus returns to the opener |
| Enter or Space on the action | Performs; the dialog shows busy until it ends |
| Enter in the typed-word field | Performs once the word matches |
| Esc | Closes, unless the action is running |

- A native `dialog` opened with `showModal()` with `role="alertdialog"`: the page behind is inert, and the dialog is named by its title (`aria-labelledby`) and described by its lead and its list of changes (`aria-describedby`).
- The confirm page is a `form` named by its title and described by its lead and its list of changes, so it is a named `form` landmark. It carries no `role`: `group` is not an allowed role for `form` (ARIA in HTML; axe `aria-allowed-role`).
- The error is `role="alert"`, present and empty until it is needed, so it is announced when filled.
- The guard's reason is the perform button's description, so a screen reader hears why it is off.
- An empty reason is `aria-invalid="true"` and described by the error box; the border also turns critical, never alone.
- Forced colors: the dialog and the error keep their borders.
- Focus is on Cancel on open, so Enter on arrival cannot do the damage.
