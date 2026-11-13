---
name: mode-banner
title: Mode banner
summary: The band at the top of an app's content while it is a demo with sample data, or an admin is viewing a customer's account read-only, in the network's one set of words.
group: pattern
parts: [css, react]
tool: native
states: [demo for a visitor, viewing as a customer]
added: 0.100.0
updated: 0.100.0
source: Foxhound (layouts/app-shell.tsx demo band and view-as banner); Capsid Portal (app/DemoNotice.tsx, lib/demo.ts)
replaces:
  - "function DemoNotice"
  - "Viewing as \\{"
---

# Mode banner

## Usage

```tsx
import { ModeBanner } from "capsomer/react/mode-banner";
import "capsomer/mode-banner.css";
<ModeBanner mode="demo" actions={<a className="cap-btn" data-size="sm" href="/demo/exit">Exit demo</a>} />
<ModeBanner mode="view-as" who="Acme Supply Co." stopHref="/admin" />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Reaches the band's links |

A polite status, so it is announced once when it appears, never interrupting. Words reach 4.5:1 on the tint.
