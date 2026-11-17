---
"capsomer": patch
---

`bundleScript` (capsomer/build) throws when an import does not resolve. It used to keep the import as a bare specifier in the bundle, which a browser cannot load, so the whole script died on load (the Prelum specimen's theme button, 0.61.0). No token, class or HTML contract changes.
