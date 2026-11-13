---
name: count
title: Count
summary: A count in a small round bubble, toned by what the number means, for a tab, row or icon.
parts: [css]
tool: native
states: [a count and its tones]
added: 0.112.0
updated: 0.112.0
source: the admin shell's count, the site header's count and the shell's tab badge, which each drew the same bubble
replaces:
  - "cap-admin-count"
  - "cap-site-header-count"
  - "cap-shell-badge"
---

# Count

## Usage

```html
<span class="cap-count" data-tone="need">3</span>
```

```css
@import "capsomer/count.css";
```

## Accessibility

Nothing to operate.

- The count's text is the number. Where a count sits on an icon, the control's name carries the count too ("Inbox, 3 unread"), and the count itself is `aria-hidden`.
- Every tone reaches 4.5:1 in both themes. Under forced colors the bubble gets an edge.
