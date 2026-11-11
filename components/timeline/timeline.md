---
name: timeline
title: Timeline
summary: A process as numbered steps down a line that fills from the first to the last once it scrolls into view.
parts: [css, behavior, react]
tool: own JavaScript
states: [filled (seen, or no script), empty before it is seen, reduced motion, a site's own look, narrow]
added: 0.91.0
source: bsw's process timeline (app/components/Timeline.tsx, app/islands/timeline.ts, app.css .vertical-timeline)
replaces:
  - 'vertical-timeline'
  - 'timeline-line-fill'
---

# Timeline

A short process (four or five steps) as an ordered list down a line: each step a round node with its number, beside a title and a sentence. Once the timeline scrolls into view, the line fills from the first node to the last.

## When to use it

A marketing or help page that explains how something works in order: submit, match, edit, guarantee.

## When not to

- **A record of past events with dates**: the history list.
- **Steps a person completes in a form**: the step indicator.
- **More than about six steps**: a numbered list in the prose.

## The default and its reason

- **An ordered list** (`ol`), so the steps are read as a sequence and counted. The numbers in the nodes are decoration (`aria-hidden`); the list gives the order.
- **The fill is a transform** (`scale` on the line's pseudo-element, from its top), so it runs on the compositor and nothing is measured; a resize changes nothing.
- **With no script the line is drawn full**; script empties it only to fill it when it is 200px from the window, once.
- **Reduced motion draws it full** with no animation.
- **The look is the site's**: `--cap-timeline-node` (size), `--cap-timeline-node-bg`, `--cap-timeline-node-line`, `--cap-timeline-track`, `--cap-timeline-fill` (a color or a gradient), `--cap-timeline-duration` and `--cap-timeline-gap`.

## Keyboard

None: it holds no control (links in a step's words are in the normal order).

## Accessibility

- `ol` and `li`, each step's title a heading at the page's level.
- The node numbers and icons are `aria-hidden`.
- In forced colors the line is drawn in system colors.

Screen readers: no manual NVDA or VoiceOver run, by decision (2026-11-07); the automated browser checks and a front-end review stand in. Automated: see the site's Tests page.

## HTML contract

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

React: `Timeline` from `capsomer/react/timeline` takes `steps` (`mark`, `title`, `icon`, `children`), `level` and `className`. A page with no React calls `enhance()` from `capsomer/behavior/timeline`. Load `timeline.css`.

## Exceptions in production

None yet.
