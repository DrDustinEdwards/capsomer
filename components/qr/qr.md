---
name: qr
title: QR code
summary: A QR code for one absolute address, drawn as an SVG, named for what it opens.
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

## Usage

```html
<figure class="cap-qr">
  <svg class="cap-qr-code" viewBox="0 0 33 33" role="img" aria-label="QR code for https://example.com/guides/getting-started" shape-rendering="crispEdges">
    <rect width="33" height="33" fill="#ffffff" />
    <path d="M2 2h7v1h-7z…" fill="#000000" />
  </svg>
  <figcaption class="cap-qr-caption">Scan to open this guide online.<span class="cap-qr-url">https://example.com/guides/getting-started</span></figcaption>
</figure>
```

```tsx
import { encode } from "uqr";
import { Qr } from "capsomer/react/qr";

<Qr url={address} modules={encode(address, { ecc: "M", border: 0 }).data} caption="Scan to open this version online." />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Passes it: the code is an image, not a control |

- The SVG is `role="img"` named "QR code for {url}"; the figure's caption says what it is for and gives the address.
- Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.
