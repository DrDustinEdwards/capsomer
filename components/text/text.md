---
name: text
title: Text and Title
summary: React Title and Text for the text roles and title sizes.
parts: [react]
tool: native
states: []
added: 0.147.0
updated: 0.147.0
source: txasm (46 `cap-title` size 2, 46 `cap-text cap-muted` small and 130 more runs of the same attributes in its server bundle, which put its Worker 5.8 KiB over its size budget)
replaces:
  - 'className="cap-title"'
  - 'className="cap-text( [a-z-]+)*"'
---

# Text and Title

## Usage

```html
<h2 class="cap-title" data-size="2">Abstracts</h2>
<p class="cap-text" data-size="small" data-tone="muted">Submitted by the author.</p>
```

```tsx
import { Text, Title } from "capsomer/react/text";

<Title as="h1" size={2}>Abstracts</Title>
<Text size="small" tone="muted">Submitted by the author.</Text>
```

## Accessibility

- `Title` renders an `h2` by default and `size` changes only the look, so set `as` to the level the outline needs: an `h1` that looks like a 2 is `<Title as="h1" size={2}>`.
- Every tone keeps its contrast on every surface (contrast report).
