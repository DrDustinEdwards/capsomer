---
name: dialog
title: Dialog
summary: The one modal surface under every overlay: a dialog, an alert dialog, a side sheet, a bottom sheet, a palette.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [in the page until script opens it, open, alert dialog, large, side sheet right, side sheet left, bottom sheet, top palette, tall content scrolls, busy]
added: 0.2.0
source: shadcn/ui Dialog, Alert Dialog and Sheet (Base UI flavour, nova style, commit d75a96ab787f); the focus, backdrop, busy and history rules from Capsomer 0.1's confirm dialog and detail panel
replaces:
  - '<dialog\b'
  - 'showModal\('
---

# Dialog

A native `<dialog>` opened with `showModal()`. The platform supplies the top layer, the inert page behind it, the focus trap and Esc. This component supplies the rest of what a good modal needs: the look, the open and close motion, focus placed on open and handed back on close, a click on the backdrop, Esc held while a request runs, and an address entry that Back takes away. The confirm dialog, the detail panel, the command menu, the shortcut sheet and the phone's More sheet are all this dialog with different content.

## When to use it

Anything that must be dealt with before the page is used again: a short form, a question, a record opened beside its list, a palette, the views that do not fit a phone's tab bar.

## When not to

- A hint, a menu or a small panel anchored to a control is a popover (`.cap-popover`), which does not take the page away.
- A message about something that already happened is a `.cap-message`, not a dialog.
- A reversible action does not ask first; it offers Undo.
- A page of its own (a settings area, a long form) is a page, not a dialog.

## Placements and sizes

`data-placement` is `center` (default), `right`, `left`, `bottom` or `top`. `data-size` is `sm`, `md` (default) or `lg`.

- **center**: a dialog in the middle, up to `sm` 24rem, `md` 30rem, `lg` 42rem wide, never closer than 1rem to the screen edge (more where the device has a safe area).
- **right, left**: a full-height side sheet on that edge (`sm` 24rem, `md` 35rem, `lg` 48rem), at most 85% of the width on a phone so the backdrop is still there to press.
- **bottom**: a sheet on the bottom edge, the full width, as tall as its content up to the safe margin.
- **top**: a palette: centred across, near the top, so the page it searches stays in view below.

## The default and its reason

- **Footer band.** The footer sits on a muted band under a dialog (Alert Dialog's), and is a plain row under a sheet (Sheet's). Actions stack on a phone with the main one first, and sit in a row at the end from 40rem up. `data-align="between"` puts Cancel at the far end, apart from the action.
- **The body scrolls, the header and the footer stay.** A body taller than the screen scrolls inside the dialog and becomes a keyboard stop (`tabindex="0"`, added while it overflows) so the arrow keys and Page Down work.
- **A click on the backdrop closes it**, unless the dialog is locked (`data-cap-modal-lock`), an alert dialog, or busy. A press that starts inside the dialog and ends on the backdrop (selecting text) does not.
- **Focus on open**: the element with `autofocus`; for an alert dialog or one marked `data-cap-destructive`, Cancel (so Enter on arrival cannot do the damage); otherwise the first control, not the Close button.
- **Focus on close** goes back to the control that opened it, after the next frame. If that control is gone, to `data-cap-return` (a selector), then to the Close button of another dialog still open behind this one, then to `main`.
- **Busy** (`aria-busy="true"` on the dialog): Esc, Close, Cancel and the backdrop all refuse, so the answer to the request is not hidden.
- **History** (`data-cap-history`): opening pushes `#dialog-<id>`; Back closes the dialog; closing any other way takes the entry back, so Back goes where it went before.
- **In the page until script opens it** (`data-cap-inline` on a `<dialog open>`): a dialog written with `open` is not modal, so with no script it flows in the page as a card (CSS `position: static`, no shadow) and its form works as delivered. Its opener is a link to the dialog (`href="#id"` or the page that shows it), which with no script just goes to the card. `enhance()` takes it over on load: it removes `open`, so the dialog is closed, and an opener with `data-cap-dialog-open` opens it as the modal, with everything else the dialog does (focus, Esc, the backdrop). A Cancel written as a link (`<a data-cap-part="cancel" href="...">`) closes the modal and stays on the page; with no script it is a plain link that leaves. The dialog flashes in the page for the moment before script runs, which is the price of working without it.
- **The page does not scroll behind it.**
- **Motion**: a dialog fades and zooms in from 95% in 100 ms; a sheet fades and slides in 2.5rem from its edge in 200 ms; the backdrop fades with it. The same on the way out. Under `prefers-reduced-motion: reduce` nothing moves: it appears and goes.

## Keyboard

| Key | Does |
| --- | --- |
| (on open) | Focus is on the `autofocus` element, Cancel for an alert dialog, otherwise the first control |
| Tab, Shift Tab | Moves between the controls and stays inside the dialog; the page behind is inert |
| Esc | Closes the dialog and returns focus to the opener, unless it is busy |
| Enter or Space on Close or Cancel | Closes it |
| Arrow keys, Page Up, Page Down on a scrolling body | Scroll it |
| Back (browser), where `data-cap-history` is set | Closes it |

## Accessibility

- A native `dialog` opened with `showModal()` is modal: the page behind is inert and out of the accessibility tree, and focus cannot leave.
- Name it: `aria-labelledby` its title, or `aria-label` when there is no visible title (a palette). Describe it with `aria-describedby` its description or body.
- A question the person must answer is `role="alertdialog"`; it has no corner Close button and ignores the backdrop.
- The Close button is an icon button named "Close" (`aria-label`), the last control in the order, in the corner.
- Busy is `aria-busy` on the dialog and `aria-disabled` (not `disabled`) on Close and Cancel, so focus stays where it was.
- Forced colours: the dialog, the footer and the divider keep their borders.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

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
<button type="button" class="cap-btn" data-cap-dialog-open="rename">Rename…</button>
```

Parts: `cap-dialog-header` (`data-divider` adds a line under it), `-title`, `-description`, `-media` (an icon tile, `data-tone="crit|warn"`), `-body` (`data-flush` removes its padding), `-footer` (`data-align="between|start"`), `-close`. Attributes on the dialog: `data-cap-modal-lock`, `data-cap-destructive`, `data-cap-history` (its value is the prefix of the address, default `dialog`; `data-cap-history-id` the id, default the dialog's `id`), `data-cap-return` (selector), `data-cap-open` (opens when enhanced).

In the page until script opens it:

```html
<p><a class="cap-btn" href="#rename" data-cap-dialog-open="rename">Rename the site…</a></p>
<dialog class="cap-dialog" data-cap="dialog" data-cap-inline open data-placement="center" data-size="md" id="rename" aria-labelledby="rename-title">
  <form method="post" action="/admin/sites/foxhound/rename">
    <div class="cap-dialog-header"><h2 class="cap-dialog-title" id="rename-title">Rename the site</h2></div>
    <div class="cap-dialog-body"><label for="name">Site name</label><input class="cap-input" id="name" name="name" /></div>
    <div class="cap-dialog-footer">
      <a class="cap-btn" href="/admin/sites/foxhound" data-cap-part="cancel">Cancel</a>
      <button type="submit" class="cap-btn" data-variant="primary">Save name</button>
    </div>
  </form>
</dialog>
```

```ts
import { enhance, openDialog, closeDialog, setDialogBusy } from "capsomer/behaviour/dialog";
enhance(); // every [data-cap="dialog"] and every [data-cap-dialog-open] trigger
openDialog(dialogEl, buttonEl, { history: true, focus: fieldEl, returnTo: mainEl });
setDialogBusy(dialogEl, true); // hold Esc, Close, Cancel and the backdrop
closeDialog(dialogEl);
```

The helpers every overlay shares are exported from here: `rememberOpener`, `returnFocus`, `isBackdropClick`, `errorText`, `uid`, `isBusy`, `isLocked`, `focusInitial`, `syncScroll`, `historyHash`, `wireDialog`.

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

`Dialog` renders exactly the markup above, so its content is in the server's HTML; `aria-labelledby` points at the `DialogTitle` (leave it out and pass `aria-label` for a palette), and `aria-describedby` at the `DialogDescription` once it mounts (pass `described` to have it in the server's HTML). Props: `open`, `onOpenChange`, `placement`, `size`, `alert`, `modalLock`, `destructive`, `busy`, `history`, `historyId`, `closeButton`, `returnTo`, `initialFocus`.

## Matches shadcn

Dialog, Alert Dialog and Sheet, in the nova style: the black-tinted backdrop with a light blur, the popover surface with a hairline ring and the large shadow, the header, title, description and footer parts, the muted footer band, the close button in the corner, zoom-in-95 with a fade at 100 ms for a dialog, a slide with a fade at 200 ms for a sheet, `sm` and default sizes, the media tile and the small alert dialog's two-column footer.

## Deliberately different

- **One element for all three.** shadcn has three components; here a dialog, an alert dialog and a sheet are one `<dialog>` with `role="alertdialog"` and `data-placement`, because they share every rule above.
- **`top` is a palette, not a top sheet.** shadcn's top sheet is full width; Capsomer's command menu needs a centred panel near the top, and a full-width top sheet has no use here yet.
- **Sheets are at most 85% wide on a phone** (shadcn: 75%), so a record's columns still fit, with the backdrop left to press.
- **Surfaces use Capsomer's tokens**: `--raised` for the popover surface, `--sunken` for the footer band, `--line` for the hairline, the title in the 800 weight Capsomer headings use.
- **A native element, not a portal.** The top layer and the inert page come from `showModal()`; there is no focus-guard markup.
- **An alert dialog ignores the backdrop** as shadcn's does, and so does any dialog with `data-cap-modal-lock`.

## Exceptions in production

None yet.
