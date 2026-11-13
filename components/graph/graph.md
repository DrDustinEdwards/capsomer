---
name: graph
title: Graph
summary: A directed graph of linked boxes and wires, drawn once at build time and laid out in layers.
parts: [css, behavior]
tool: dagre (@dagrejs/dagre, an optional peer)
states: []
added: 0.124.0
source: the Capsid explorer's code graph (explorer/src/graph.mjs and its CSS), generalized
replaces:
  - 'function graphSvg\('
  - 'class="code-graph'
---

# Graph

## Accessibility

No manual NVDA or VoiceOver run is planned (decision of 2026-11-07); the automated browser checks and a front-end review stand in.
