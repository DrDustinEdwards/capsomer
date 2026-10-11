// The system map: a family of systems drawn as a capsid, the systems as its capsomers
// (capsid/rulings/system-explorer-2026-10-10.md; the design is
// capsid/research/design-system-explorer.md, section 3). The core system sits in the
// middle, shared parts in the ring around it, and what people use on the outside. At rest
// there are no lines; choosing a capsomer draws its connections, and choosing the core
// again goes inside it, where its containers sit within the shell's boundary.
//
// `systemMapHtml` renders the whole contract as a string, so a server or a static build
// delivers it (the list of the same data is readable with no script). `enhance` adds the
// roles, one tab stop with the arrow keys moving between neighbours, choosing, going in
// and out, and the plain view. No framework, no storage.

// ---------------------------------------------------------------------------------------
// Data. The shape of Capsid's public model (capsid/system/model.json through toPublic),
// narrowed to what the map draws; a host maps its own data onto it.

export type MapRing = "core" | "shared" | "used";

export interface MapSystem {
  id: string;
  name: string;
  // The capsomer's label: a capsomer is about 90 px across on a phone.
  short?: string;
  ring: MapRing;
  private?: boolean;
  // A word under the label (tool, site, product); a private system shows "private".
  tag?: string;
  description?: string;
  domain?: string;
  // Where "Open" goes: the explorer's page for this system.
  href?: string;
}

export interface MapLink {
  from: string;
  to: string;
  kind: string;
}

export interface MapContainer {
  id: string;
  system: string;
  name: string;
  kind: string;
  technology?: string;
}

// A flow: ordered steps over the core's lines, each moving toward one end with a sentence,
// lighting the parts it touches (design section 4, animated flows). A step names a line
// the data already holds, so a flow can never show a connection the map does not.
export interface MapFlowStep {
  from: string;
  to: string;
  toward: string;
  text: string;
  lights?: readonly string[];
}

export interface MapFlow {
  id: string;
  name: string;
  description?: string;
  steps: readonly MapFlowStep[];
}

export interface SystemMapData {
  systems: readonly MapSystem[];
  relationships?: readonly MapLink[];
  containers?: readonly MapContainer[];
  flows?: readonly MapFlow[];
}

export interface SystemMapOptions {
  // Unique on the page; prefixes every id the map writes.
  id?: string;
  label?: string;
  caption?: string;
  ringNames?: Partial<Record<MapRing, string>>;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  openLabel?: string;
}

// ---------------------------------------------------------------------------------------
// Geometry. Flat-top hexagons in axial coordinates, ring by ring: ring 0 is one cell,
// ring k has 6k. A capsid seen down its three-fold axis has a hexagonal outline, which is
// why the disc reads as a shell.

export const R = 46;
const SQRT3 = Math.sqrt(3);
// Kinds drawn dashed: a line that coordinates or watches rather than carries.
const LOOSE_KINDS = new Set(["coordinates", "watches"]);
const STORE_KINDS = new Set(["database", "bucket", "kv", "queue"]);
const EXTERNAL = "external";
const BOX_W = 104;

export function ringCells(k: number): Array<[number, number]> {
  if (k === 0) return [[0, 0]];
  const dirs: Array<[number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const out: Array<[number, number]> = [];
  let q = -k;
  let r = k;
  for (const [dq, dr] of dirs) {
    for (let j = 0; j < k; j++) {
      out.push([q, r]);
      q += dq;
      r += dr;
    }
  }
  return out;
}

export interface Cell {
  id: string | null;
  ring: number;
  x: number;
  y: number;
}

export interface Layout {
  cells: Cell[];
  // The outermost ring drawn.
  rings: number;
  viewBox: [number, number, number, number];
}

const toXY = (q: number, r: number): [number, number] => [Math.round(1.5 * R * q * 100) / 100, Math.round(SQRT3 * R * (r + q / 2) * 100) / 100];

/**
 * Places the systems: the first core system in the middle; shared parts from ring 1,
 * spilling outward if there are more than fit; what people use from the ring after the
 * last shared one. Every cell of every ring up to the last filled one is drawn, the unused
 * ones as empty shell. Systems keep the order they are given in.
 */
export function layoutMap(systems: readonly MapSystem[]): Layout {
  const core = systems.filter((s) => s.ring === "core");
  const inner = [...core.slice(1), ...systems.filter((s) => s.ring === "shared")];
  const outer = systems.filter((s) => s.ring === "used");
  const placed: Array<{ id: string | null; ring: number; q: number; r: number }> = [];
  const fill = (ids: Array<string | null>, startRing: number): number => {
    let ring = startRing;
    let i = 0;
    while (i < ids.length) {
      for (const [q, r] of ringCells(ring)) placed.push({ id: i < ids.length ? ids[i++]! : null, ring, q, r });
      if (i < ids.length) ring++;
    }
    return ring;
  };
  placed.push({ id: core[0]?.id ?? null, ring: 0, q: 0, r: 0 });
  const lastInner = inner.length ? fill(inner.map((s) => s.id), 1) : 0;
  const rings = outer.length ? fill(outer.map((s) => s.id), lastInner + 1) : lastInner;
  const cells = placed.map(({ id, ring, q, r }) => {
    const [x, y] = toXY(q, r);
    return { id, ring, x, y };
  });
  const halfW = 1.5 * R * rings + R + 6;
  const halfH = SQRT3 * R * rings + (SQRT3 * R) / 2 + 6;
  return { cells, rings, viewBox: [-halfW, -halfH, halfW * 2, halfH * 2] };
}

export type Direction = "up" | "down" | "left" | "right";
const VECTORS: Record<Direction, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** The capsomer an arrow key moves to: the nearest one within 60 degrees of the arrow's
 *  direction, preferring the straight line; null at the edge of the map. */
export function spatialNext(tiles: ReadonlyArray<{ id: string; x: number; y: number }>, from: string, dir: Direction): string | null {
  const here = tiles.find((t) => t.id === from);
  if (!here) return null;
  const [dx, dy] = VECTORS[dir];
  let best: { id: string; score: number } | null = null;
  for (const t of tiles) {
    if (t.id === from) continue;
    const vx = t.x - here.x;
    const vy = t.y - here.y;
    const along = vx * dx + vy * dy;
    if (along <= 0) continue;
    const across = Math.abs(vx * dy - vy * dx);
    if (across > along * SQRT3) continue;
    const score = along + 2 * across;
    if (!best || score < best.score) best = { id: t.id, score };
  }
  return best?.id ?? null;
}

/** The lines a chosen capsomer shows: every relationship touching it whose other end is
 *  on the map. */
export function linksOf(links: readonly MapLink[], id: string, onMap: ReadonlySet<string>): MapLink[] {
  return links.filter((l) => (l.from === id || l.to === id) && onMap.has(l.from) && onMap.has(l.to) && l.from !== l.to);
}

/** The words the detail line ends with. */
export function connectionText(n: number): string {
  return n === 0 ? "No connections drawn" : n === 1 ? "1 connection drawn" : `${n} connections drawn`;
}

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
  const sub = tag && !core ? `<text class="cap-system-map-tag" x="${cell.x}" y="${cell.y + 16}">${escapeHtml(tag)}</text>` : "";
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

/** The core's containers inside the shell: workers, sites and crons two to a row, stores
 *  three to a row below them. An `external` container is not inside: see outsideLayout.
 *  The gaps between boxes are wider than two clearances (ROUTE_CLEAR), so a line routed by
 *  wireRoute can always pass between two neighbours rather than under either. */
export function insideLayout(containers: readonly MapContainer[]): Box[] {
  const tops = containers.filter((c) => !STORE_KINDS.has(c.kind) && c.kind !== EXTERNAL);
  const stores = containers.filter((c) => STORE_KINDS.has(c.kind));
  const out: Box[] = [];
  const topRows = Math.ceil(tops.length / 2);
  const firstY = -26 - 26 * Math.max(0, topRows - 1);
  // The stores start under the last row of the rest, so a fourth row never lands on them.
  const storesY = Math.max(62, firstY + (topRows - 1) * 52 + 62);
  tops.forEach((c, i) => {
    const row = Math.floor(i / 2);
    const inRow = Math.min(2, tops.length - row * 2);
    const x = inRow === 1 ? 0 : i % 2 === 0 ? -60 : 60;
    out.push({ c, x, y: firstY + row * 52, w: 104 });
  });
  stores.forEach((c, i) => {
    const row = Math.floor(i / 3);
    const inRow = Math.min(3, stores.length - row * 3);
    const col = i % 3;
    const x = (col - (inRow - 1) / 2) * 100;
    out.push({ c, x, y: storesY + row * 44, w: 88 });
  });
  return out;
}

// A line between two parts never runs under a third: a line that passes beneath a box reads
// as a connection to it (an edge tunnel; Dunne and Shneiderman 2009), so the seat ruled on
// capsomer#64 that a line may cross another line but never pass under a box. The straight
// line is kept when it is clear; otherwise the line takes the shortest way around, through
// the corners of the boxes in its way, each held ROUTE_CLEAR from every box it does not end
// at. A dozen boxes make a few dozen corners, so a plain search does it: no layout engine.

export const ROUTE_CLEAR = 5;
const BOX_H = 32;

type Pt = [number, number];

/** Whether the segment p-q passes through the box's inside, grown by `grow`. */
export function segmentHitsBox(p: Pt, q: Pt, b: { x: number; y: number; w: number }, grow = 0): boolean {
  const [x0, x1, y0, y1] = [b.x - b.w / 2 - grow, b.x + b.w / 2 + grow, b.y - BOX_H / 2 - grow, b.y + BOX_H / 2 + grow];
  // Liang-Barsky: clip the segment to the box, strictly inside, so a touch is not a hit.
  let t0 = 0;
  let t1 = 1;
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  for (const [pk, qk] of [[-dx, p[0] - x0], [dx, x1 - p[0]], [-dy, p[1] - y0], [dy, y1 - p[1]]] as const) {
    if (pk === 0) {
      if (qk <= 0) return false;
      continue;
    }
    const r = qk / pk;
    if (pk < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 >= t1) return false;
  }
  return t1 - t0 > 1e-9;
}

/** The way a line takes from box `a` to box `b`: the corners it passes, centre to centre,
 *  clear of every other box. Straight when nothing is in the way. */
export function wireRoute(a: Box, b: Box, boxes: readonly Box[], bounds?: readonly [number, number, number, number]): Pt[] {
  const others = boxes.filter((o) => o !== a && o !== b);
  const start: Pt = [a.x, a.y];
  const end: Pt = [b.x, b.y];
  const clear = (p: Pt, q: Pt) => others.every((o) => !segmentHitsBox(p, q, o, ROUTE_CLEAR));
  if (clear(start, end)) return [start, end];
  const g = ROUTE_CLEAR + 1;
  // Bends stay inside the drawing, or inside the boxes' own reach where a crowded core
  // already runs past it.
  const [bx0, by0, bx1, by1] = boxes.reduce(
    ([x0, y0, x1, y1], o) => [Math.min(x0, o.x - o.w / 2 - g), Math.min(y0, o.y - BOX_H / 2 - g), Math.max(x1, o.x + o.w / 2 + g), Math.max(y1, o.y + BOX_H / 2 + g)],
    bounds ? [bounds[0], bounds[1], bounds[0] + bounds[2], bounds[1] + bounds[3]] : [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  );
  const within = ([px, py]: Pt) => !bounds || (px >= bx0 && px <= bx1 && py >= by0 && py <= by1);
  const corners: Pt[] = boxes
    .flatMap((o): Pt[] => [
      [o.x - o.w / 2 - g, o.y - BOX_H / 2 - g],
      [o.x + o.w / 2 + g, o.y - BOX_H / 2 - g],
      [o.x - o.w / 2 - g, o.y + BOX_H / 2 + g],
      [o.x + o.w / 2 + g, o.y + BOX_H / 2 + g],
    ])
    .filter((p) => within(p) && boxes.every((o) => !inside(p, o, ROUTE_CLEAR)));
  const nodes: Pt[] = [start, end, ...corners];
  // Shortest path, each bend costing a little, so of two near-equal ways the plainer wins.
  const dist = nodes.map(() => Number.POSITIVE_INFINITY);
  const prev = nodes.map(() => -1);
  const done = nodes.map(() => false);
  dist[0] = 0;
  for (;;) {
    let i = -1;
    for (let k = 0; k < nodes.length; k++) if (!done[k] && (i < 0 || dist[k]! < dist[i]!)) i = k;
    if (i < 0 || dist[i] === Number.POSITIVE_INFINITY || i === 1) break;
    done[i] = true;
    for (let k = 1; k < nodes.length; k++) {
      if (done[k] || !clear(nodes[i]!, nodes[k]!)) continue;
      const d = dist[i]! + Math.hypot(nodes[k]![0] - nodes[i]![0], nodes[k]![1] - nodes[i]![1]) + 8;
      if (d < dist[k]!) {
        dist[k] = d;
        prev[k] = i;
      }
    }
  }
  // No clear way (the tests hold that none of Capsomer's layouts reach here): the straight line.
  if (prev[1] === -1) return [start, end];
  const path: Pt[] = [];
  for (let k = 1; k !== -1; k = prev[k]!) path.unshift(nodes[k]!);
  return path;
}

function inside(p: Pt, o: Box, grow: number): boolean {
  return Math.abs(p[0] - o.x) < o.w / 2 + grow && Math.abs(p[1] - o.y) < BOX_H / 2 + grow;
}

/** The core's `external` containers (the agents that call it, the host its code lives on)
 *  outside the dashed boundary, as C4 draws an external system: in the drawing's corners,
 *  in the order given, top left, top right, bottom left, bottom right. Four at most, and
 *  none when the map is the core alone. */
export function outsideLayout(containers: readonly MapContainer[], layout: Layout): Box[] {
  // A map of the core alone has no room outside its boundary, so nothing is drawn there.
  if (layout.rings === 0) return [];
  const [, , w, h] = layout.viewBox;
  const x = w / 2 - BOX_W / 2 - 2;
  const y = h / 2 - 18;
  // A corner the core's own parts reach into (a small map, many parts) is left empty, so no
  // box lies on another and every line still has a way between them.
  const parts = insideLayout(containers);
  const g = 2 * (ROUTE_CLEAR + 1);
  const corners = ([[-x, -y], [x, -y], [-x, y], [x, y]] as Pt[])
    .map(([cx, cy]): Pt => [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10])
    .filter(([cx, cy]) => parts.every((p) => Math.abs(p.x - cx) >= (p.w + BOX_W) / 2 + g || Math.abs(p.y - cy) >= BOX_H + g));
  return containers
    .filter((c) => c.kind === EXTERNAL)
    .slice(0, corners.length)
    .map((c, i) => ({ c, x: corners[i]![0], y: corners[i]![1], w: BOX_W }));
}

/** The flows a map can play: those whose every step runs along a line between two of the
 *  core's drawn parts, toward one of its ends, lighting only drawn parts. */
export function playableFlows(data: SystemMapData, core: MapSystem | undefined, layout: Layout = layoutMap(data.systems)): MapFlow[] {
  if (!core) return [];
  const mine = (data.containers ?? []).filter((c) => c.system === core.id);
  const parts = new Set([...insideLayout(mine), ...outsideLayout(mine, layout)].map((b) => b.c.id));
  const lines = new Set((data.relationships ?? []).filter((l) => parts.has(l.from) && parts.has(l.to)).map((l) => `${l.from} ${l.to}`));
  return (data.flows ?? []).filter(
    (f) =>
      f.steps.length > 0 &&
      f.steps.every((st) => lines.has(`${st.from} ${st.to}`) && (st.toward === st.from || st.toward === st.to) && (st.lights ?? []).every((l) => parts.has(l))),
  );
}

function insideSvg(layout: Layout, core: MapSystem | undefined, data: SystemMapData, viewBox: string, playable: boolean): string {
  const containers = core ? (data.containers ?? []).filter((c) => c.system === core.id) : [];
  if (!core || containers.length === 0) return "";
  const boxes = [...insideLayout(containers), ...outsideLayout(containers, layout)];
  const at = new Map(boxes.map((b) => [b.c.id, b]));
  const wires = (data.relationships ?? [])
    .filter((l) => at.has(l.from) && at.has(l.to))
    .map((l) => {
      // One way for a pair, whichever direction the data names it in, so a link held both ways
      // draws one line twice, not two lines.
      const flip = l.to < l.from;
      const way = wireRoute(at.get(flip ? l.to : l.from)!, at.get(flip ? l.from : l.to)!, boxes, layout.viewBox);
      const route = (flip ? [...way].reverse() : way).map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`);
      return `<path class="cap-system-map-wire" data-from="${escapeHtml(l.from)}" data-to="${escapeHtml(l.to)}" data-route="${route.join(" ")}" d="M${route.join(" L")}"/>`;
    })
    .join("");
  const radius = 1.5 * R * Math.max(1, layout.rings) + R * 0.4;
  const rects = boxes
    .map(({ c, x, y, w }) => {
      const store = STORE_KINDS.has(c.kind);
      const flag = store ? " data-store" : c.kind === EXTERNAL ? " data-external" : "";
      return `<g class="cap-system-map-box" data-id="${escapeHtml(c.id)}" data-x="${x}" data-y="${y}"${flag}><rect x="${x - w / 2}" y="${y - BOX_H / 2}" width="${w}" height="${BOX_H}" rx="${store ? 14 : 6}"/><text class="cap-system-map-box-name" x="${x}" y="${y - 1}">${escapeHtml(c.name)}</text><text class="cap-system-map-box-kind" x="${x}" y="${y + 11}">${escapeHtml(c.technology ?? c.kind)}</text></g>`;
    })
    .join("");
  return `<svg class="cap-system-map-layer" data-layer="inside" viewBox="${viewBox}" aria-hidden="true" focusable="false"><circle class="cap-system-map-boundary" cx="0" cy="0" r="${radius.toFixed(1)}"/><text class="cap-system-map-inside-title" x="0" y="${(-radius + 22).toFixed(1)}">Inside ${escapeHtml(core.name)}</text>${wires}${rects}${playable ? `<circle class="cap-system-map-token" r="6" cx="0" cy="0"/>` : ""}</svg>`;
}

/**
 * The whole map as HTML: the head with the view switch, the stage (the core, the inner
 * rings and the rim as three layers, the lines, and the inside), the detail line, and the
 * same data as a list, grouped by ring. Every text is escaped. Delivered with no script,
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
  const innerCells = layout.cells.filter((c) => c.ring > 0 && c.ring < rim);
  const rimCells = rim > 0 ? layout.cells.filter((c) => c.ring === rim) : [];
  const onMap = new Set(at.keys());
  const edges = (data.relationships ?? [])
    .filter((l) => onMap.has(l.from) && onMap.has(l.to) && l.from !== l.to)
    .map((l) => `<path class="cap-system-map-edge" data-from="${escapeHtml(l.from)}" data-to="${escapeHtml(l.to)}" data-kind="${escapeHtml(l.kind)}"${LOOSE_KINDS.has(l.kind) ? " data-loose" : ""} d="${edgePath(layout.cells, at.get(l.from)!, at.get(l.to)!)}"/>`)
    .join("");
  const core = data.systems.find((s) => s.ring === "core");
  const placed = data.systems.filter((s) => onMap.has(s.id));
  const list = (["core", "shared", "used"] as const)
    .map((ring) => {
      const items = placed.filter((s) => s.ring === ring);
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
      return `<section class="cap-system-map-group"><${h} class="cap-system-map-group-name">${escapeHtml(names[ring])}</${h}><ul>${lis}</ul></section>`;
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
    `<div class="cap-system-map-stage" data-cap-part="stage" role="img" aria-label="${escapeHtml(label)}: ${placed.length} systems in rings. The list below holds the same.">`,
    // The lines first, so every capsomer and its label is painted over them.
    `<svg class="cap-system-map-layer" data-layer="edges" viewBox="${vb}" aria-hidden="true" focusable="false">${edges}</svg>`,
    layer("core", coreCells),
    innerCells.length ? layer("inner", innerCells) : "",
    rimCells.length ? layer("rim", rimCells) : "",
    insideSvg(layout, core, data, vb, playable.length > 0),
    `</div>`,
    `<div class="cap-system-map-detail" data-cap-part="detail" aria-live="polite" hidden></div>`,
    `<span id="${escapeHtml(id)}-keys" hidden>Arrow keys move between systems. Enter or Space chooses one and draws its connections${core ? `; on ${escapeHtml(core.name)}, Enter again goes inside` : ""}. Escape steps back out.${flows ? " Playing a flow, the left and right arrows and the number keys move between its steps." : ""}</span>`,
    `<details class="cap-system-map-list" data-cap-part="list" open><summary>The same map as a list</summary><div class="cap-system-map-groups">${list}</div></details>`,
    flows ? `<details class="cap-system-map-flows" data-cap-part="flows" open><summary>Inside ${escapeHtml(core?.name ?? "")}, step by step</summary>${flows}</details>` : "",
    `</figure>`,
  ].join("");
}

// ---------------------------------------------------------------------------------------
// Behaviour.

const READY = "data-cap-ready";

function detailHtml(s: MapSystem, links: number, enterable: boolean, openLabel: string): string {
  const bits = [`<strong class="cap-system-map-detail-name">${escapeHtml(s.name)}</strong>`];
  const facts: string[] = [];
  if (s.private) facts.push("Private: name and address only");
  if (s.description) facts.push(escapeHtml(s.description.replace(/\.$/, "")));
  if (s.domain) facts.push(escapeHtml(s.domain));
  facts.push(connectionText(links));
  bits.push(`<span class="cap-system-map-detail-text">${facts.join(" · ")}</span>`);
  const actions: string[] = [];
  if (enterable) actions.push(`<button type="button" class="cap-btn" data-cap-part="enter">Go inside</button>`);
  if (s.href) actions.push(`<a class="cap-btn" href="${escapeHtml(s.href)}">${escapeHtml(openLabel)}</a>`);
  if (actions.length) bits.push(`<span class="cap-system-map-detail-actions">${actions.join("")}</span>`);
  return bits.join("");
}

/** Reads the systems back out of the delivered list, so the script needs no second copy. */
function systemsFrom(root: HTMLElement): Map<string, MapSystem> {
  const out = new Map<string, MapSystem>();
  for (const li of root.querySelectorAll<HTMLElement>(".cap-system-map-list li[data-id]")) {
    const id = li.dataset.id!;
    const tile = root.querySelector<SVGGElement>(`.cap-system-map-tile[data-id="${CSS.escape(id)}"]`);
    out.set(id, {
      id,
      name: li.querySelector(".cap-system-map-item-name")?.textContent ?? id,
      ring: tile?.hasAttribute("data-core") ? "core" : "used",
      private: tile?.hasAttribute("data-private") ?? false,
      description: li.querySelector(".cap-system-map-item-text")?.textContent ?? undefined,
      domain: li.querySelector(".cap-system-map-item-domain")?.textContent ?? undefined,
      href: li.querySelector<HTMLAnchorElement>(".cap-system-map-item-link")?.getAttribute("href") ?? undefined,
    });
  }
  return out;
}

interface PlayFlow {
  name: string;
  steps: Array<{ from: string; to: string; toward: string; text: string; lights: string[] }>;
}

/** Reads the flows back out of the delivered step lists, as the systems are read from the list. */
function flowsFrom(root: HTMLElement): Map<string, PlayFlow> {
  const out = new Map<string, PlayFlow>();
  for (const sec of root.querySelectorAll<HTMLElement>(".cap-system-map-flow[data-flow]")) {
    out.set(sec.dataset.flow!, {
      name: sec.querySelector(".cap-system-map-flow-name")?.textContent ?? sec.dataset.flow!,
      steps: [...sec.querySelectorAll<HTMLElement>("ol > li")].map((li) => ({
        from: li.dataset.from!,
        to: li.dataset.to!,
        toward: li.dataset.toward!,
        text: li.textContent ?? "",
        lights: (li.dataset.lights ?? "").split(" ").filter(Boolean),
      })),
    });
  }
  return out;
}

/** Where the line from a box's centre toward a point leaves the box, `gap` beyond its edge. */
export function boxEdge([x, y]: [number, number], [hw, hh]: [number, number], [tx, ty]: [number, number], gap = 0): [number, number] {
  const dx = tx - x;
  const dy = ty - y;
  if (dx === 0 && dy === 0) return [x, y];
  const t = Math.min(dx ? (hw + gap) / Math.abs(dx) : Number.POSITIVE_INFINITY, dy ? (hh + gap) / Math.abs(dy) : Number.POSITIVE_INFINITY);
  return [Math.round((x + dx * t) * 10) / 10, Math.round((y + dy * t) * 10) / 10];
}

/** The token's way along a drawn line: its corners from `start` toward `end`, the first and
 *  last points moved from the box centres to `gap` beyond the box edges. `forward` says the
 *  line was drawn from start to end. */
export function tokenRoute(route: string, forward: boolean, a: [number, number], ha: [number, number], b: [number, number], hb: [number, number], gap = 4): Array<[number, number]> {
  const pts = route
    .split(" ")
    .filter(Boolean)
    .map((p) => p.split(",").map(Number) as [number, number]);
  const way = pts.length >= 2 ? (forward ? pts : pts.reverse()) : [a, b];
  way[0] = boxEdge(a, ha, way[1]!, gap);
  way[way.length - 1] = boxEdge(b, hb, way[way.length - 2]!, gap);
  return way;
}

/** Keyframes that move at one speed along a route. */
export function routeFrames(route: ReadonlyArray<[number, number]>): Array<{ transform: string; offset: number }> {
  const lengths = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i]![0], p[1] - route[i]![1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let run = 0;
  return route.map((p, i) => {
    if (i > 0) run += lengths[i - 1]!;
    return { transform: `translate(${p[0]}px, ${p[1]}px)`, offset: Math.round((run / total) * 1000) / 1000 };
  });
}

/** The words a flow's step shows: where it is in the flow, then what happens. */
export function stepText(n: number, total: number, text: string): string {
  return `Step ${n} of ${total}. ${text}`;
}

export interface SystemMapController {
  select(id: string | null): void;
  enter(): void;
  leave(): void;
  setView(view: "shell" | "plain"): void;
  // Inside the core: play a flow from a step (1 by default), move to a step, stop.
  playFlow(id: string, step?: number): void;
  step(n: number): void;
  stopFlow(): void;
  destroy(): void;
}

export function controller(root: HTMLElement, openLabel = "Open"): SystemMapController {
  const stage = root.querySelector<HTMLElement>("[data-cap-part='stage']")!;
  const detail = root.querySelector<HTMLElement>("[data-cap-part='detail']")!;
  const list = root.querySelector<HTMLDetailsElement>("[data-cap-part='list']")!;
  const views = root.querySelector<HTMLElement>("[data-cap-part='views']");
  const keys = root.querySelector<HTMLElement>(`#${CSS.escape(root.id)}-keys`);
  const inside = root.querySelector<SVGSVGElement>("[data-layer='inside']");
  const tiles = [...root.querySelectorAll<SVGGElement>(".cap-system-map-tile[data-id]")];
  const systems = systemsFrom(root);
  const points = tiles.map((t) => ({ id: t.dataset.id!, x: Number(t.dataset.x), y: Number(t.dataset.y) }));
  const coreTile = tiles.find((t) => t.hasAttribute("data-core"));
  const tileOf = (id: string) => tiles.find((t) => t.dataset.id === id);
  const flows = flowsFrom(root);
  const flowList = root.querySelector<HTMLDetailsElement>("[data-cap-part='flows']");
  const token = inside?.querySelector<SVGCircleElement>(".cap-system-map-token") ?? null;
  const boxOf = (id: string) => inside?.querySelector<SVGGElement>(`.cap-system-map-box[data-id="${CSS.escape(id)}"]`) ?? null;
  const xy = (id: string): [number, number] => {
    const b = boxOf(id);
    return [Number(b?.dataset.x ?? 0), Number(b?.dataset.y ?? 0)];
  };
  const halfOf = (id: string): [number, number] => {
    const r = boxOf(id)?.querySelector("rect");
    return [(r?.width.baseVal.value ?? 0) / 2, (r?.height.baseVal.value ?? 0) / 2];
  };
  let selected: string | null = null;
  let playing: { id: string; n: number } | null = null;

  // The drawing becomes the control: the stage is a group of buttons, one tab stop.
  stage.setAttribute("role", "group");
  stage.removeAttribute("aria-label");
  stage.setAttribute("aria-labelledby", `${root.id}-title`);
  if (keys) stage.setAttribute("aria-describedby", keys.id);
  for (const svg of stage.querySelectorAll<SVGSVGElement>("[data-layer='core'], [data-layer='inner'], [data-layer='rim']")) svg.removeAttribute("aria-hidden");
  for (const t of tiles) {
    const s = systems.get(t.dataset.id!);
    const tag = t.querySelector(".cap-system-map-tag")?.textContent;
    t.setAttribute("role", "button");
    t.setAttribute("tabindex", "-1");
    t.setAttribute("aria-pressed", "false");
    t.setAttribute("aria-label", [s?.name ?? t.dataset.id, tag].filter(Boolean).join(", "));
  }
  const first = coreTile ?? tiles[0];
  first?.setAttribute("tabindex", "0");
  if (views) views.hidden = false;
  list.open = false;
  if (flowList) flowList.open = false;
  detail.hidden = false;
  detail.innerHTML = `<span class="cap-system-map-detail-text">Choose a system to see what it connects to.</span>`;

  const focusTile = (id: string) => {
    for (const t of tiles) t.setAttribute("tabindex", t.dataset.id === id ? "0" : "-1");
    tileOf(id)?.focus();
  };

  const enterable = (id: string) => !!inside && tileOf(id)?.hasAttribute("data-core") === true;

  const select = (id: string | null) => {
    stopFlow(true);
    selected = id;
    root.toggleAttribute("data-selected", id !== null);
    for (const t of tiles) t.setAttribute("aria-pressed", String(t.dataset.id === id));
    let n = 0;
    const linked = new Set<string>();
    for (const p of root.querySelectorAll<SVGPathElement>(".cap-system-map-edge")) {
      const on = id !== null && (p.dataset.from === id || p.dataset.to === id);
      p.toggleAttribute("data-on", on);
      if (on) {
        n++;
        linked.add(p.dataset.from === id ? p.dataset.to! : p.dataset.from!);
      }
    }
    // A seam touches three capsomers at every corner, so the far ends are marked too.
    for (const t of tiles) t.toggleAttribute("data-linked", linked.has(t.dataset.id!));
    const s = id ? systems.get(id) : undefined;
    detail.innerHTML = s ? detailHtml(s, n, enterable(s.id), openLabel) : `<span class="cap-system-map-detail-text">Choose a system to see what it connects to.</span>`;
    if (id) root.dispatchEvent(new CustomEvent("cap:system-map-select", { bubbles: true, detail: { id } }));
  };

  const insideDetail = () => {
    if (!inside || !coreTile) return;
    const name = systems.get(coreTile.dataset.id!)?.name ?? "the core";
    const own = inside.querySelectorAll(".cap-system-map-box:not([data-external])").length;
    const outside = inside.querySelectorAll(".cap-system-map-box[data-external]").length;
    const plays = [...flows].map(([id, f]) => `<button type="button" class="cap-btn" data-cap-part="play" data-flow="${escapeHtml(id)}">Play: ${escapeHtml(f.name)}</button>`).join("");
    detail.innerHTML = `<strong class="cap-system-map-detail-name">Inside ${escapeHtml(name)}</strong><span class="cap-system-map-detail-text">${own} parts${outside ? `, ${outside} outside it` : ""}, with the systems around it at the rim.</span><span class="cap-system-map-detail-actions">${plays}<button type="button" class="cap-btn" data-cap-part="leave">Step out</button></span>`;
  };

  // `focus` is for a reader's own press; a host's call (playFlow, step) leaves focus alone.
  const showStep = (n: number, focus = true) => {
    const f = playing ? flows.get(playing.id) : undefined;
    if (!f || !inside) return;
    const k = Math.min(Math.max(1, Math.round(n)), f.steps.length);
    const st = f.steps[k - 1]!;
    playing = { id: playing!.id, n: k };
    root.dataset.step = String(k);
    for (const w of inside.querySelectorAll<SVGPathElement>(".cap-system-map-wire")) {
      w.toggleAttribute("data-on", (w.dataset.from === st.from && w.dataset.to === st.to) || (w.dataset.from === st.to && w.dataset.to === st.from));
    }
    for (const b of inside.querySelectorAll<SVGGElement>(".cap-system-map-box")) {
      const id = b.dataset.id!;
      b.toggleAttribute("data-lit", st.lights.includes(id));
      b.toggleAttribute("data-at", id === st.toward);
    }
    if (token) {
      // The token follows the step's line as drawn, bends and all, from the edge of one box to
      // the edge of the other, so it never sits on a part's name.
      const start = st.toward === st.to ? st.from : st.to;
      const wire = [...inside.querySelectorAll<SVGPathElement>(".cap-system-map-wire")].find((w) => (w.dataset.from === start && w.dataset.to === st.toward) || (w.dataset.from === st.toward && w.dataset.to === start));
      const route = tokenRoute(wire?.dataset.route ?? "", wire?.dataset.from === start, xy(start), halfOf(start), xy(st.toward), halfOf(st.toward));
      const frames = routeFrames(route);
      for (const a of token.getAnimations()) a.cancel();
      token.style.transform = frames.at(-1)!.transform;
      if (frames.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        token.animate(frames, { duration: 700, easing: "ease-in-out" });
      }
    }
    const was = (document.activeElement as HTMLElement | null)?.dataset?.capPart;
    detail.innerHTML = `<strong class="cap-system-map-detail-name">${escapeHtml(f.name)}</strong><span class="cap-system-map-detail-text">${escapeHtml(stepText(k, f.steps.length, st.text))}</span><span class="cap-system-map-detail-actions"><button type="button" class="cap-btn" data-cap-part="back"${k === 1 ? " disabled" : ""}>Back</button><button type="button" class="cap-btn" data-cap-part="next"${k === f.steps.length ? " disabled" : ""}>Next</button><button type="button" class="cap-btn" data-cap-part="stop">Stop</button></span>`;
    // Focus stays on the control that was pressed, unless it is now disabled.
    const again = was && detail.querySelector<HTMLButtonElement>(`[data-cap-part="${was}"]:not([disabled])`);
    if (focus) (again || detail.querySelector<HTMLButtonElement>("[data-cap-part='next']:not([disabled])") || detail.querySelector<HTMLButtonElement>("[data-cap-part='back']"))?.focus();
    root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id: playing!.id, step: k } }));
  };

  const playFlow = (id: string, n = 1, focus = true) => {
    if (!flows.has(id)) return;
    if (!root.hasAttribute("data-entered")) enter(focus);
    playing = { id, n };
    root.dataset.flow = id;
    showStep(n, focus);
  };

  const stopFlow = (quiet = false) => {
    if (!playing) return;
    const id = playing.id;
    playing = null;
    delete root.dataset.flow;
    delete root.dataset.step;
    for (const el of inside?.querySelectorAll("[data-on], [data-lit], [data-at]") ?? []) {
      el.removeAttribute("data-on");
      el.removeAttribute("data-lit");
      el.removeAttribute("data-at");
    }
    if (token) for (const a of token.getAnimations()) a.cancel();
    root.dispatchEvent(new CustomEvent("cap:system-map-flow", { bubbles: true, detail: { id: null, step: 0 } }));
    // Quiet when something else is taking over the detail line: leaving, choosing, tearing down.
    if (quiet) return;
    insideDetail();
    detail.querySelector<HTMLButtonElement>(`[data-cap-part="play"][data-flow="${CSS.escape(id)}"]`)?.focus();
  };

  const enter = (focus = true) => {
    if (!inside || !coreTile) return;
    root.setAttribute("data-entered", "");
    inside.removeAttribute("aria-hidden");
    inside.setAttribute("role", "img");
    const named = (sel: string) => [...inside.querySelectorAll(sel)].map((b) => b.querySelector(".cap-system-map-box-name")?.textContent).filter(Boolean).join(", ");
    const name = systems.get(coreTile.dataset.id!)?.name ?? "the core";
    const outside = named(".cap-system-map-box[data-external]");
    inside.setAttribute("aria-label", `Inside ${name}: ${named(".cap-system-map-box:not([data-external])")}.${outside ? ` Outside it: ${outside}.` : ""}`);
    insideDetail();
    if (focus) detail.querySelector<HTMLButtonElement>("[data-cap-part='leave']")?.focus();
    root.dispatchEvent(new CustomEvent("cap:system-map-enter", { bubbles: true, detail: { id: coreTile.dataset.id } }));
  };

  const leave = () => {
    if (!root.hasAttribute("data-entered")) return;
    stopFlow(true);
    root.removeAttribute("data-entered");
    inside?.setAttribute("aria-hidden", "true");
    inside?.removeAttribute("role");
    if (coreTile) {
      select(coreTile.dataset.id!);
      focusTile(coreTile.dataset.id!);
    }
  };

  const setView = (view: "shell" | "plain") => {
    if (view === "plain") leave();
    root.dataset.view = view;
    list.open = view === "plain";
    if (flowList) flowList.open = view === "plain";
    for (const b of views?.querySelectorAll<HTMLButtonElement>("button[data-view]") ?? []) b.setAttribute("aria-pressed", String(b.dataset.view === view));
  };

  const activate = (id: string) => {
    if (root.hasAttribute("data-entered")) leave();
    if (selected === id && enterable(id)) enter();
    else select(id);
  };

  const onClick = (e: Event) => {
    const target = e.target as Element;
    const tile = target.closest<SVGGElement>(".cap-system-map-tile[data-id]");
    if (tile && stage.contains(tile)) {
      focusTile(tile.dataset.id!);
      activate(tile.dataset.id!);
      return;
    }
    const part = target.closest<HTMLElement>("[data-cap-part]")?.dataset.capPart;
    if (part === "enter") enter();
    else if (part === "leave") leave();
    else if (part === "play") playFlow(target.closest<HTMLElement>("[data-flow]")?.dataset.flow ?? "");
    else if (part === "next" && playing) showStep(playing.n + 1);
    else if (part === "back" && playing) showStep(playing.n - 1);
    else if (part === "stop") stopFlow();
    const view = target.closest<HTMLButtonElement>(".cap-system-map-views button[data-view]")?.dataset.view;
    if (view === "shell" || view === "plain") setView(view);
  };

  const ARROWS: Record<string, Direction> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  const onKey = (e: KeyboardEvent) => {
    if (playing && !(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
      const steps = flows.get(playing.id)!.steps.length;
      const digit = /^[1-9]$/.test(e.key) ? Number(e.key) : 0;
      const to = e.key === "ArrowRight" ? playing.n + 1 : e.key === "ArrowLeft" ? playing.n - 1 : digit && digit <= steps ? digit : 0;
      if (to >= 1 && to <= steps) {
        e.preventDefault();
        showStep(to);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopFlow();
        return;
      }
    }
    if (e.key === "Escape" && root.hasAttribute("data-entered")) {
      e.preventDefault();
      leave();
      return;
    }
    const tile = (e.target as Element).closest?.<SVGGElement>(".cap-system-map-tile[data-id]");
    if (!tile) return;
    const id = tile.dataset.id!;
    const dir = ARROWS[e.key];
    let next: string | null = null;
    if (dir) next = spatialNext(points, id, dir);
    else if (e.key === "Home") next = points[0]?.id ?? null;
    else if (e.key === "End") next = points.at(-1)?.id ?? null;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(id);
      return;
    } else if (e.key === "Escape" && selected) {
      e.preventDefault();
      select(null);
      return;
    } else return;
    e.preventDefault();
    if (next) focusTile(next);
  };

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  return {
    select,
    enter,
    leave,
    setView,
    playFlow: (id: string, n = 1) => playFlow(id, n, false),
    step: (n: number) => showStep(n, false),
    stopFlow: () => stopFlow(),
    destroy() {
      stopFlow(true);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    },
  };
}

export function enhance(root: ParentNode = document): () => void {
  const made: SystemMapController[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='system-map']")) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    made.push(controller(el, el.dataset.openLabel ?? "Open"));
  }
  return () => {
    for (const c of made) c.destroy();
  };
}
