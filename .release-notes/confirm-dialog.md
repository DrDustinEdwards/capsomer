# Confirm dialog (rebuilt on the shared dialog)

- Markup: the dialog is now `role="alertdialog"` with `data-placement="center" data-size="md"`. Give it a header: `<div class="cap-dialog-header">` holding an optional `.cap-dialog-media`, the `.cap-dialog-title` and the lead as `<p class="cap-dialog-description">`. The list of changes (and the reason and typed-word fields) go in `<div class="cap-dialog-body">`.
- Classes renamed: `.cap-dialog-actions` is now `.cap-dialog-footer` (add `data-align="between"` to keep Cancel and the action apart); `.cap-dialog-reason` is `.cap-confirm-reason`; `.cap-dialog-typed` is `.cap-confirm-typed`; `.cap-dialog-note` is `.cap-confirm-note`; `.cap-dialog-error` is `.cap-confirm-error` and `.cap-dialog-error-lead` is `.cap-confirm-error-lead`. The error box now sits after the body, not inside it.
- `aria-describedby` names the description and the list (`id-desc id-list`), not the whole body.
- Tests and selectors that look for the dialog by `role=dialog` must use `role=alertdialog`.
- Load `dialog.css` (it is the surface now); `confirm-dialog.css` no longer defines any `.cap-dialog*` rule, and the 0.1 light panel look (`--surface`, `--line-strong`, 480px) is gone.
- Code: `buildConfirm`, `confirm`, `enhance`, `ConfirmDialog` keep their signatures; `ConfirmOptions` and `ConfirmDialogProps` gain optional `media`. `wire(dialog)` is idempotent and also wires the shared dialog's rules. React: `ConfirmDialog` renders the shared `Dialog` (so its element has `data-cap="dialog"`).
- The error and reason copy, the typed-word guard, busy and Try again behave as before.
