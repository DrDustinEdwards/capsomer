---
name: share-row
title: Share row
summary: A "Share" label and a plain link to each service's own share intent, ruled off under a post's lead.
group: pattern
parts: [css, behavior, react]
tool: native
states: [X and LinkedIn, every service, with a copy button, hover]
added: 0.94.0
source: Foxhound's ShareRow (app/components/blog/share-row.tsx, ported from Recova's ShareBar)
replaces:
  - 'function ShareRow'
  - 'x.com/intent/tweet'
---

# Share row

## Usage

```html
<div class="cap-share" role="group" aria-label="Share this page">
  <span class="cap-share-label" aria-hidden="true">Share</span>
  <a class="cap-share-link" href="https://x.com/intent/tweet?text=...&url=..." aria-label="Share on X" rel="external noopener"><svg aria-hidden="true">...</svg>X</a>
  <a class="cap-share-link" href="https://www.linkedin.com/sharing/share-offsite/?url=..." aria-label="Share on LinkedIn" rel="external noopener"><svg aria-hidden="true">...</svg>LinkedIn</a>
  <!-- the copy button -->
</div>
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves through the services, then the copy button |
| Enter | Opens the service's share page |

- Every link is at least `--target` tall and its text reaches 4.5:1 (checked in the spec).
- Marks are `aria-hidden`; the names are text.
