---
name: stack
title: Stack
summary: A React Stack: a column with a gap from the spacing scale.
parts: [react]
tool: native
states: []
added: 0.147.0
updated: 0.147.0
source: txasm (more than 200 `cap-stack` containers in its server bundle)
replaces:
  - 'className="cap-stack"'
---

# Stack

## Usage

```html
<div class="cap-stack" data-gap="3">...</div>
```

```tsx
import { Stack } from "capsomer/react/stack";

<Stack gap={3} as="section">...</Stack>
```

## Accessibility

- The element is yours to choose (`as`), so a list stays a list (`as="ul"`) and keeps its semantics.
- The stack adds space only; reading order is the source order.
