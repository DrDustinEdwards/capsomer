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

A document page that shows a PDF in place: a bar with Previous and Next, "Page 2 of 14" and zoom, over the current page drawn on a canvas, and a plain "Open the PDF" link under it.

## When to use it

An archive or a document page whose PDF a reader should be able to page through without leaving: a newsletter, an abstract book, a program.

## When not to

- **A PDF someone downloads to keep**: a link with the file's size.
- **Text that could be HTML**: publish the HTML; a PDF is the last resort for reading on a phone.

## The default and its reason

- **PDF.js, never bundled.** The site serves pdfjs-dist's build under one folder (`data-pdfjs`, default `/pdfjs/`): `pdf.min.mjs`, `pdf.worker.min.mjs`, and the `wasm`, `iccs`, `standard_fonts` and `cmaps` folders. The module imports it at runtime, so no bundle carries it and a page with no viewer loads none of it. The wasm decoders matter: without them, scanned (JBIG2, JPEG 2000) pages draw blank.
- **The link to the PDF is always in the page**, under the viewer, so the file is reachable with no script, with a failed load and for assistive technology (a canvas has no text).
- **A failed load says so** in place of the page, with the same link.
- **The canvas holds a US Letter page** at the default scale until the first page is drawn, so the page does not jump (CLS).
- **Zoom 50% to 300%** in 25% steps, from 120%.
- **The page takes focus**, so the keys below reach it; its name says which keys.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through Previous, Next, Zoom out, Zoom in, the page, the link |
| Left Arrow, Page Up | The page before (on the page) |
| Right Arrow, Page Down | The page after |
| Home, End | The first page, the last |
| + or =, - | Zoom in, zoom out |

## Accessibility

- A group named "PDF viewer, (title)"; the page indicator is a polite live region, so a page change is announced.
- Buttons are disabled at the ends and while loading.
- The canvas is a picture of the page: the link under it is the accessible copy (the PDF's own tags, if it has them).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

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

React: `PdfViewer` from `capsomer/react/pdf-viewer` takes `src`, `title` and `pdfjs`. A page with no React calls `enhance()` from `capsomer/behavior/pdf-viewer`. Load `pdf-viewer.css` and `button.css`.

## Exceptions in production

None yet.
