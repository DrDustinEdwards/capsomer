---
name: file-attach
title: File attach
summary: Attach files to a record from a button, checked before anything is sent, and listed after.
parts: [css, react]
tool: native + own JavaScript (React)
states: [files attached, none yet, uploading, full, read only with its reason, refused]
added: 0.118.0
source: Foxhound, app/components/dispute-detail-parts.tsx (EvidenceFiles)
replaces:
  - 'type="file"[^>]*className="sr-only"'
  - 'No files uploaded'
---

# File attach

## Usage

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

## Accessibility

| Key | Does |
| --- | --- |
| Tab | To the upload button, then each file's link and remove control |
| Enter or Space on the button | Opens the file picker |
