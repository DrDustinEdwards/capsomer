---
"capsomer": patch
---

Select: a server build (Vite's `import.meta.env.SSR`) leaves out `select.ts`, the listbox and the popover, since the effects that use them never run there. A Worker that renders a Select carries only its markup (about 14 KiB, 4 KiB gzip, less in Carrel). No change to the HTML contract or the browser.
