---
"capsomer": patch
---

**The markdown editor's CodeMirror stays out of server bundles.** `mountMarkdownEditor` refuses before its `import()` when Vite's `import.meta.env.SSR` is set, so a server build drops the CodeMirror chunk it could never run (Carrel's Worker: about 300 KB raw). Outside Vite nothing changes. No token, class or HTML contract changes.
