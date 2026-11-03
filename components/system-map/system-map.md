---
name: system-map
title: System map
summary: A network of systems as cards, and one system with what uses it, its parts and what it uses. Point at a card to light its ties; a tap opens it. Every tie is words, and every flow a list.
parts: [css, behavior]
tool: own JavaScript
states: [the network, a card lit with its ties shown, one system, a flow at a step, under the pointer, keyboard focus, as delivered with no script]
added: 0.7.0
updated: 0.65.0
source: capsid/rulings/system-explorer-2026-10-10.md (answer 9) and Dustin's yes of 2026-11-03 to the card design, which replaced the capsid drawing (answer 3) and the line routing of the seat rulings on capsomer#57 and #64
replaces:
  - "react-flow"
  - "@xyflow/react"
  - "likec4"
---

# System map

A network of systems at two levels. Level 1 is the network: every system a card, standing in a column with its group (Websites, Apps, Writing, Tools), then a band of the shared packages and a band of the core. Level 2 is one system: what uses it, its parts, and what it uses, with the flows over its parts. It is the map on dustinedwards.info and in the Capsid explorer, one component in both (answer 9).

## When to use it

- Showing a network of systems as a whole: what people use, what is shared, what runs everything, and how each ties to the rest.
- One system's page: who depends on it, what it is made of, what it depends on, and how a process moves through its parts.

## When not to

- A dependency graph whose shape is the point (cycles, depth): a chart from Enarratio.
- A list someone sorts and filters: the table.
- A hierarchy a person opens and closes: the tree.

## The default and its reason

- **Overview first, then one system, with details on demand** (Shneiderman 1996). The network shows every system at once, and a tap goes inside one (Dustin, 2026-10-18: one tap). The C4 model's levels are the same split, and its advice of about 20 boxes a view is why the parts sit on their system's page, not on the network.
- **No lines are drawn.** With more than a handful of systems, a drawing of every tie becomes a tangle a reader cannot follow (Ghoniem and others, 2004: node-link drawings lose to a matrix as a graph grows dense). Each card says how many systems it uses and is used by, and pointing at it or focusing it lights exactly those cards and mutes the rest. On a shared package this is the impact view: everything a change to it reaches.
- **A lit card says how it is tied, in words**: "Used by Carrel", "Uses Carrel", or "Uses and used by Carrel", with an accent edge; the card pointed at has a heavier edge and the tint. Color is never the only sign. Muted cards change color, not opacity, so every word keeps its contrast.
- **Ties are read between systems.** A line from one system's part to another system or its part is a tie between the two systems, so the counts and the columns hold every connection the data has, each other system once with all its verbs.
- **A system is three columns**: Used by, Inside, Uses. Each tie is the other system's name, a link to its page, and its verbs as text ("installs", "publishes to"). Inside, the parts stand under Runs, Stores and Outside (what the system works with but does not own, Dustin, 2026-10-11), each with what it runs on, what it does, and its own lines in words ("writes to capsid · serves Portal"). Where the map is narrower than 52rem the columns stack in that order.
- **Flows are ordered lists** on the page of each system whose parts they touch. With script, Start, Next and Back step one, lighting the parts the step touches (the part it moves toward with the heaviest edge), marking the step `aria-current="step"`, and saying "Step n of N" and the sentence. With no script the list is the whole story. A host can deliver a step already lit (`flow`).
- **Private is a dashed edge and the word "private"**, and nothing else differs: a private system is shown in full (2026-10-23 ruling).
- **Rendered by `systemMapHtml`**, a pure function, so a server or a static build delivers the whole map and the script only adds lighting and stepping. No layout engine and no drawing.
- **The columns follow the map's own width** (a container query), so a host's narrow column stacks them as a phone does. No text is under 12 px.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves between the systems' names (each a link) and, on a system, the flows' buttons. Focusing a card lights its ties |
| Enter | Opens the system focused; on a flow's button, steps |
| Escape | Inside a flow, stops it |

## Accessibility

- Every card is a list item with its name as a heading and a link stretched over the card, so a tap anywhere opens it and a screen reader hears the name alone as the link.
- The groups and bands are sections named by their headings; level 2's columns and flows are too.
- The lighting is a convenience over what the cards already say (each card's counts, and level 2's columns), so the line that says how a card is tied is hidden from assistive technology.
- A flow's status line is a polite live region; focus stays on the button pressed, or moves to Back when Next ends the flow.
- Text 4.5:1 on its card in both themes, lit and muted; edges and the focus ring 3:1. In forced colors a lit card's edge is Highlight.

Last checked by hand: not yet (screen readers before release).

## Markup

Render it; do not write it by hand.

```ts
import { enhance, modelMapData, systemMapHtml } from "capsomer/behavior/system-map";
const data = modelMapData(model, (id) => `/systems/${id}`);
network.innerHTML = systemMapHtml(data, { id: "network", label: "The network" });
one.innerHTML = systemMapHtml(data, { id: "system", system: "foxing", label: "Foxing" });
enhance(document);
```

`modelMapData(model, href?)` turns Capsid's public model into `data`, the same on every host: each system people use gets its group from its family (sites are Websites, products Apps, writing Writing, the rest Tools), in the model's order. `data` is `{ systems, relationships?, containers?, flows? }`: a system is `{ id, name, ring: "core" | "shared" | "used", private?, group?, description?, domain?, href? }`, a relationship `{ from, to, kind }` between any two systems or parts, a container `{ id, system, name, kind, technology?, description? }` (kind `external` stands Outside; `database`, `bucket`, `kv` and `queue` under Stores; the rest under Runs), and a flow `{ id, name, description?, steps: [{ from, to, toward, text, lights? }] }`.

Options: `id`, `label`, `caption`, `headingLevel` (2 to 4; the cards, places and parts take the levels below), `ringNames` (the bands' headings; `used` heads what people use when none has a group), and for level 2 `system`, `only: "inside"` (the parts and flows alone) and `flow: { id, step }` (a step delivered lit).

The contract: `figure.cap-system-map[data-cap="system-map"][data-level="network|system"]` holding `figcaption.cap-system-map-head` (`.cap-system-map-title`, `.cap-system-map-caption`). Level 1: `div.cap-system-map-network` of `div.cap-system-map-groups` of `section.cap-system-map-group[data-group]` and `section.cap-system-map-band[data-ring="shared|core"]`, each a `.cap-system-map-group-name` heading (with `.cap-system-map-group-count`) over `ul.cap-system-map-cards` of `li.cap-system-map-card[data-id][data-uses][data-used-by]` (`data-private`, `data-link`; `data-tie="self|used|user|both"` while lit) holding `.cap-system-map-card-name` (its link), `.cap-system-map-card-text`, `.cap-system-map-card-meta` (`.cap-system-map-card-domain`, `.cap-system-map-card-private`, `.cap-system-map-card-count`) and `.cap-system-map-card-tie`. The root carries `data-lit` (the system lit) while one is. Level 2: the root carries `data-system`, and `data-flow` and `data-step` while a flow is at a step; `div.cap-system-map-columns` (`data-only`) of `section.cap-system-map-column[data-column="used-by|inside|uses"]` with `.cap-system-map-column-name`; the ties `ul.cap-system-map-ties` of `li.cap-system-map-tie[data-id]` (`data-private`) with `.cap-system-map-tie-name` and `.cap-system-map-tie-verbs`; inside, `section.cap-system-map-place[data-place="runs|stores|outside"]` with `.cap-system-map-place-name` over `ul.cap-system-map-parts` of `li.cap-system-map-part[data-id][data-place]` (`data-lit`, `data-at`) holding `.cap-system-map-part-name`, `.cap-system-map-part-kind`, `.cap-system-map-part-text` and `.cap-system-map-part-lines` (a `span` a line); `.cap-system-map-none` where a column is empty; then `section.cap-system-map-flows` of `section.cap-system-map-flow[data-flow]` (`.cap-system-map-flow-name`, `.cap-system-map-flow-text`, `ol.cap-system-map-steps` of `li[data-toward][data-lights]`, `aria-current="step"` on the step shown, and `p.cap-system-map-flow-controls[data-cap-part="controls"]` with `button[data-cap-part="back|next"]` and `.cap-system-map-flow-status`).

Event: `cap:system-map-flow` (`{ id, step }`, and `{ id: null, step: 0 }` when a flow stops). `controller(root)` returns `light(id | null)`, `playFlow(id, step?)`, `step(n)`, `stopFlow()` and `destroy()`; a host's own calls leave focus where it is. Pure functions: `tiesOf`, `flowsOver`, `ownerOf`, `placeOf`, `verbOf`, `count`, `stepText`.

## Exceptions in production

None. Its homes are dustinedwards.info's `/systems` and the Capsid explorer.
