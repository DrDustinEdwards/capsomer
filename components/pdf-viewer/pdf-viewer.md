---
name: pdf-viewer
title: PDF viewer
summary: A PDF's current page drawn in the page by PDF.js, with page-through, zoom and the keyboard, and a link to the file.
parts: [css, behavior, react]
tool: own JavaScript (PDF.js, hosted by the site)
states: [loading, a page shown, last page, failed to load]
added: 0.94.0
source: txasm's PdfViewer (app/components/pdf-viewer.tsx, app/islands/pdf-viewer.ts, app.css .pdf-viewer)
replaces:
  - 'class="pdf-viewer'
  - 'className="pdf-viewer'
---

# PDF viewer

## Usage

```html
<div class="cap-pdf" role="group" aria-label="PDF viewer, Spring newsletter" data-cap="pdf-viewer" data-src="/documents/spring/inline" data-pdfjs="/pdfjs/">
  <div class="cap-pdf-bar">
    <div class="cap-btn-group" role="group" aria-label="Pages">
      <button type="button" disabled class="cap-btn" data-size="sm" aria-label="Previous page" data-pdf="prev">Previous</button>
      <button type="button" disabled class="cap-btn" data-size="sm" aria-label="Next page" data-pdf="next">Next</button>
    </div>
    <p class="cap-pdf-status" aria-live="polite" data-pdf="status">Loading</p>
    <div class="cap-pdf-zoom" role="group" aria-label="Zoom">
      <button type="button" disabled class="cap-btn" data-size="sm" aria-label="Zoom out" data-pdf="zoom-out">Zoom out</button>
      <span class="cap-pdf-zoom-value" data-pdf="zoom">120%</span>
      <button type="button" disabled class="cap-btn" data-size="sm" aria-label="Zoom in" data-pdf="zoom-in">Zoom in</button>
    </div>
  </div>
  <div tabindex="0" class="cap-pdf-page" role="group" aria-label="PDF viewer, Spring newsletter. Use the arrow keys to change page and the plus and minus keys to zoom."><canvas></canvas></div>
  <p class="cap-pdf-fallback"><a href="/documents/spring/inline">Open the PDF</a></p>
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through Previous, Next, Zoom out, Zoom in, the page, the link |
| Left Arrow, Page Up | The page before (on the page) |
| Right Arrow, Page Down | The page after |
| Home, End | The first page, the last |
| + or =, - | Zoom in, zoom out |

- A group named "PDF viewer, (title)"; the page indicator is a polite live region, so a page change is announced.
- Buttons are disabled at the ends and while loading.
- The canvas is a picture of the page: the link under it is the accessible copy (the PDF's own tags, if it has them).
