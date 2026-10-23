// The system map's markup: the whole contract as a string, for a server or a static build (system-map.ts).

import { type Cell, EXTERNAL, LOOSE_KINDS, type Layout, type MapContainer, type MapRing, type MapSystem, R, STORE_KINDS, type SystemMapData, type SystemMapOptions, layoutMap } from "./system-map-data.ts";
import { BOX_H, insideScene, playableFlows } from "./system-map-inside.ts";

// ---------------------------------------------------------------------------------------
// Rendering.

const RING_NAMES: Record<MapRing, string> = { core: "Runs everything", shared: "Shared parts", used: "What people use" };

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function hexPoints(x: number, y: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function tagOf(s: MapSystem): string {
  return s.private ? "private" : (s.tag ?? "");
}

function tileSvg(cell: Cell, s: MapSystem | undefined): string {
  const pts = hexPoints(cell.x, cell.y, R - 2.5);
  if (!s) return `<g class="cap-system-map-tile" data-empty><polygon points="${pts}"/></g>`;
  const label = escapeHtml(s.short ?? s.name);
  const tag = tagOf(s);
  const core = s.ring === "core" && cell.ring === 0;
  const nameY = core ? cell.y + 5 : tag ? cell.y + 1 : cell.y + 4;
  const name = `<text class="cap-system-map-name" x="${cell.x}" y="${nameY}">${label}</text>`;
  // The leading space keeps the two lines apart as words in the tile's text ("Capsomer shared",
  // matching its name "Capsomer, shared"); SVG drops it when drawing.
  const sub = tag && !core ? `<text class="cap-system-map-tag" x="${cell.x}" y="${cell.y + 16}"> ${escapeHtml(tag)}</text>` : "";
  const flags = `${core ? " data-core" : ""}${s.ring === "shared" ? " data-shared" : ""}${s.private ? " data-private" : ""}`;
  return `<g class="cap-system-map-tile" data-id="${escapeHtml(s.id)}" data-x="${cell.x}" data-y="${cell.y}" data-ring="${cell.ring}"${flags}><polygon points="${pts}"/>${name}${sub}</g>`;
}

// The lines run in the seams between capsomers and are drawn beneath them, so no line
// ever crosses a label: each is the shortest walk along the hexagons' sides from a corner
// of one capsomer to a corner of the other (seat ruling on capsomer#57, 2026-10-10). Among
// walks of the same length the one nearest the straight line between the two wins. The
// grid is a few dozen corners, so a plain search does it: no layout engine.

const cornerKey = (x: number, y: number) => `${Math.round(x * 10)},${Math.round(y * 10)}`;

function cornersOf(c: Cell): Array<[number, number]> {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return [Math.round((c.x + R * Math.cos(a)) * 100) / 100, Math.round((c.y + R * Math.sin(a)) * 100) / 100] as [number, number];
  });
}

/** The walk along the seams from capsomer `a` to capsomer `b`, as the corners it passes.
 *  Neighbours share a side, and their line is that side. */
export function seamRoute(cells: readonly Cell[], a: Cell, b: Cell): Array<[number, number]> {
  const at = new Map<string, [number, number]>();
  const next = new Map<string, Set<string>>();
  for (const c of cells) {
    const cs = cornersOf(c);
    cs.forEach(([x, y], i) => {
      const k = cornerKey(x, y);
      const [nx, ny] = cs[(i + 1) % 6]!;
      const nk = cornerKey(nx, ny);
      at.set(k, [x, y]);
      at.set(nk, [nx, ny]);
      if (!next.has(k)) next.set(k, new Set());
      if (!next.has(nk)) next.set(nk, new Set());
      next.get(k)!.add(nk);
      next.get(nk)!.add(k);
    });
  }
  const starts = new Set(cornersOf(a).map(([x, y]) => cornerKey(x, y)));
  const ends = new Set(cornersOf(b).map(([x, y]) => cornerKey(x, y)));
  const shared = [...starts].filter((k) => ends.has(k));
  if (shared.length >= 2) return shared.slice(0, 2).map((k) => at.get(k)!);
  // How far a side's middle is from the straight line a-b, as a tie-break well under
  // the cost of a side.
  const lx = b.x - a.x;
  const ly = b.y - a.y;
  const len = Math.hypot(lx, ly) || 1;
  const off = (p: [number, number], q: [number, number]) => Math.abs(((p[0] + q[0]) / 2 - a.x) * ly - ((p[1] + q[1]) / 2 - a.y) * lx) / len / (R * 100);
  const cost = new Map<string, number>([...starts].map((k) => [k, 0]));
  const from = new Map<string, string>();
  const done = new Set<string>();
  for (;;) {
    let here: string | null = null;
    for (const [k, v] of cost) if (!done.has(k) && (here === null || v < cost.get(here)!)) here = k;
    if (here === null) return [];
    if (ends.has(here)) {
      const walk = [here];
      while (from.has(walk[0]!)) walk.unshift(from.get(walk[0]!)!);
      return walk.map((k) => at.get(k)!);
    }
    done.add(here);
    for (const k of next.get(here) ?? []) {
      if (done.has(k)) continue;
      const v = cost.get(here)! + 1 + off(at.get(here)!, at.get(k)!);
      if (v < (cost.get(k) ?? Number.POSITIVE_INFINITY)) {
        cost.set(k, v);
        from.set(k, here);
      }
    }
  }
}

function edgePath(cells: readonly Cell[], a: Cell, b: Cell): string {
  const f = (n: number) => n.toFixed(1);
  return seamRoute(cells, a, b)
    .map(([x, y], i) => `${i ? "L" : "M"}${f(x)},${f(y)}`)
    .join(" ");
}

export interface Box {
  c: MapContainer;
  x: number;
  y: number;
  w: number;
}

const f1 = (n: number) => Math.round(n * 10) / 10;

function insideSvg(layout: Layout, core: MapSystem | undefined, data: SystemMapData, playable: boolean): string {
  const containers = core ? (data.containers ?? []).filter((c) => c.system === core.id) : [];
  if (!core || containers.length === 0) return "";
  const scene = insideScene(containers, data.relationships ?? [], layout, `Inside ${core.name}`);
  const wires = scene.wires
    .map(({ from, to, route }) => {
      const pts = route.map(([x, y]) => `${f1(x)},${f1(y)}`);
      return `<path class="cap-system-map-wire" data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}" data-route="${pts.join(" ")}" d="M${pts.join(" L")}"/>`;
    })
    .join("");
  const rects = scene.boxes
    .map(({ c, x, y, w }) => {
      const store = STORE_KINDS.has(c.kind);
      const flag = store ? " data-store" : c.kind === EXTERNAL ? " data-external" : "";
      return `<g class="cap-system-map-box" data-id="${escapeHtml(c.id)}" data-x="${x}" data-y="${y}"${flag}><rect x="${f1(x - w / 2)}" y="${f1(y - BOX_H / 2)}" width="${w}" height="${BOX_H}" rx="${store ? 14 : 6}"/><text class="cap-system-map-box-name" x="${x}" y="${f1(y - 1)}">${escapeHtml(c.name)}</text><text class="cap-system-map-box-kind" x="${x}" y="${f1(y + 11)}">${escapeHtml(c.technology ?? c.kind)}</text></g>`;
    })
    .join("");
  const b = scene.boundary;
  const [vx, vy, vw, vh] = scene.viewBox;
  return `<svg class="cap-system-map-layer" data-layer="inside" viewBox="${f1(vx)} ${f1(vy)} ${f1(vw)} ${f1(vh)}" aria-hidden="true" focusable="false"><circle class="cap-system-map-boundary" cx="${f1(b.cx)}" cy="${f1(b.cy)}" r="${f1(b.r)}"/><text class="cap-system-map-inside-title" x="${f1(scene.label.textX)}" y="${f1(scene.label.textY)}"${scene.label.squeeze ? ` textLength="${f1(scene.label.squeeze)}" lengthAdjust="spacingAndGlyphs"` : ""}>${escapeHtml(scene.label.text)}</text>${wires}${rects}${playable ? `<circle class="cap-system-map-token" r="6" cx="0" cy="0"/>` : ""}</svg>`;
}

/**
 * The whole map as HTML: the head with the view switch, the stage (the core, the inner
 * rings and the rim as three layers, the lines, and the inside), the detail line, and the
 * same data as a list, grouped by ring (or by group). Every text is escaped. Delivered with no script,
 * the drawing is a picture with a label and the list is open.
 */
export function systemMapHtml(data: SystemMapData, options: SystemMapOptions = {}): string {
  const id = options.id ?? "system-map";
  const label = options.label ?? "System map";
  const names = { ...RING_NAMES, ...options.ringNames };
  const h = `h${options.headingLevel ?? 3}`;
  const layout = layoutMap(data.systems);
  const byId = new Map(data.systems.map((s) => [s.id, s]));
  const at = new Map(layout.cells.filter((c) => c.id).map((c) => [c.id!, c]));
  const vb = layout.viewBox.map((n) => n.toFixed(1)).join(" ");
  const layer = (name: string, cells: Cell[]) =>
    `<svg class="cap-system-map-layer" data-layer="${name}" viewBox="${vb}" aria-hidden="true" focusable="false">${cells.map((c) => tileSvg(c, c.id ? byId.get(c.id) : undefined)).join("")}</svg>`;
  const rim = layout.rings;
  const coreCells = layout.cells.filter((c) => c.ring === 0);
  // Grouped, the gaps are not drawn, and every group goes behind the circle inside, as the
  // rim does: the groups are what people use, whatever ring a cell of theirs is on.
  const drawn = layout.grouped ? layout.cells.filter((c) => c.id) : layout.cells;
  const outerCell = (c: Cell) => (layout.grouped ? byId.get(c.id!)?.ring === "used" : c.ring === rim);
  const innerCells = drawn.filter((c) => c.ring > 0 && !outerCell(c));
  const rimCells = rim > 0 ? drawn.filter((c) => c.ring > 0 && outerCell(c)) : [];
  const labels = layout.labels
    .map((l) => `<text class="cap-system-map-group-label" x="${l.x}" y="${l.y}">${escapeHtml(l.text)}</text>`)
    .join("");
  const onMap = new Set(at.keys());
  const edges = (data.relationships ?? [])
    .filter((l) => onMap.has(l.from) && onMap.has(l.to) && l.from !== l.to)
    .map((l) => `<path class="cap-system-map-edge" data-from="${escapeHtml(l.from)}" data-to="${escapeHtml(l.to)}" data-kind="${escapeHtml(l.kind)}"${LOOSE_KINDS.has(l.kind) ? " data-loose" : ""} d="${edgePath(layout.cells, at.get(l.from)!, at.get(l.to)!)}"/>`)
    .join("");
  const core = data.systems.find((s) => s.ring === "core");
  const placed = data.systems.filter((s) => onMap.has(s.id));
  // The list in the map's own sections: the rings, or, grouped, the core, the shared ring
  // and each group in turn.
  const sections: Array<[string, MapSystem[]]> = (["core", "shared", "used"] as const).flatMap((ring) => {
    const items = placed.filter((s) => s.ring === ring);
    if (ring !== "used" || !layout.grouped) return [[names[ring], items] as [string, MapSystem[]]];
    return [...new Set(items.map((s) => s.group ?? ""))].map((g) => [g || names.used, items.filter((s) => (s.group ?? "") === g)] as [string, MapSystem[]]);
  });
  const list = sections
    .map(([title, items]) => {
      if (items.length === 0) return "";
      const lis = items
        .map((s) => {
          const parts = [`<span class="cap-system-map-item-name">${escapeHtml(s.name)}</span>`];
          if (tagOf(s)) parts.push(`<span class="cap-system-map-item-tag">${escapeHtml(tagOf(s))}</span>`);
          if (s.description) parts.push(`<span class="cap-system-map-item-text">${escapeHtml(s.description)}</span>`);
          if (s.domain) parts.push(`<span class="cap-system-map-item-domain">${escapeHtml(s.domain)}</span>`);
          if (s.href) parts.push(`<a class="cap-system-map-item-link" href="${escapeHtml(s.href)}">${escapeHtml(options.openLabel ?? "Open")}<span class="cap-sr-only"> ${escapeHtml(s.name)}</span></a>`);
          return `<li data-id="${escapeHtml(s.id)}">${parts.join(" ")}</li>`;
        })
        .join("");
      return `<section class="cap-system-map-group"><${h} class="cap-system-map-group-name">${escapeHtml(title)}</${h}><ul>${lis}</ul></section>`;
    })
    .join("");
  const caption = options.caption ? `<p class="cap-system-map-caption">${escapeHtml(options.caption)}</p>` : "";
  // Each flow as an ordered list, step by step: the whole story with no script, and the
  // steps the script plays (a step's line, the end it moves toward and what it lights).
  const playable = playableFlows(data, core, layout);
  const flows = playable
    .map((f) => {
      const steps = f.steps
        .map((st) => `<li data-from="${escapeHtml(st.from)}" data-to="${escapeHtml(st.to)}" data-toward="${escapeHtml(st.toward)}"${st.lights?.length ? ` data-lights="${escapeHtml(st.lights.join(" "))}"` : ""}>${escapeHtml(st.text)}</li>`)
        .join("");
      return `<section class="cap-system-map-flow" data-flow="${escapeHtml(f.id)}"><${h} class="cap-system-map-flow-name">${escapeHtml(f.name)}</${h}>${f.description ? `<p class="cap-system-map-flow-text">${escapeHtml(f.description)}</p>` : ""}<ol>${steps}</ol></section>`;
    })
    .join("");
  return [
    `<figure class="cap-system-map" data-cap="system-map" data-view="shell" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-title"${options.openLabel ? ` data-open-label="${escapeHtml(options.openLabel)}"` : ""}>`,
    `<figcaption class="cap-system-map-head"><span class="cap-system-map-title" id="${escapeHtml(id)}-title">${escapeHtml(label)}</span>${caption}`,
    `<span class="cap-system-map-views" role="group" aria-label="View" data-cap-part="views" hidden><button type="button" class="cap-btn" data-view="shell" aria-pressed="true">Capsid</button><button type="button" class="cap-btn" data-view="plain" aria-pressed="false">Plain map</button></span></figcaption>`,
    `<div class="cap-system-map-stage" data-cap-part="stage" role="img" aria-label="${escapeHtml(label)}: ${placed.length} systems ${layout.grouped ? "in groups" : "in rings"}. The list below holds the same.">`,
    // The lines first, so every capsomer and its label is painted over them.
    `<svg class="cap-system-map-layer" data-layer="edges" viewBox="${vb}" aria-hidden="true" focusable="false">${edges}</svg>`,
    layer("core", coreCells),
    innerCells.length ? layer("inner", innerCells) : "",
    rimCells.length ? layer("rim", rimCells) : "",
    labels ? `<svg class="cap-system-map-layer" data-layer="labels" viewBox="${vb}" aria-hidden="true" focusable="false">${labels}</svg>` : "",
    insideSvg(layout, core, data, playable.length > 0),
    `</div>`,
    `<div class="cap-system-map-detail" data-cap-part="detail" aria-live="polite" hidden></div>`,
    `<span id="${escapeHtml(id)}-keys" hidden>Arrow keys move between systems. Enter or Space chooses one and draws its connections${core ? `; on ${escapeHtml(core.name)}, Enter again goes inside` : ""}. Escape steps back out.${flows ? " Playing a flow, the left and right arrows and the number keys move between its steps." : ""}</span>`,
    `<details class="cap-system-map-list" data-cap-part="list" open><summary>The same map as a list</summary><div class="cap-system-map-groups">${list}</div></details>`,
    flows ? `<details class="cap-system-map-flows" data-cap-part="flows" open><summary>Inside ${escapeHtml(core?.name ?? "")}, step by step</summary>${flows}</details>` : "",
    `</figure>`,
  ].join("");
}
