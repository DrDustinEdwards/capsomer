---
"capsomer": patch
---

**Click-only modules stay out of server bundles.** The sheet drag (`dialog-drag`), the shortcut sheet, the header search and the React markdown editor's behavior module skip their `import()` when Vite's `import.meta.env.SSR` is set, as the CodeMirror view did in 0.145.1, so a server build drops chunks it could never run (dustinedwards.info's Worker: about 13 KiB raw, 6 KiB gzip). Outside Vite nothing changes. No token, class or HTML contract changes.
