---
name: count-up
title: Count-up
summary: A figure that counts from zero to its value when it arrives; the server renders the final figure.
parts: [css, behavior, react]
tool: own JavaScript
states: [counting, final, reduced motion]
added: 0.94.0
source: Foxhound's RecoverableEstimate (app/components/audit/sections.tsx, Recova's RecoverableCountUp)
replaces:
  - 'RecoverableCountUp'
  - 'Math.pow\(1 - t, 3\)'
---

# Count-up

## Usage

```html
<span class="cap-count-up" data-cap="count-up" data-value="12480" data-currency="USD">$12,480</span>
```

## Accessibility

None.

- Only text changes, and only for 600ms; a screen reader reaching it reads the final figure (no live region, so the counting is not announced).
- Reduced motion is honored.
