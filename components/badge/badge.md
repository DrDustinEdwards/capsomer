---
name: badge
title: Badge
summary: A count in a small round bubble, neutral or toned by what the number means, for a tab, a menu row or an icon's corner.
parts: [css]
tool: native
states: [a count and its tones]
added: 0.111.0
updated: 0.111.0
source: the admin shell's count, the site header's count and the shell's tab badge, which each drew the same bubble
replaces:
  - "cap-admin-count"
  - "cap-site-header-count"
  - "cap-shell-badge"
---

# Badge

A number in a bubble: "Queue 12", an icon with a 3 on its corner.

## When to use it

A count of things waiting, beside a word or on an icon: unread, to review, failing.

## When not to

A state is a status pill. A figure with a label is a stat tile. A count that is the whole content of a row is text.

## The default and its reason

- **One size and one shape** (16px, round), so every count in a product reads the same.
- **Neutral gray by default; the tone says what the number means**: `data-tone="need"` (it needs you: the primary color), `"crit"` and `"warn"` (status colors that keep their meaning).
- **An empty badge is hidden**, so a count that is zero draws nothing.
- **Where it sits is the host's**: beside a word, or positioned on an icon's corner and ringed in the bar's color.

## Keyboard

Nothing to operate.

## Accessibility

- The badge's text is the number. Where a badge sits on an icon, the control's name carries the count too ("Inbox, 3 unread"), and the badge itself is `aria-hidden`.
- Every tone reaches 4.5:1 in both themes. Under forced colors the bubble gets an edge.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## Markup

```html
<span class="cap-badge" data-tone="need">3</span>
```

```css
@import "capsomer/badge.css";
```

## Exceptions in production

None.
