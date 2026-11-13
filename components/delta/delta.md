---
name: delta
title: Delta
summary: The move beside a figure against its last value, as an arrow and percent, better or worse.
parts: [css, behavior, react]
tool: native
states: [better, worse, down and better, no change]
added: 0.100.0
updated: 0.100.0
source: Foxhound's audit dashboard (routes/app/audit/dashboard.tsx Move, lib/audit/trend.ts compareRuns)
replaces:
  - "function Move\\("
  - "compareRuns\\("
---

# Delta

## Usage

```tsx
import { Delta } from "capsomer/react/delta";
import "capsomer/delta.css";
<Delta current={4210} previous={3760} higherIsBetter />
```

```html
<span class="cap-delta" data-kind="moved" data-tone="good" data-direction="up"><span class="cap-delta-arrow" aria-hidden="true">▲</span><span class="cap-sr-only">up </span>12%</span>
```

## Accessibility

Nothing to operate.

- The arrow is hidden; "up" or "down" is read before the percent.
- Both tones reach 4.5:1 on the surface in both themes.
