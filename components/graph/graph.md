---
name: graph
title: Graph
summary: A directed graph of boxes and wires drawn once at build time or on a server, each box linked to its page with status lines, laid out in layers so wires run one way.
parts: [css, behavior]
tool: dagre (@dagrejs/dagre, an optional peer)
states: []
added: 0.91.0
source: the Capsid explorer's code graph (explorer/src/graph.mjs and its CSS), generalized
replaces:
  - 'function graphSvg\('
  - 'class="code-graph'
---

# Graph

`graphSvg({ id, title, boxes, wires })` from `capsomer/behavior/graph`, with `capsomer/graph.css`. Server or build only: it needs `@dagrejs/dagre`, an optional peer the page bundle never loads.

## When to use it

Dependencies between things a reader opens one by one: the folders of a codebase and which imports which, the modules inside a folder.

## When not to

- The network's systems and their lines: the [system map](../system-map/system-map.md).
- Anything with a number on an axis: a chart in the [chart frame](../chart-frame/chart-frame.md).

## The default and its reason

- **Layered, top to bottom**, so every wire runs one way and a reader follows it down (dagre's Sugiyama-style layout). Wider than `column` (1,150 px) it tries left to right and keeps whichever is narrower.
- **Wires are smooth curves** through dagre's points, so wires that share a rank read as strands, not a tangle of corners. A wire to a box not drawn, or to itself, is left out; two between the same boxes are one.
- **A box says its state in its edge and its lines**: the edge takes the first line's tone and gets heavier as it gets worse (ok, warning, critical), and each line is the status glyph and its word, so color is never alone. `ring` draws a dashed ring with a word over it (`ringLabel`, "cycle").
- **The drawing is `aria-hidden` and its links are out of the tab order** (`tabindex="-1"`). The page puts the same facts in a table or a list beside it, which a keyboard and a screen reader use; the scroller is a named, focusable region, so a keyboard can scroll a drawing wider than the page.
- **Sizes are computed, not measured** (an average 13 px character), so the drawing is the same on every build and needs no browser.

## Accessibility

No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.
