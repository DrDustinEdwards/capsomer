---
"capsomer": patch
---

The site header's theme key no longer brings the shortcuts sheet with it. It registers through the new `registerKey` (`capsomer/behavior/shortcuts`), which adds a shortcut without installing "?", so the key keeps every guard of the registry (typing, a modal, a composition, the single-keys switch) and is listed in the sheet whenever something else on the page offers one. Since 0.151.0 the header used `register`, which also installs "?" and its lazy import of the sheet; a classic `/site.js` (devkit's siteScript) inlines that import, so every public page of txasm grew by the registry's sheet code, about 5.6 KB raw (2.4 KB gzip with the rest of 0.151). On a page whose only shortcut is the theme key, "?" does nothing again, as before 0.151.0. No token, class or HTML contract changes.
