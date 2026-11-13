---
name: timeline
title: Timeline
summary: A process as numbered steps down a line that fills from the first to the last once it scrolls into view.
parts: [css, behavior, react]
tool: own JavaScript
states: [filled (seen, or no script), empty before it is seen, reduced motion, a site's own look, narrow]
added: 0.94.0
source: bsw's process timeline (app/components/Timeline.tsx, app/islands/timeline.ts, app.css .vertical-timeline)
replaces:
  - 'vertical-timeline'
  - 'timeline-line-fill'
---

# Timeline

## Usage

```html
<ol class="cap-timeline" data-cap="timeline">
  <li class="cap-timeline-step">
    <span class="cap-timeline-node" aria-hidden="true">01</span>
    <div class="cap-timeline-body">
      <span class="cap-timeline-icon" aria-hidden="true"><svg>...</svg></span>   <!-- optional -->
      <h3 class="cap-timeline-title">Send the draft</h3>
      <div class="cap-timeline-text"><p>Upload the document and pick a turnaround.</p></div>
    </div>
  </li>
</ol>
```

## Accessibility

None: it holds no control (links in a step's words are in the normal order).

- `ol` and `li`, each step's title a heading at the page's level.
- The node numbers and icons are `aria-hidden`.
- In forced colors the line is drawn in system colors.
