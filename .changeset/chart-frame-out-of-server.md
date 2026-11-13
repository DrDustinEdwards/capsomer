---
"capsomer": patch
---

**The chart enhancer stays out of server bundles.** The React chart frame skips its `enarratio/enhance` import when Vite's `import.meta.env.SSR` is set, as the click-only modules did, so a server build drops a chunk it could never run. Outside Vite nothing changes. No token, class or HTML contract changes.
