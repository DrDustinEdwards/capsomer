---
name: system-map
title: System map
summary: A family of systems drawn as a capsid, the systems as its capsomers. Choose one to draw its connections; choose the core again to go inside it. The same data is always a list.
parts: [css, behaviour]
tool: own JavaScript
states: [the family as a capsid, a system chosen with its connections drawn, inside the core, the plain map, under the pointer, keyboard focus, as delivered with no script]
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

- Showing a family of systems as a whole: what is at the centre, what is shared, what people use.
- A page that should let a stranger find their way into deeper views of one system.

## When not to

- A dependency graph with many lines at once: the map draws one system's lines at a time. Use a chart from Enarratio.
- A list someone scans for one name: the plain view, or a table.
- A hierarchy a person opens and closes: the tree.

## The default and its reason

- **Rings carry the meaning, lines appear on demand.** At rest a stranger reads layers, not wires; neighbours on the shell are not claimed to be connected. Choosing a capsomer draws its lines, solid where it installs or publishes, dashed where it is coordinated or watched.
- **Going inside is the zoom.** Choosing the core again folds the inner rings into the middle and fades the rim, and the core's containers appear within a dashed boundary: the C4 system boundary, drawn literally. Escape or Step out returns.
- **The same data is always a list.** The delivered HTML holds a list grouped by ring with every name, word, address and link, open with no script and behind "The same map as a list" with it. The plain view shows that list as columns. Neither is a second source.
- **Rendered by `systemMapHtml`**, a pure function, so a server or a static build delivers the whole contract and the script only enhances it. Hex geometry is computed there: no layout engine ships.
- **Three layers, moved whole.** The core, the inner rings and the rim are separate drawings over one viewBox, and going inside animates only their transform and opacity, which the compositor does without repainting. Nothing moves under reduced motion.
- **Private is a dashed edge and the word "private".** A private system shows its name and address only, and has nothing to open.
- **Chosen is a heavier edge and a tint, never the tint alone.** In forced colours the chosen and focused edges use Highlight.
- **The detail line keeps its height**, so choosing never moves what is below the map.

## Keyboard

| Key | Does |
| --- | --- |
| Tab | Enters the map on the core (one tab stop), and leaves it |
| Arrow keys | Move to the nearest capsomer in that direction |
| Home, End | The core, the last capsomer |
| Enter, Space | Choose the capsomer and draw its connections; on the chosen core, go inside |
| Escape | Inside, step out to the core; otherwise clear the choice |

## Accessibility

- Delivered with no script, the stage is one picture (`role="img"`) with a name that points to the list, and the list is open.
- With script, the stage is a group named by the map's title and described by a line of keys; each capsomer is a button (`aria-pressed`) named by its name and word. One tab stop, roving.
- The detail line is a polite live region. Inside, the inner drawing is a picture named by its parts, and focus moves to Step out.
- Text 4.5:1 on its tile in both themes; edges and the focus ring 3:1.

Last checked by hand: not yet (screen readers before release).

## Markup

Render it; do not write it by hand.

```ts
import { enhance, systemMapHtml } from "capsomer/behaviour/system-map";
container.innerHTML = systemMapHtml(data, { id: "family", label: "The family", caption: "..." });
enhance(container);
```

`data` is `{ systems, relationships?, containers? }`: a system is `{ id, name, short?, ring: "core" | "shared" | "used", private?, tag?, description?, domain?, href? }`, a relationship `{ from, to, kind }`, a container `{ id, system, name, kind, technology? }`. The first core system takes the middle; shared parts fill ring 1 and spill outward; what people use starts on the next ring. Unused cells of a drawn ring are empty shell.

The contract: `figure.cap-system-map[data-cap="system-map"][data-view="shell|plain"]` holding `figcaption.cap-system-map-head` (`.cap-system-map-title`, `.cap-system-map-caption`, `.cap-system-map-views` with two `button[data-view]`), `div.cap-system-map-stage` with `svg.cap-system-map-layer[data-layer="core|inner|rim|edges|inside"]`, each capsomer `g.cap-system-map-tile[data-id][data-x][data-y][data-ring]` (`data-core`, `data-shared`, `data-private`, `data-empty`), each line `path.cap-system-map-edge[data-from][data-to][data-kind]` (`data-loose`, `data-on`), `div.cap-system-map-detail`, and `details.cap-system-map-list` of `section.cap-system-map-group` lists. The root carries `data-selected` and `data-entered`. Events: `cap:system-map-select` (`{ id }`) and `cap:system-map-enter` (`{ id }`).

## Exceptions in production

None yet. Its first homes are dustinedwards.info's `/systems` and the Capsid explorer.
