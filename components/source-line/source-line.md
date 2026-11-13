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

## Usage

```tsx
import { SourceLine } from "capsomer/react/source-line";
import "capsomer/source-line.css";
<SourceLine href="https://example.com/report" read="October 2026" />
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab, Enter | Reaches and follows the link |

The arrow is hidden; "(opens the source)" is read after the words.
