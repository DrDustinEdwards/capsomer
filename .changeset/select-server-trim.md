---
"capsomer": patch
---

Select and SearchSuggest: a server build (Vite's `import.meta.env.SSR`) leaves out their browser scripts (`select.ts`, `search-suggest.ts` and, where nothing else uses them, the listbox and the popover), since the effects that use them never run there. A Worker that renders them carries only their markup (Carrel 14 KiB smaller, Foxing 16 KiB). No change to the HTML contract or the browser.
