---
name: drop-zone
title: Drop zone
summary: Choose files by browsing or dropping them, checked against type, size and count, with each refusal named in words.
parts: [css, behaviour, react]
tool: native + own JavaScript
states: [idle, file over, files refused with their reasons, several files taken, one file only, disabled, drop anywhere on the page]
added: 0.3.0
source: dustinedwards.info, app/components/admin/media-drop-anywhere.tsx, media-upload-actions.tsx, use-image-upload.ts; shadcn/ui Input (file) and Empty (Base UI flavour, nova style, commit d75a96ab787f)
replaces:
  - 'class="(dropzone|drop-zone|dropzone-area|file-drop)[ "]'
  - "className=\"(dropzone|drop-zone|file-drop)[ \"]"
  - 'addEventListener\("(dragenter|dragover)"'
---

# Drop zone

A real `<input type="file">` that looks like a surface you can drop files onto. Choosing, dragging, pasting: every way in goes through one check, and every file that does not pass is named with the reason.

**Provenance.** MIXED, against dustinedwards.info (`media-drop-anywhere.tsx`, `media-upload-actions.tsx`, `use-image-upload.ts`). EXTRACTED: the window-level drop with a `dragenter` depth counter (nested elements fire enter and leave for every one crossed), the guard that stops a dropped link or text from navigating the page away (a field still takes its own text), the status region that is in the page before anything is chosen, and "nothing uploads on drop, the person confirms". REWROTE: the site took the first file and silently left the rest out; here every file is checked (type, size, count) and every refusal is a sentence naming the file. The styling, the states and the React wrapper are new.

## When to use it

Anywhere a person adds files: the media library, an attachment on a draft, an import. Use the page mode (`data-scope="page"`) where dropping on a small target is a chore, as on the media page.

## When not to

- A single file chosen as a form field, with nothing to drop onto, is a plain `<input type="file" class="cap-input">` (the field component).
- A file already uploaded, shown with its fields, is a media tile.
- A change to a person's picture on a profile is an avatar with a button, not a zone.

## The default and its reason

- **The input is the control.** The label wraps it, so a click, and Enter or Space on the focused input, open the picker with no script (shadcn's file Input is the same native control). The input is hidden from the eye only; the label is what is drawn and what shows the focus ring.
- **Over is words and a shape: "Drop to upload", a solid thicker edge, a tint.** Never colour alone. The idle title swaps for the over title, so a person who cannot see the edge still reads what releasing does.
- **A refusal names the file and the reason**, in a box with the critical glyph and a lead ("3 files were not added"), in a `role="alert"` region: type not allowed (and what is), too big (with its size and the limit), too many (with the limit). The edge turns critical and solid too, but the words carry it.
- **What was taken is said too**, in a `role="status"` region: "3 files are ready to upload." and the list with sizes. Both regions are in the page before anything is chosen, empty, so each result is announced when it is filled.
- **Validation is one pure function.** `validateFiles(files, { accept, maxBytes, maxFiles })` returns `{ accepted, rejected }`, each rejection with its `reason` and a sentence. Type is checked first, then size, then the count, so the files that pass keep their order and the rest are named.
- **A drop never uploads.** The zone puts the accepted files into the input (so a form posts them) and tells the page with `cap-drop-accepted` and `cap-drop-rejected`. The app uploads when the person says so, or at once; that is the app's choice.
- **Drop anywhere** (`data-scope="page"`) listens on the window: while files are over it, a full-window panel says "Drop to upload". The panel does not take the pointer, so the drop is handled once. A zone of its own on the page takes its own drops first.
- **Paste** (`data-paste`) takes files from the clipboard, on the zone, or anywhere in page mode.

## The shadcn component it matches

shadcn has no drop zone. The control is its Input (type file): a native input, the same height and edge. The surface is its Empty: a dashed, centred, rounded container with an icon, a title and a line of description. Matched: both. Not in shadcn: the over, refused and accepted states, the page mode and the validation.

## Deliberately different

- **The label is the zone, the input is clipped out of sight.** shadcn's file input shows the browser's "Choose file" button; a drop surface needs the whole area to be the target, and the focus ring is drawn around it.
- **The edge is `--line-strong` (3:1)**, not shadcn's soft border: the zone is a control, so its boundary must be seen.
- **A rejected file is a sentence, not a toast.** A toast can leave before it is read; the box stays until the next choice.
- **The first file is not the only one.** The site's form took one file and said so only when more were dropped; a zone here takes as many as `maxFiles` allows and names the rest.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves to the zone (the input) and past it; the zone is one stop |
| Enter, Space on the focused zone | Opens the file picker |
| Ctrl V, Cmd V (with `data-paste`) | Takes files from the clipboard |

Dropping is a pointer gesture; the picker is its keyboard equivalent and goes through the same check.

## Accessibility

- The control is a native file input. Its name is the title ("Drop files here, or browse"; "Drop to upload" while over), its description the line of rules ("Images and PDF, up to 5 MB each, up to 4 at a time.").
- Refusals are `role="alert"`, results `role="status"`. The page-mode panel is `aria-hidden`: it repeats words the zone already carries, and a drag is not something a screen reader user does.
- The idle edge reaches 3:1 against the page; the hint is `--muted` at 4.5:1 and, while over, `--text` on the tint.
- Hit area: the whole zone, at least three controls high; density moves it.
- Forced colours: the edge is CanvasText, over is Highlight, the refusal box keeps its border.
- Reduced motion: the edge and tint change without easing.

Last checked by hand: not yet. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-drop" data-cap="drop-zone" data-max-bytes="5242880" data-max-files="4" data-paste>
  <label class="cap-drop-label">
    <input class="cap-drop-input" type="file" multiple accept="image/*,.pdf" data-cap-part="input"
           aria-labelledby="up-title" aria-describedby="up-hint" />
    <span class="cap-drop-icon" aria-hidden="true"><svg>…</svg></span>
    <span class="cap-drop-title" id="up-title">
      <span class="cap-drop-idle">Drop files here, or <span class="cap-drop-browse">browse</span></span>
      <span class="cap-drop-over">Drop to upload</span>
    </span>
    <span class="cap-drop-hint" id="up-hint">Images and PDF, up to 5 MB each, up to 4 at a time.</span>
  </label>
  <div class="cap-drop-status" role="status" data-cap-part="status"></div>
  <div class="cap-drop-rejections" role="alert" data-cap-part="rejections"></div>
</div>
```

Attributes on the zone: `data-state` (`idle`, `over`, `rejected`; set by the behaviour), `data-scope="page"` (drop anywhere; add `<div class="cap-drop-overlay" aria-hidden="true"><div><p class="cap-drop-overlay-title">Drop to upload</p>…</div></div>` as the last child), `data-max-bytes`, `data-max-files`, `data-paste`. The accepted types are the input's `accept`; a zone whose input has no `multiple` takes one file. A result written by the server (a refused file after a form post) is the same markup inside the two regions: lead `<p class="cap-drop-lead" data-tone="crit">` with the critical glyph, then `<ul class="cap-drop-files"><li>…</li></ul>`.

```ts
import { enhance, validateFiles, acceptFiles } from "capsomer/behaviour/drop-zone";
enhance(); // every [data-cap="drop-zone"]
zone.addEventListener("cap-drop-accepted", (e) => upload(e.detail.accepted));
zone.addEventListener("cap-drop-rejected", (e) => log(e.detail.rejected)); // each { file, reason: "type" | "size" | "count", message }
const { accepted, rejected } = validateFiles(files, { accept: "image/*,.pdf", maxBytes: 5 * 1024 * 1024, maxFiles: 4 }); // pure
```

`acceptFiles(zone, files)` runs the same check and the same rendering for files the app has in hand and returns the result. Also exported: `matchesAccept`, `acceptLabel`, `formatBytes`, `rejectionMessage`, `dragHasFiles`, `setInputFiles`.

```tsx
import { DropZone } from "capsomer/react/drop-zone";
<DropZone accept="image/*,.pdf" maxBytes={5 * 1024 * 1024} maxFiles={4} multiple scope="page" paste
  hint="Images and PDF, up to 5 MB each, up to 4 at a time." onAccepted={(files) => upload(files)} />
```

The React wrapper renders exactly this markup, keeps over, accepted and refused as state, and has no `style` prop.

## Exceptions in production

None yet.
