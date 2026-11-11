---
name: document
title: Document
summary: The page's root: its family and site layer from the first byte, which routes hydrate, and the start of a page that sends no React.
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.101.0
source: bsw and julieedwards-info root.tsx, germomics root.tsx and app/lib/hydration.ts, txasm root.tsx and app/site.ts, Foxhound's hand-set data-cap-site wrappers
replaces:
  - 'data-cap-site="'
---

# Document

The root every site writes: `<html>` under its family and site layer, the head every page needs, React Router's scripts only on a route that hydrates, and the site's own script on every other page.

## The default and its reason

- **A page sends no React unless a route asks to hydrate** (`handle = { hydrate: true }`, or a function of the loader data). Reading a page needs no app; its menus, theme button and tabs run from the site's script, wiring the markup the server rendered.
- **The family and site layer are on `<html>`**, so the first paint is in the site's colours and faces, with no flash.
- **`startSite` runs each part on its own.** One part that throws is reported and the rest still run, so a broken island never takes the header with it.
- **The site's script is same-origin and deferred**, so `script-src 'self'` allows it with no nonce.

## Use

```tsx
// app/root.tsx
import { Document, routeHydrates } from "capsomer/react/document";
import { ThemeColor } from "capsomer/react/theme-switch";

export function Layout({ children }: { children: React.ReactNode }) {
  const hydrate = routeHydrates(useMatches());
  return (
    <Document family="navy" site="txasm" hydrate={hydrate} script="/site.js" head={<ThemeColor ground={GROUND} />}>
      {children}
    </Document>
  );
}
```

```ts
// app/site.ts, bundled to /site.js
import { startPage } from "@dustinedwards/site-runtime/page-client";
import { startSite } from "capsomer/behavior/document";
import { enhance as enhanceHeader } from "capsomer/behavior/site-header";
import { enhance as enhanceTabs } from "capsomer/behavior/tabs";

startPage();
startSite([enhanceHeader, enhanceTabs, startIslands]);
```

- `documentAttrs({ family, site, theme })`: the attributes for any element, for a root that is not React.
- `SiteScope`: a part of a page under another family or site layer (a sample of another site), in place of hand-set `data-family` and `data-cap-site`.

## Not here

**Hydrating on intent** (germomics: React Router's scripts held inert until the reader presses play) is not part of this. Germomics does it by writing script text into the page (`innerHTML` and `script.textContent`), which Trusted Types refuses, so it waits for its own design.
