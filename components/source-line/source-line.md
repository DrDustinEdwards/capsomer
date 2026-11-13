---
name: source-line
title: Source line
summary: A figure's source under it, a link that names the source and when it was read.
parts: [css, react]
tool: native
states: [under a figure]
added: 0.100.0
updated: 0.100.0
source: Foxhound's home page statistics (routes/home.tsx, lib/marketing/statistics.ts citation, SourceArrow)
replaces:
  - "Source: \\{citation\\("
---

# Source line

Every statistic on a page names its source and when it was read, as a link to that page: "Source: example.com, read October 2026 ↗".

## When to use it

Under any figure taken from outside the site: an industry rate, a published survey.

## When not to

A chart's source is the chart frame's own `source`. A panel's data source and freshness is the panel's `src`.

## The default and its reason

- **The source and the date read, always both**, so a reader can check the figure and see how old it is.
- **The name defaults to the address's host** (`citation(href)`, "example.com"); pass `name` for a publisher's own name.
- **Small mono words in the muted ink**, quieter than the figure, at 4.5:1; the link box is at least the target height.

## Keyboard

| Key | Does |
| --- | --- |
| Tab, Enter | Reaches and follows the link |

## Accessibility

The link system's away arrow is hidden; "(opens another site)" is read after the words (`AwayLink`).

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```tsx
import { SourceLine } from "capsomer/react/source-line";
import "capsomer/source-line.css";
<SourceLine href="https://example.com/report" read="October 2026" />
```

## Exceptions in production

None.
