---
name: system-map
title: System map
summary: A network of systems as a connections map, cards wired by their ties, and one system with what uses it, its parts and what it uses, wired the same way. Point at a card to light its wires; a tap opens it. Every tie is also words, and every flow a list.
parts: [css, behavior]
tool: own JavaScript
states:
  [
    the network,
    a card lit with its wires,
    one system,
    a flow at a step,
    under the pointer,
    keyboard focus,
    as delivered with no script,
  ]
added: 0.7.0
updated: 0.67.1
source: capsid/rulings/system-explorer-2026-10-10.md (answer 9); Dustin, 2026-11-03, "i want the actual connections map", which put the wires back on the 0.65.0 cards in place of its no-lines rule
replaces:
  - "react-flow"
  - "@xyflow/react"
  - "likec4"
---

# System map

A network of systems at two levels, drawn as a connections map. Level 1 is the network: every system a card, every tie between two systems a wire. Level 2 is one system: what uses it, its parts and what it uses, wired to the parts each tie runs through, with the flows over its parts. It is the map on dustinedwards.info and in the Capsid explorer, one component in both (answer 9).

## When to use it

- Showing a network of systems as a whole: what people use, what is shared, what runs everything, and how each ties to the rest.
- One system's page: who depends on it, what it is made of, what it depends on, and how a process moves through its parts.

## When not to

- A dependency graph of hundreds of nodes, or one whose cycles and depth are the point: a chart from Enarratio.
- A list someone sorts and filters: the table.
- A hierarchy a person opens and closes: the tree.

## The default and its reason

- **Overview first, then one system, with details on demand** (Shneiderman 1996). The network shows every system at once, and a tap goes inside one (Dustin, 2026-10-18: one tap). The C4 model's levels are the same split, and its advice of about 20 boxes a view is why the parts sit on their system's page, not on the network.
- **A layered drawing** (Sugiyama, Tagawa and Toda 1981), the standard for a directed graph read in one direction. The lanes are set by what each system is, not computed: the shared packages stand in the middle lane, since nearly every tie runs to or from one, and each block of the rest (a group of what people use, and the core) stands left or right, whichever leaves the fewest wires crossing the middle with the sides most even (every assignment is tried; a network has a handful of blocks). Then the barycenter heuristic orders the systems in each block, and the blocks in each lane, by where their neighbors stand, in alternating sweeps: the usual way to cut crossings in a layered drawing. `networkLayout` is pure, so a server lays the network out.
- **Hexagons first, the plain map a tab away** (Dustin, 2026-11-03). The network opens on a honeycomb, the look of the earlier maps: the core in the middle, the shared packages on a ring with an empty cell between each, what people use on an outer ring in its groups (in the groups' order from twelve o'clock, spare cells between groups), and the comb's empty cells faded behind. The barycenter idea on a circle gives a start, then a search (simulated annealing, Kirkpatrick, Gelatt and Vecchi 1983) tries the groups' order, the gaps between them, each group's order and both rings' turn for the shortest total line length, from a few seeds, and keeps the placement whose routed lines cross least. It is not a proven optimum (fewest crossings is NP-hard, Garey and Johnson 1983); on the live model it cut length 16%, crossings 35% and corners 21% against the barycenter alone. Every tie is a line through empty cells only, never under another system: the shortest path on the hex grid, where a turn costs more and a cell already carrying a line costs less, so lines run straight and gather into tracks (bundling, as in Holten 2006, by the grid's own channels), drawn with rounded corners. Each group's name stands in the empty cell just before its run on the outer ring, so the comb needs no ring of its own for names (Dustin, 2026-11-04: the map can be much bigger; dropping that ring makes each cell about a fifth larger). `hexLayout` is pure and the comb is SVG in the delivered HTML, so the lines need no script. The comb is as tall as the screen allows below a site's header and the view tabs (`100svh - 8rem`), so all of it is in view once the tabs reach the top. The plain map below is the second tab (components/tabs), for a reader who wants the cards and their words side by side. Narrower than 44rem the hexagons' names would fall under 12 px, so the plain map shows alone and the tabs go.
- **No 3D.** A 3D or rotatable map was weighed and refused: cells in front hide those behind, names tilt and shrink, and dragging competes with scrolling. Depth is the lit state alone.
- **Wires are drawn where the cards landed**, by the script, under the cards (`system-map-wires.ts`). A wire between neighboring lanes is one curve; a wire that skips a lane passes it through a gap between that lane's cards and headings, never over one, with the wires through one gap kept apart in order; a wire inside a lane bows out on the lane's outer side. Where wires meet a card they are spread down its side in the order of where they go, so wires leaving one card never cross there. The layout itself is the page's CSS, so the cards keep their text whole at any width and the wires follow.
- **Lighting finds one path in the whole.** Pointing at a card or focusing it turns its wires accent and heavier, on top; every other wire falls back to the faint line color. The cards at the other ends say how they are tied in words ("Used by Carrel", "Uses Carrel", "Uses and used by Carrel"), with an accent edge; the rest go muted by color, not opacity, so every word keeps its contrast. On a shared package this is the impact view: everything a change to it reaches.
- **A lit line says which way it runs** (Dustin, 2026-11-04). On the hexagons a lit line's dashes move from the system that uses toward the system used, long dashes with short gaps, slowly, each line out of step with its neighbors. In the one controlled study of the choice (Holten, Isenberg, van Wijk and Fekete 2011, five ways of drawing direction), moving dashes were the most accurate and tapered lines the fastest, and arrowheads and other glyphs did worst; tapering needs lines of varying width and see-through ink, which the comb's bundled tracks cannot give. A tie both ways stays a solid line. Direction is never motion alone: the detail line says it in words ("Uses devkit, Runtime. Used by Capsid, Carrel."), and under `prefers-reduced-motion: reduce` the dashes stand still. The detail line keeps room for four lines on the network, so lighting a system never moves the drawing.
- **The whole network in view, with no scrolling** (Dustin, 2026-11-03), on a desktop and on a phone. A card on the network is its short name alone (the model's `short`, "Site MCP"), small enough that three lanes fit a 320px screen with the wires between them. What a system is (its full name, what it is for, its address and counts) is in the card as words a screen reader reads, and shows in the detail line above the drawing when the card is pointed at or focused: details on demand. Where a card is narrower than its words (a map under 44rem), the line saying how a lit card is tied is left to the detail line, and a tied card's heavier edge is the sign that is not color.
- **A system is lanes too**: Used by, then Inside as Runs, Stores and Outside (what the system works with but does not own, Dustin, 2026-10-11), then Uses. A part's line to another of its parts is a wire between them; to another system, or that system's part, a wire to that system in Uses (or Used by, read from the line's other end); a line to or from the system as a whole meets its Inside heading. Each tie is the other system's name, a link to its page, and its verbs as text; each part shows its name and what it runs on, and keeps what it does and its own lines as words that a screen reader reads and the detail line shows when the part is pointed at or focused (each part is a tab stop for that). Where the map is narrower than 60rem the columns stack in that order and the words carry the ties alone.
- **Flows are ordered lists** on the page of each system whose parts they touch. With script, Start, Next and Back step one, lighting the parts the step touches and the wires between them (the part it moves toward with the heaviest edge), marking the step `aria-current="step"`, and saying "Step n of N" and the sentence. With no script the list is the whole story. A host can deliver a step already lit (`flow`).
- **Private is a dashed edge and the word "private"**, and nothing else differs: a private system is shown in full (2026-10-23 ruling).
- **Rendered by `systemMapHtml`**, a pure function, so a server or a static build delivers the whole map; the script adds the wires, lighting and stepping. With no script every card is a link and every tie words. No text is under 12 px.

## Keyboard

| Key                     | Does                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab                     | Moves between the systems' names (each a link: a hexagon, or a card on the plain map) and, on a system, the ties and the flows' buttons. Focusing a system or a tie lights its lines and ties |
| Right arrow, Left arrow | On the view tabs, moves between Hexagons and Plain map and shows it                                                                                                                           |
| Enter                   | Opens the system focused; on a flow's button, steps                                                                                                                                           |
| Escape                  | Inside a flow, stops it                                                                                                                                                                       |

## Accessibility

- Every card is a list item with its name as a heading and a link stretched over the card, so a tap anywhere opens it and a screen reader hears the name alone as the link.
- The groups and bands are sections named by their headings; level 2's columns and flows are too.
- The hexagons' drawing is a group named by the map's title. Each system in it is a link whose name starts with the words it shows and then gives the full name ("Dustin, dustinedwards.info"); the comb, its lines and the group names are hidden from assistive technology, since the plain map holds the same ties as words. The two views are tabs (components/tabs), and with no script both show, one after the other.
- The wires are one SVG hidden from assistive technology (`aria-hidden`), and the lighting is a convenience over what the cards already say (each card's counts, level 2's columns and each part's lines in words), so the line that says how a card is tied is hidden too. A screen reader meets the same ties as text, in reading order: the network's lanes left to right, each block's cards top to bottom (W3C WAI, complex images: the information a drawing carries is in the text beside it).
- The detail line repeats words already in the cards and parts, so it is hidden from assistive technology.
- A flow's status line is a polite live region; focus stays on the button pressed, or moves to Back when Next ends the flow.
- Text 4.5:1 on its card in both themes, lit and muted; edges, lit wires and the focus ring 3:1. In forced colors wires are CanvasText and a lit card's edge and wires are Highlight.

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

`modelMapData(model, href?)` turns Capsid's public model into `data`, the same on every host: each system people use gets its group from its family (sites are Websites, products Apps, writing Writing, the rest Tools), in the model's order, and each flow step, which rides a line by its id, stands on that line's two ends. `data` is `{ systems, relationships?, containers?, flows? }`: a system is `{ id, name, short?, ring: "core" | "shared" | "used", private?, group?, description?, domain?, href? }`, a relationship `{ from, to, kind }` between any two systems or parts, a container `{ id, system, name, kind, technology?, description? }` (kind `external` stands Outside; `database`, `bucket`, `kv` and `queue` under Stores; the rest under Runs), and a flow `{ id, name, description?, steps: [{ from, to, toward, text, lights? }] }`.

Options: `id`, `label`, `caption`, `headingLevel` (2 to 4; the cards, places and parts take the levels below), `ringNames` (the bands' headings; `used` heads what people use when none has a group), and for level 2 `system`, `only: "inside"` (the parts and flows alone) and `flow: { id, step }` (a step delivered lit).

The contract: `figure.cap-system-map[data-cap="system-map"][data-level="network|system"]` holding `figcaption.cap-system-map-head` (`.cap-system-map-title`, `.cap-system-map-caption`). Both levels: `p.cap-system-map-detail[data-cap-part="detail"]` (`aria-hidden`; `hidden` until the script runs) after the head; on the network, while a system is lit, it ends with `span.cap-system-map-detail-ways` saying what it uses and what uses it. Level 1: `div.cap-tabs.cap-system-map-views[data-cap="tabs"]` holding `div.cap-tabs-list.cap-system-map-switch[role="tablist"]` (`hidden` until the script runs) with a tab for each view, then the panels `div.cap-tabs-panel.cap-system-map-hex` and `div.cap-tabs-panel.cap-system-map-network`. The hexagons: `svg.cap-system-map-comb[role="group"]` of `g.cap-system-map-comb-cells` (the faded empty cells), `g.cap-system-map-comb-lines` of `path.cap-system-map-wire[data-a][data-b]` (`data-a` the user, `data-b` the system used; `data-on` while lit, and `data-both` with it where the tie runs both ways; the comb carries `data-lit`), the group names `text.cap-system-map-comb-group`, and a link `a.cap-system-map-cell[data-id][data-ring]` per system (`data-private`; `data-tie` while lit) holding its polygon and `text.cap-system-map-cell-name`. The plain map: `div.cap-system-map-network` of `div.cap-system-map-graph` of `div.cap-system-map-lane[data-lane="left|middle|right"]`, each of `section.cap-system-map-group[data-group]` and `section.cap-system-map-band[data-ring="shared|core"]`, each a `.cap-system-map-group-name` heading (with `.cap-system-map-group-count`) over `ul.cap-system-map-cards` of `li.cap-system-map-card[data-id][data-wire][data-wires][data-uses][data-used-by]` (`data-private`, `data-link`; `data-tie="self|used|user|both"` while lit) holding `.cap-system-map-card-name` (its link, `a.cap-system-map-link`, as is a tie's name, with the short name), `span.cap-system-map-card-about` (clipped; `.cap-system-map-card-full`, `.cap-system-map-card-text`, `.cap-system-map-card-meta` of `.cap-system-map-card-domain`, `.cap-system-map-card-private` and `.cap-system-map-card-count`) and `.cap-system-map-card-tie`. The root carries `data-lit` (the system lit) while one is. With script, `svg.cap-system-map-wires` (`aria-hidden`, `data-lit` while lit, `hidden` while the lanes are stacked) is the host's first child, holding `path.cap-system-map-wire` and `circle.cap-system-map-port`, each with `data-a` and `data-b` (the keys of its ends) and `data-on` while lit. Every node a wire can end on carries `data-wire` (its key) and `data-wires` (the keys it is tied to). Level 2: the root carries `data-system`, and `data-flow` and `data-step` while a flow is at a step; `div.cap-system-map-columns` (`data-only`) of `section.cap-system-map-column[data-column="used-by|inside|uses"]` with `.cap-system-map-column-name`; the ties `ul.cap-system-map-ties` of `li.cap-system-map-tie[data-id]` (`data-private`; `data-wire="used-by:<id>|uses:<id>"`, `data-wires`) with `.cap-system-map-tie-name` and `.cap-system-map-tie-verbs`; inside (`data-places="1|2|3"`, its lanes; its heading's `span[data-wire="self"]` where the system as a whole has a line), `section.cap-system-map-place[data-place="runs|stores|outside"]` with `.cap-system-map-place-name` over `ul.cap-system-map-parts` of `li.cap-system-map-part[data-id][data-place]` (`data-wire`, `data-wires`, `data-lit`, `data-at`) (`tabindex="0"`) holding `.cap-system-map-part-name`, `.cap-system-map-part-kind` and `span.cap-system-map-part-about` (clipped; `.cap-system-map-part-full`, `.cap-system-map-part-text`, and `.cap-system-map-part-lines`, a `span` a line); `.cap-system-map-none` where a column is empty; then `section.cap-system-map-flows` of `section.cap-system-map-flow[data-flow]` (`.cap-system-map-flow-name`, `.cap-system-map-flow-text`, `ol.cap-system-map-steps` of `li[data-toward][data-lights]`, `aria-current="step"` on the step shown, and `p.cap-system-map-flow-controls[data-cap-part="controls"]` with `button[data-cap-part="back|next"]` and `.cap-system-map-flow-status`).

Event: `cap:system-map-flow` (`{ id, step }`, and `{ id: null, step: 0 }` when a flow stops). `controller(root)` returns `light(id | null)`, `playFlow(id, step?)`, `step(n)`, `stopFlow()` and `destroy()`; a host's own calls leave focus where it is. The root carries `data-held` while a tie or part is pointed at or focused. Pure functions: `hexLayout`, `networkLayout`, `tiePairs`, `tiesOf`, `flowsOver`, `ownerOf`, `placeOf`, `verbOf`, `count`, `stepText`.

## Exceptions in production

None. Its homes are dustinedwards.info's `/systems` and the Capsid explorer.
