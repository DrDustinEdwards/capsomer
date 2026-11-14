---
"capsomer": patch
---

`useEditor`, `useConfigForm` and the `Editing` type live in a module of their own (`components/config-form/config-editor.react.tsx`), and `capsomer/react/config-form` re-exports them, so nothing changes for an importer. A list view that imports only `useEditor` no longer loads `ConfigForm`'s Button, Alert and Panel with it: since 0.151.0's config form drew its hint as an `Alert` and its actions as `Button`s, they had moved into the Capsid Portal's first load through its list views. On the Portal this takes 1.8 KB gzip off the initial JS of the Packages page.
