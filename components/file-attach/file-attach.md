---
name: file-attach
title: File attach
summary: Attach files to a record from a button, checked before anything is sent, with the attached files listed.
parts: [css, react]
tool: native + own JavaScript (React)
states: [files attached, none yet, uploading, full, read only with its reason, refused]
added: 0.91.0
source: Foxhound, app/components/dispute-detail-parts.tsx (EvidenceFiles)
replaces:
  - 'type="file"[^>]*className="sr-only"'
  - 'No files uploaded'
---

# File attach

The drop zone's file input drawn as a button, for a panel with no room for a zone: "Upload file", the limits beside it, each refusal in words, and the files already attached with their own remove control.

## When to use it

Attachments on one record (evidence on a dispute, a figure on an abstract), added one choice at a time.

## When not to

- Many files at once, or a page people drop onto: the drop zone.
- One file chosen as a form field and sent with the form: a plain `input type="file"` in a field.

## The default and its reason

- **The label is the button; the input keeps the keyboard.** The input is clipped out of sight, so Tab reaches it, Enter or Space opens the picker with no script, and the ring is drawn around the button.
- **The drop zone's checks run first** (`validateFiles`: type, size, then the room left under `maxFiles`), and a refusal names the file and the reason in an alert. Nothing is sent for a refused file.
- **A file that passes is the app's to send at once** (`onFiles`, a fetcher submit of the input's form); with no script an Upload button posts the form. The input clears when the upload finishes, so the same file can be chosen again.
- **`form`** places the input in a form elsewhere on the page, as attachments usually sit inside another form.
- **`unavailable`** (read only, no storage) puts the reason in the button's place; remove controls go with it.
- **A link to a file opens in a new tab and says so.**

## Keyboard

| Key | Does |
| --- | --- |
| Tab | To the upload button, then each file's link and remove control |
| Enter or Space on the button | Opens the file picker |

## Accessibility

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<div class="cap-attach">
  <div class="cap-attach-control">
    <span class="cap-attach-button">
      <input class="cap-attach-input" id="up" type="file" name="file" accept=".pdf" aria-describedby="up-hint" />
      <label for="up" class="cap-btn" data-size="sm">Upload file</label>
    </span>
    <span class="cap-attach-hint" id="up-hint">PDF, up to 4.5 MB</span>
  </div>
  <p class="cap-field-error" role="alert" hidden></p>
  <ul class="cap-attach-list">
    <li class="cap-attach-item">
      <a href="/files/f1" target="_blank" rel="noopener noreferrer">receipt.pdf<span class="cap-sr-only"> (opens in a new tab)</span></a>
      <span class="cap-attach-item-end">
        <span class="cap-attach-meta">Nov 3</span>
        <button type="submit" class="cap-btn" data-size="sm" data-variant="quiet">Remove file<span class="cap-sr-only"> receipt.pdf</span></button>
      </span>
    </li>
  </ul>
</div>
```

React: `import { FileAttach } from "capsomer/react/file-attach"`.

## Exceptions in production

None yet.
