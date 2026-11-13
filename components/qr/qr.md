---
name: qr
title: QR code
summary: A QR code for one absolute address, drawn as an SVG from the matrix the site's encoder returns, black on white in every theme, named for what it opens and with the address in text under it.
parts: [css, react]
tool: native
states: [default with what it is for and its address, large with the address alone, dark theme keeps black on white, forced colors]
added: 0.98.0
updated: 0.98.0
source: dustinedwards.info, app/kb/procedures/qr.mjs (sheetQr, on uqr's renderSVG) and the procedure sheet's figure (app/components/procedure.tsx, app/styles/procedure.css .procedure-sheet-qr)
replaces:
  - '\.procedure-sheet-qr\s*\{'
  - 'renderSVG\([^)]*\)'
---

# QR code

A code a phone scans to open a page: on a printed sheet, a poster, a slide. `.cap-qr` from `capsomer/qr.css`; `Qr` from `capsomer/react/qr`; `qrPath` and the other pure helpers from `capsomer/behavior/qr`. The SVG is drawn on the server and is in the HTML, so the sheet needs no script and a machine reading the page finds the address.

Capsomer carries no QR encoder: an encoder is a dependency, and the family already has one in the site that needs it. The site encodes the address and passes the module matrix (`boolean[][]`, dark is `true`), without its border; Capsomer draws it. With uqr, the encoder dustinedwards.info uses: `encode(url, { ecc: "M", border: 0 }).data`.

## When to use it

- A printed page that should lead back to its version online.
- A screen shown to a room, where people open a link on their own phones.

## When not to

- A link a reader can click on the page they are on: a link.
- Anything but an address: a code the reader cannot see into should only ever open a page.

## The default and its reason

- **Black on white with a quiet zone in every theme**, two modules wide by default, because a scanner reads contrast; the ground is drawn in the SVG and the code takes `forced-color-adjust: none`, so a dark theme or forced colors never invert it. These two colors are the one place Capsomer draws literal colors: they are the code's, not the family's.
- **Medium error correction** (`ecc: "M"`) at the encoder survives a smudged or folded sheet.
- **One path, crisp edges**: each row's runs of dark modules are one rectangle, so the markup stays small (about 4 KB for a short address).
- **Only an absolute http(s) address.** `Qr` throws on anything else (`checkQrUrl`).
- **Named for what it opens** ("QR code for https://…"), and **the address is shown as text** under it, broken anywhere, so a reader with no scanner can type it.
- **6.5rem across**, the size of the procedure sheet's code; `data-size="lg"` (React: `size="lg"`) is 10rem for a poster or a slide.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Passes it: the code is an image, not a control |

## Accessibility

- The SVG is `role="img"` named "QR code for {url}"; the figure's caption says what it is for and gives the address.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<figure class="cap-qr">
  <svg class="cap-qr-code" viewBox="0 0 33 33" role="img" aria-label="QR code for https://example.com/guides/getting-started" shape-rendering="crispEdges">
    <rect width="33" height="33" fill="#ffffff" />
    <path d="M2 2h7v1h-7z…" fill="#000000" />
  </svg>
  <figcaption class="cap-qr-caption">Scan to open this guide online.<span class="cap-qr-url">https://example.com/guides/getting-started</span></figcaption>
</figure>
```

The path is `qrPath(modules, quiet)` and the view box side `qrSize(modules, quiet)`.

```tsx
import { encode } from "uqr";
import { Qr } from "capsomer/react/qr";

<Qr url={address} modules={encode(address, { ecc: "M", border: 0 }).data} caption="Scan to open this version online." />
```

## Exceptions in production

None yet.
