---
"capsomer": patch
---

The error page no longer pulls ButtonLink, the router link or Button into an app's root bundle. Its actions are plain `a.cap-btn` links drawn with the shared look mapper (the same HTML as before), and `buttonAttrs` and `ButtonLook` moved into a module of their own (`components/button/button-look.ts`) that Button, ButtonLink and the error page import. `capsomer/react/button` still exports both. On the Capsid Portal this takes 2.2 KB gzip off the initial JS that v0.150.0 added.
