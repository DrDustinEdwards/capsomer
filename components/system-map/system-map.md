---
name: system-map
title: System map
summary: A network of systems as a connections map, cards wired by their ties, and one system with what uses it, its parts and what it uses, wired the same way.
group: pattern
parts: [css, behavior]
tool: own JavaScript
states: [the network, a card lit with its wires, one system, a flow at a step, under the pointer, keyboard focus, as delivered with no script]
added: 0.7.0
updated: 0.67.1
source: capsid/rulings/system-explorer-2026-10-10.md (answer 9); Dustin, 2026-11-03, "i want the actual connections map", which put the wires back on the 0.65.0 cards in place of its no-lines rule
replaces:
  - "react-flow"
  - "@xyflow/react"
  - "likec4"
---

# System map

## Usage

```ts
import { enhance, modelMapData, systemMapHtml } from "capsomer/behavior/system-map";
const data = modelMapData(model, (id) => `/systems/${id}`);
network.innerHTML = systemMapHtml(data, { id: "network", label: "The network" });
one.innerHTML = systemMapHtml(data, { id: "system", system: "foxing", label: "Foxing" });
enhance(document);
```

## Accessibility

| Key | Does |
| --- | --- |
| Tab | Moves between the systems' names (each a link: a hexagon, or a card on the plain map) and, on a system, the ties and the flows' buttons. Focusing a system or a tie lights its lines and ties |
| Right arrow, Left arrow | On the view tabs, moves between Hexagons and Plain map and shows it |
| Enter | Opens the system focused; on a flow's button, steps |
| Escape | Inside a flow, stops it |

- Every card is a list item with its name as a heading and a link stretched over the card, so a tap anywhere opens it and a screen reader hears the name alone as the link.
- The groups and bands are sections named by their headings; level 2's columns and flows are too.
- The hexagons' drawing is a group named by the map's title. Each system in it is a link whose name starts with the words it shows and then gives the full name ("Dustin, dustinedwards.info"); the comb, its lines and the group names are hidden from assistive technology, since the plain map holds the same ties as words. The two views are tabs (components/tabs), and with no script both show, one after the other.
- The wires are one SVG hidden from assistive technology (`aria-hidden`), and the lighting is a convenience over what the cards already say (each card's counts, level 2's columns and each part's lines in words), so the line that says how a card is tied is hidden too. A screen reader meets the same ties as text, in reading order: the network's lanes left to right, each block's cards top to bottom (W3C WAI, complex images: the information a drawing carries is in the text beside it).
- The detail line repeats words already in the cards and parts, so it is hidden from assistive technology.
- A flow's status line is a polite live region; focus stays on the button pressed, or moves to Back when Next ends the flow.
- Text 4.5:1 on its card in both themes, lit and muted; edges, lit wires and the focus ring 3:1. In forced colors wires are CanvasText and a lit card's edge and wires are Highlight.
