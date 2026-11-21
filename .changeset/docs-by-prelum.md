---
"capsomer": patch
---

The showcase renders each component's Accessibility and Keyboard docs with Prelum (v0.63.7), the one Markdown pipeline, and deletes its own renderer (`site/markdown.ts`'s `renderMarkdown`). The docs' HTML contract on the showcase changes: tables are Prelum's `.table-scroll` and headings carry its anchors, set in a `.site-doc` reading context that keeps the docs' face and table look. The package is unchanged.
