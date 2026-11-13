---
name: drop-zone
title: Drop zone
summary: Choose files by browsing or dropping them, checked against type, size and count, with each refusal named in words.
parts: [css, behavior, react]
tool: native + own JavaScript
states: [idle, file over, files refused with their reasons, several files taken, one file only, the app lists the files itself, disabled, drop anywhere on the page]
added: 0.3.0
updated: 0.37.0
source: dustinedwards.info, app/components/admin/media-drop-anywhere.tsx, media-upload-actions.tsx, use-image-upload.ts; shadcn/ui Input (file) and Empty (Base UI flavor, nova style, commit d75a96ab787f)
replaces:
  - 'class="(dropzone|drop-zone|dropzone-area|file-drop)[ "]'
  - "className=\"(dropzone|drop-zone|file-drop)[ \"]"
  - 'addEventListener\("(dragenter|dragover)"'
---

# Drop zone

## Usage

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

```ts
import { enhance, validateFiles, acceptFiles } from "capsomer/behavior/drop-zone";
enhance(); // every [data-cap="drop-zone"]
zone.addEventListener("cap-drop-accepted", (e) => upload(e.detail.accepted));
zone.addEventListener("cap-drop-rejected", (e) => log(e.detail.rejected)); // each { file, reason: "type" | "size" | "count", message }
const { accepted, rejected } = validateFiles(files, { accept: "image/*,.pdf", maxBytes: 5 * 1024 * 1024, maxFiles: 4 }); // pure
```

```tsx
import { DropZone } from "capsomer/react/drop-zone";
<DropZone accept="image/*,.pdf" maxBytes={5 * 1024 * 1024} maxFiles={4} multiple scope="page" paste
  hint="Images and PDF, up to 5 MB each, up to 4 at a time." onAccepted={(files) => upload(files)} />
// An app that shows its own upload queue:
<DropZone accept="image/*" multiple acceptedList={false} onAccepted={(files) => queue.add(files)} />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Shift Tab | Moves to the zone (the input) and past it; the zone is one stop |
| Enter, Space on the focused zone | Opens the file picker |
| Ctrl V, Cmd V (with `data-paste`) | Takes files from the clipboard |

Dropping is a pointer gesture; the picker is its keyboard equivalent and goes through the same check.

- The control is a native file input. Its name is the title ("Drop files here, or browse"; "Drop to upload" while over), its description the line of rules ("Images and PDF, up to 5 MB each, up to 4 at a time.").
- Refusals are `role="alert"`, results `role="status"`. The page-mode panel is `aria-hidden`: it repeats words the zone already carries, and a drag is not something a screen reader user does.
- The idle edge reaches 3:1 against the page; the hint is `--muted` at 4.5:1 and, while over, `--text` on the tint.
- Hit area: the whole zone, at least three controls high; density moves it.
- Forced colors: the edge is CanvasText, over is Highlight, the refusal box keeps its border.
- Reduced motion: the edge and tint change without easing.
