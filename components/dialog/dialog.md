---
name: dialog
title: Dialog
summary: "The one modal surface under every overlay: a dialog, an alert dialog, a side sheet, a bottom sheet, a palette."
group: primitive
parts: [css, behavior, react]
tool: native + own JavaScript
states: [in the page until script opens it, open, alert dialog, large, side sheet right, side sheet left, bottom sheet, top palette, tall content scrolls, busy]
added: 0.2.0
source: shadcn/ui Dialog, Alert Dialog and Sheet (Base UI flavor, nova style, commit d75a96ab787f); the focus, backdrop, busy and history rules from Capsomer 0.1's confirm dialog and detail panel
replaces:
  - '<dialog\b'
  - 'showModal\('
---

# Dialog

## Usage

```html
<dialog class="cap-dialog" data-cap="dialog" data-placement="center" data-size="md"
        id="rename" aria-labelledby="rename-title" aria-describedby="rename-desc">
  <div class="cap-dialog-header">
    <h2 class="cap-dialog-title" id="rename-title">Rename the site</h2>
    <p class="cap-dialog-description" id="rename-desc">Visitors keep the old address.</p>
  </div>
  <div class="cap-dialog-body">…</div>
  <div class="cap-dialog-footer">
    <button type="button" class="cap-btn" data-cap-part="cancel">Cancel</button>
    <button type="button" class="cap-btn" data-variant="primary">Save name</button>
  </div>
  <button type="button" class="cap-btn cap-dialog-close" data-variant="quiet" data-icon-only
          data-cap-part="close" aria-label="Close">…</button>
</dialog>
<button type="button" class="cap-btn" commandfor="rename" command="show-modal" data-cap-dialog-open="rename">Rename…</button>
```

```html
<p><a class="cap-btn" href="#rename" data-cap-dialog-open="rename">Rename the site…</a></p>
<dialog class="cap-dialog" data-cap="dialog" data-cap-inline open data-placement="center" data-size="md" id="rename" aria-labelledby="rename-title">
  <form method="post" action="/admin/sites/example/rename">
    <div class="cap-dialog-header"><h2 class="cap-dialog-title" id="rename-title">Rename the site</h2></div>
    <div class="cap-dialog-body"><label for="name">Site name</label><input class="cap-input" id="name" name="name" /></div>
    <div class="cap-dialog-footer">
      <a class="cap-btn" href="/admin/sites/example" data-cap-part="cancel">Cancel</a>
      <button type="submit" class="cap-btn" data-variant="primary">Save name</button>
    </div>
  </form>
</dialog>
```

```ts
import { enhance, openDialog, closeDialog, setDialogBusy } from "capsomer/behavior/dialog";
enhance(); // every [data-cap="dialog"] and every [data-cap-dialog-open] trigger
openDialog(dialogEl, buttonEl, { history: true, focus: fieldEl, returnTo: mainEl });
setDialogBusy(dialogEl, true); // hold Esc, Close, Cancel and the backdrop
closeDialog(dialogEl);
```

```tsx
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose, useDialog } from "capsomer/react/dialog";

const d = useDialog();
<button onClick={d.show}>Rename…</button>
<Dialog {...d.props} size="md">
  <DialogHeader><DialogTitle>Rename the site</DialogTitle><DialogDescription>Visitors keep the old address.</DialogDescription></DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter><DialogClose part="cancel">Cancel</DialogClose><button className="cap-btn" data-variant="primary">Save name</button></DialogFooter>
</Dialog>
```

## Accessibility

| Key | Does |
| --- | --- |
| (on open) | Focus is on the `autofocus` element, Cancel for an alert dialog, otherwise the first control |
| Tab, Shift Tab | Moves between the controls and stays inside the dialog; the page behind is inert |
| Esc | Closes the dialog and returns focus to the opener, unless it is busy |
| Enter or Space on Close or Cancel | Closes it |
| Arrow keys, Page Up, Page Down on a scrolling body | Scroll it |
| Back (browser), where `data-cap-history` is set | Closes it |

- A native `dialog` opened with `showModal()` is modal: the page behind is inert and out of the accessibility tree, and focus cannot leave.
- Name it: `aria-labelledby` its title, or `aria-label` when there is no visible title (a palette). Describe it with `aria-describedby` its description or body.
- A question the person must answer is `role="alertdialog"`; it has no corner Close button and ignores the backdrop.
- The Close button is an icon button named "Close" (`aria-label`), the last control in the order, in the corner.
- Busy is `aria-busy` on the dialog and `aria-disabled` (not `disabled`) on Close and Cancel, so focus stays where it was.
- Forced colors: the dialog, the footer and the divider keep their borders.
