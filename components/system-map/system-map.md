---
name: system-map
title: System map
summary: A family of systems drawn as a capsid, the systems as its capsomers. Choose one to draw its connections; choose the core again to go inside it. The same data is always a list.
parts: [css, behavior]
tool: own JavaScript
states: [the family as a capsid, a system chosen with its connections drawn, inside the core, a flow playing inside the core, the plain map, under the pointer, keyboard focus, as delivered with no script]
added: 0.7.0
source: capsid/rulings/system-explorer-2026-10-10.md (answers 3 and 9) and capsid/research/design-system-explorer.md (section 3)
replaces:
  - "react-flow"
  - "@xyflow/react"
  - "likec4"
---

# System map

The family of systems as one drawing: a capsid seen down its three-fold axis, whose hexagonal capsomers are the systems. The system that runs everything sits in the middle, the shared parts every app installs ring it, and the things people use form the outer shell. It is the map on dustinedwards.info and the top of the Capsid explorer, one component in both (answer 9).

## When to use it

- Showing a family of systems as a whole: what is at the center, what is shared, what people use.
- A page that should let a stranger find their way into deeper views of one system.

## When not to

- A dependency graph with many lines at once: the map draws one system's lines at a time. Use a chart from Enarratio.
- A list someone scans for one name: the plain view, or a table.
- A hierarchy a person opens and closes: the tree.

## The default and its reason

- **Rings carry the meaning, lines appear on demand.** At rest a stranger reads layers, not wires; neighbors on the shell are not claimed to be connected. Choosing a capsomer draws its lines, solid where it installs or publishes, dashed where it is coordinated or watched.
- **Lines run in the seams, beneath the capsomers.** A line is the shortest walk along the hexagons' sides between the two capsomers, nearest the straight line among equals, and is drawn under every capsomer, so no line crosses a label (seat ruling on capsomer#57). A seam touches three capsomers at each corner, so the far end of each line is outlined too (`data-linked`). The walk is a small search over a few dozen corners: no layout engine.
- **Going inside is the zoom.** Choosing the core again folds every ring into the middle, the rim stays behind as faded shapes with no names, and the core's containers appear within a dashed circle, the C4 system boundary, as large as the stage allows, with its name at its foot. The inside drawing is at least 380 units wide, in the stage's own proportions, and is made larger until its rows fit inside the circle, so a small family's map is scaled down rather than crowded. Escape or Step out returns.
- **What the core works with sits outside it.** A container of kind `external` (the agents that call Capsid, GitHub) is drawn outside the dashed circle, in the stage's corners (top left, top right, bottom left, bottom right; four at most), on the page's ground with a plain edge, and is counted apart from the core's parts (Dustin, 2026-10-11, as C4 draws an external system). Its lines to the core's parts are drawn like any other.
- **A flow plays over the lines that are there.** A flow is ordered steps, each riding one line between the core's parts toward one end, with a sentence and the parts it lights. Inside the core, Play starts it (the plain view opens the steps as a list): the step's line is lit, a token travels it from just off one box to just off the other (so it never sits on a name), the part it moves toward gets a heavy edge, and the parts it touches are tinted with a heavy edge. The detail line says "Step n of N." and the sentence, with Back, Next and Stop. A flow whose step names a line the data lacks, goes toward neither end, or lights a part outside the core is not offered at all. Under reduced motion the token jumps.
- **Lines inside the core read as what they are** (seat rulings on capsomer#64). A line that runs under a box, or a bend or crossing beside another line, reads as a connection that is not there (an edge tunnel, Dunne and Shneiderman 2009). So, in `insideScene`:
  - every box sits inside the boundary, or outside it, with clear space, and the boundary's name is clear of every box;
  - no line runs under a box it does not end at, or under the boundary's name, and every line keeps `ROUTE_CLEAR` (8 units, over 5 px on a 320 px phone) from every box but its ends;
  - lines that share a box leave it at their own points (ports), spread along the side that faces their far ends, and two lines running nearly parallel keep `LINE_SEP` apart, so neither reads as one doubled line;
  - a line never crosses another within `JUNCTION_END` of that line's ends, nor anywhere along a line shorter than `SHORT_LINK`, where a crossing reads as a three-way junction;
  - no bend sits within `BEND_CLEAR` of another line.

  Lines are routed one at a time, shortest first, each the shortest way between its ports through the corners of what is in its way. Crossing a box or the name is never allowed; the softer rules cost far more than any detour, so a route breaks one only when every way around breaks one too. Capsid's own core keeps every rule; the unit tests also route 100 seeded random cores, far more crowded, where no line crosses a box or the name and each softer rule holds for at least 19 lines in 20. The boxes sit in rows of two (workers, sites, crons) above rows of three (stores), spread along the circle's chords, at least 80 units apart where the drawing allows.
- **With circles, one tap goes inside any system** (Dustin, 2026-10-18: "it's not intuitive to click twice"). `circleLayers` (`capsomer/system-map-circles`) draws every system's circle at build time: its own parts inside, what it works with outside and every system it connects to round the rim, one wire from the exact part that uses each line, and a line between two systems as wholes from the circle's edge, left out where a part already wires to that system. The places are searched for from fixed seeds, so the same data always draws the same way: no two boxes touch, no wire runs under a box or the name, and no two wires cross where any placement avoids it, curving gently where a straight line cannot. A large family takes minutes, so a host keeps the circles it found (`saved`, under a key of what drew each one) and only a circle whose system, neighbors or the search's own code changed is searched again. `systemMapHtml` takes them as `circles`: the core's inside is its circle, the flows play on it, and one tap on any capsomer zooms into that system's circle, growing out of the capsomer. A system on the rim is a tap that zooms there; Back to all systems (beside the views), Escape anywhere on the page or a tap outside the circle returns, with focus on the capsomer left. Only the circle shown is drawn, and it sizes the stage. `circles.src` names all of them as one JSON object, fetched once the page has loaded, so a page carries none at rest; `circles.chosen` delivers that system zoomed into, so a shared link opens there with no script.
- **The same data is always a list.** The delivered HTML holds a list grouped by ring with every name, word, address and link, open with no script and behind "The same map as a list" with it. The plain view shows that list as columns. Neither is a second source.
- **Rendered by `systemMapHtml`**, a pure function, so a server or a static build delivers the whole contract and the script only enhances it. Hex geometry is computed there: no layout engine ships.
- **Three layers, moved whole.** The core, the inner rings and the rim are separate drawings over one viewBox, and going inside animates only their transform and opacity, which the compositor does without repainting. Nothing moves under reduced motion.
- **Private is a dashed edge and the word "private".** A private system shows its name and address only, and has nothing to open.
- **Chosen is a heavier edge and a tint, never the tint alone.** In forced colors an SVG keeps its own colors, so the map sets system colors itself: every capsomer and part, stores included, is Canvas with a CanvasText edge, the lines are CanvasText, and the chosen, focused, lit and moving ones use Highlight.
- **The panel's headings are in the page's own face** (`--face`), as the text around them is.
- **The detail line keeps its height**, so choosing never moves what is below the map.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Enters the map on the core (one tab stop), and leaves it |
| Arrow keys | Move to the nearest capsomer in that direction |
| Home, End | The core, the last capsomer |
| Enter, Space | Choose the capsomer and draw its connections; on the chosen core, go inside. With circles, go inside any system |
| Escape | Playing a flow, stop it; inside, step out to the core (with circles, from anywhere on the page, back to the map); otherwise clear the choice |
| Left, Right arrow | Playing a flow, the step before or after |
| 1 to 9 | Playing a flow, that step |

## Accessibility

- Delivered with no script, the stage is one picture (`role="img"`) with a name that points to the list, and the list is open.
- With script, the stage is a group named by the map's title and described by a line of keys; each capsomer is a button (`aria-pressed`) named by its name and word. One tab stop, roving.
- The detail line is a polite live region. Inside, the inner drawing is a picture named by its parts, and focus moves to Step out. Playing a flow, each step's sentence is announced there, focus stays on the control pressed (or moves to Next, then Back, when it is disabled), and Stop returns focus to Play. A host's own call (`playFlow`, `step`) leaves focus where it is.
- Each flow is also an ordered list of its steps, open with no script, behind "Inside Capsid, step by step" with it.
- Text 4.5:1 on its tile in both themes; edges and the focus ring 3:1.

Last checked by hand: not yet (screen readers before release).

## Markup

Render it; do not write it by hand.

```ts
import { enhance, systemMapHtml } from "capsomer/behavior/system-map";
container.innerHTML = systemMapHtml(data, { id: "family", label: "The family", caption: "..." });
enhance(container);
```

`modelMapData(model, href?)` turns Capsid's public model into `data`, the same on every host: each system's family becomes its word and, for what people use, its group (sites are Websites, products Apps, writing Writing, the rest Tools; an id ending `-mcp` says admin).

```ts
// At build time, keeping `saved` in a file beside the build:
import { circleLayers } from "capsomer/system-map-circles";
const layers = circleLayers(data, { saved });
container.innerHTML = systemMapHtml(data, { id: "family", circles: { src: "/insides.json", layers: chosen ? { [chosen]: layers[chosen] } : {}, chosen } });
```

`data` is `{ systems, relationships?, containers?, flows? }`: a flow is `{ id, name, description?, steps: [{ from, to, toward, text, lights? }] }`, a system is `{ id, name, short?, ring: "core" | "shared" | "used", private?, tag?, group?, description?, domain?, href? }`, a relationship `{ from, to, kind }`, a container `{ id, system, name, kind, technology? }`. The first core system takes the middle; shared parts fill ring 1 and spill outward; what people use starts on the next ring. Unused cells of a drawn ring are empty shell. When the systems people use carry a `group` (Websites, Apps), each group is drawn together, its systems chained in the order given so each touches the one before it, apart from every other group, with its name beside it in `text.cap-system-map-group-label` on `svg.cap-system-map-layer[data-layer="labels"]`; the gaps between groups are not drawn, and the list is sectioned by group.

The contract: `figure.cap-system-map[data-cap="system-map"][data-view="shell|plain"]` holding `figcaption.cap-system-map-head` (`.cap-system-map-title`, `.cap-system-map-caption`, `.cap-system-map-views` with two `button[data-view]`), `div.cap-system-map-stage` with `svg.cap-system-map-layer[data-layer="core|inner|rim|edges|labels|inside"]`, each capsomer `g.cap-system-map-tile[data-id][data-x][data-y][data-ring]` (`data-core`, `data-shared`, `data-private`, `data-empty`, `data-linked`), each line `path.cap-system-map-edge[data-from][data-to][data-kind]` (`data-loose`, `data-on`), inside, each part `g.cap-system-map-box[data-id][data-x][data-y]` (`data-store`, `data-external`, and while a flow plays `data-lit` and `data-at`), each line between parts `path.cap-system-map-wire[data-from][data-to][data-route]` (`data-on`; in a circle `data-loose` and `data-whole`), whose `data-route` lists its corners from port to port, and `circle.cap-system-map-token` when a flow can play, `div.cap-system-map-detail`, `details.cap-system-map-list` of `section.cap-system-map-group` lists, and `details.cap-system-map-flows` of `section.cap-system-map-flow[data-flow]` (`.cap-system-map-flow-name`, `.cap-system-map-flow-text`, an `ol` whose `li[data-from][data-to][data-toward][data-lights]` are the steps). With circles, the root also carries `data-circles` and `data-insides` (the address of every circle), each circle is `svg.cap-system-map-layer[data-layer="inside"][data-system]` (`data-shown` on the one zoomed into), another system on its rim `g.cap-system-map-rim[data-goto]` (`data-private`) with `text.cap-system-map-rim-name`, a circle with no parts says its name and summary in `text.cap-system-map-inside-name` and `text.cap-system-map-inside-text`, and the views hold `button[data-cap-part="out"]`. The root carries `data-selected`, `data-entered`, with circles `data-zoom` (the system zoomed into) and `data-insides-ready` once every circle is in, and while a flow plays `data-flow` and `data-step`. Events: `cap:system-map-select` (`{ id }`), `cap:system-map-enter` (`{ id }`, the system gone into), `cap:system-map-leave` (`{ id }`, the system left) and `cap:system-map-flow` (`{ id, step }`, and `{ id: null, step: 0 }` whenever a flow stops: Stop, Escape, stepping out, choosing a system, the plain view or `destroy`). The controller adds `playFlow(id, step?)`, `step(n)` and `stopFlow()`; with circles, `enter(id)` zooms into any system.

## Exceptions in production

None. Its homes are dustinedwards.info's `/systems` and the Capsid explorer, both with circles.
