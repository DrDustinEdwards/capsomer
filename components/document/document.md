---
name: document
title: Document
summary: "The page's root, giving its family and site layer from the first byte and routing hydration."
group: pattern
parts: [behavior, react]
tool: own JavaScript
states: []
added: 0.132.0
source: bsw and julieedwards-info root.tsx, germomics root.tsx and app/lib/hydration.ts, txasm root.tsx and app/site.ts, Foxhound's hand-set data-cap-site wrappers
replaces:
  - 'data-cap-site="'
---

# Document

## Usage

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
