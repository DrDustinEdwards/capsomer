---
name: mode-banner
title: Mode banner
summary: The band at the top of an app's content while it is a demo with sample data, or an admin is viewing a customer's account read-only, in the network's one set of words.
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

While an app is not in its normal mode, a band across the top of its content says so, on every page, in the same words on every site.

## When to use it

- `mode="demo"`: the app is showing sample data (a public demo, the Portal's chart demo).
- `mode="view-as"`: an admin is looking at a customer's account read-only.

## When not to

A message about one page's data is a banner (components/banner). A site-wide outage notice is the site header's notice.

## The default and its reason

- **One set of words.** A demo: "Demo with sample data. The numbers are made up, and nothing you do here is saved.", with "This is not your real account." for a signed-in person. Viewing as: "Viewing as Acme Supply Co., read-only." with Stop viewing.
- **Demo is the notice tone, viewing as is the warning tone**: looking at someone else's account is the one a person must not forget.
- **The ways out are in the band**: Connect and Exit demo for a demo; Stop viewing goes back to the admin.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the band's links |

## Accessibility

A polite status, so it is announced once when it appears, never interrupting. Words reach 4.5:1 on the tint.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { ModeBanner } from "capsomer/react/mode-banner";
import "capsomer/mode-banner.css";
<ModeBanner mode="demo" actions={<a className="cap-btn" data-size="sm" href="/demo/exit">Exit demo</a>} />
<ModeBanner mode="view-as" who="Acme Supply Co." stopHref="/admin" />
```

## Exceptions in production

None.
