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

// ---------------------------------------------------------------------------------------
// Inside the core. The core's parts sit inside a dashed boundary, C4's system boundary drawn
// literally as a rounded rectangle that fills the stage, its name in its bottom-left corner
// as C4 names a boundary; what the core works with outside it (`external` parts: the agents
// that call it, the host its code lives on) sits above it, and below it when there are more
// than two. The seat's rulings on capsomer#64 decide how lines run between them:
//
//   - no line runs under a box it does not end at, or under the boundary's name: a line under
//     a box reads as a connection to it (an edge tunnel; Dunne and Shneiderman 2009);
//   - every line keeps ROUTE_CLEAR from every box but its two ends;
//   - lines that share a box leave it at their own points along its edge (ports), and two
//     lines running nearly parallel keep LINE_SEP apart, so neither reads as one doubled line;
//   - a line never crosses another near that line's ends, nor anywhere along a short one,
//     where a crossing reads as a three-way junction;
//   - no bend sits near another line, where it would read as a connection.
//
// Lines are routed one at a time, shortest first, each the shortest way from port to port
// through the corners of what is in its way (boxes, the name, the junctions of the lines
// already drawn) that keeps every rule. A core has a dozen parts and a dozen lines, so a
// plain search does it: no layout engine.

const BOX_H = 32;
export const ROUTE_CLEAR = 8;
// In drawing units; a 320 px phone draws a unit at about three quarters of a pixel, so each
// is chosen to stay clear there: ROUTE_CLEAR over 5 px, the rest 8 to 10 px or more.
export const LINE_SEP = 11;
export const JUNCTION_END = 14;
export const SHORT_LINK = 90;
export const BEND_CLEAR = 14;
const LABEL_PAD = 4;
// The stage is the shell's drawing; inside, the drawing is at least this wide, so a small
// family's map is scaled down rather than crowded.
const MIN_INSIDE_W = 380;
const MARGIN = 8;
const OUT_GAP = 30;
const PAD = 16;
const LABEL_H = 18;
const MIN_PITCH = BOX_H + 2 * ROUTE_CLEAR + 12;
const MAX_PITCH = 104;
const COL_GAP = 2 * ROUTE_CLEAR + 12;

type Pt = [number, number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InsideWire {
  from: string;
  to: string;
  route: Pt[];
}

export interface InsideScene {
  viewBox: [number, number, number, number];
  boundary: Rect;
  // The boundary's name: its text starts at (textX, textY), and `box` is what lines avoid.
  label: { text: string; textX: number; textY: number; box: Rect; squeeze: number | null };
  boxes: Box[];
  wires: InsideWire[];
}

const rectOf = (b: Box): Rect => ({ x: b.x - b.w / 2, y: b.y - BOX_H / 2, w: b.w, h: BOX_H });
const grow = (r: Rect, g: number): Rect => ({ x: r.x - g, y: r.y - g, w: r.w + 2 * g, h: r.h + 2 * g });

/** Whether the segment p-q passes through the rectangle's inside (a touch is not a hit). */
export function segmentHitsRect(p: Pt, q: Pt, r: Rect): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  for (const [pk, qk] of [[-dx, p[0] - r.x], [dx, r.x + r.w - p[0]], [-dy, p[1] - r.y], [dy, r.y + r.h - p[1]]] as const) {
    if (pk === 0) {
      if (qk <= 0) return false;
      continue;
    }
    const t = qk / pk;
    if (pk < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return false;
  }
  return t1 - t0 > 1e-9;
}

/** Whether the segment p-q passes through the box's inside, grown by `g`. */
export function segmentHitsBox(p: Pt, q: Pt, b: { x: number; y: number; w: number }, g = 0): boolean {
  return segmentHitsRect(p, q, { x: b.x - b.w / 2 - g, y: b.y - BOX_H / 2 - g, w: b.w + 2 * g, h: BOX_H + 2 * g });
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (v: Pt) => Math.hypot(v[0], v[1]);

/** The distance from point p to segment a-b. */
export function pointSegDist(p: Pt, a: Pt, b: Pt): number {
  const ab = sub(b, a);
  const l2 = ab[0] ** 2 + ab[1] ** 2;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0;
  return len(sub(p, [a[0] + t * ab[0], a[1] + t * ab[1]]));
}

/** Where segments a-b and c-d cross, or null. */
export function segmentCross(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t > 0 && t < 1 && u > 0 && u < 1 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
}

/** The distance between two segments: 0 where they cross. */
export function segDist(a: Pt, b: Pt, c: Pt, d: Pt): number {
  if (segmentCross(a, b, c, d)) return 0;
  return Math.min(pointSegDist(a, c, d), pointSegDist(b, c, d), pointSegDist(c, a, b), pointSegDist(d, a, b));
}

/** The angle between two segments' directions, 0 to 90 degrees. */
export function segAngle(a: Pt, b: Pt, c: Pt, d: Pt): number {
  const u = sub(b, a);
  const v = sub(d, c);
  const cos = Math.abs(u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v) || 1);
  return (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
}

/** Whether two segments run side by side: nearly parallel, and one's span overlaps the other's. */
export function sideBySide(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  if (segAngle(a, b, c, d) >= 20) return false;
  const u = sub(b, a);
  const l = len(u) || 1;
  const along = (p: Pt) => ((p[0] - a[0]) * u[0] + (p[1] - a[1]) * u[1]) / l;
  const [lo, hi] = [Math.min(along(c), along(d)), Math.max(along(c), along(d))];
  return hi > 0 && lo < l;
}

const segmentsOf = (route: readonly Pt[]): Array<[Pt, Pt]> => route.slice(1).map((q, i) => [route[i]!, q]);

/** What a route must keep, against the lines drawn before it. */
interface Drawn {
  segments: Array<[Pt, Pt]>;
  ends: [Pt, Pt];
  short: boolean;
  bends: Pt[];
}

function routeLength(route: readonly Pt[]): number {
  return segmentsOf(route).reduce((n, [p, q]) => n + len(sub(q, p)), 0);
}

function drawnOf(route: Pt[]): Drawn {
  return { segments: segmentsOf(route), ends: [route[0]!, route.at(-1)!], short: routeLength(route) < SHORT_LINK, bends: route.slice(1, -1) };
}

/** Which rules a segment breaks: a box or the boundary's name, which no line may cross, and the
 *  softer rules a crowded core may leave no way to keep. `own` is the new line's two ports. */
export function segmentFaults(p: Pt, q: Pt, ends: readonly Box[], boxes: readonly Box[], label: Rect | null, drawn: readonly Drawn[], own: readonly Pt[] = []): string[] {
  const out: string[] = [];
  for (const o of boxes) {
    if (ends.includes(o) ? segmentHitsBox(p, q, o, 0) : segmentHitsBox(p, q, o, ROUTE_CLEAR)) out.push(`box ${o.c.id}`);
  }
  if (label && segmentHitsRect(p, q, grow(label, LABEL_PAD))) out.push("label");
  for (const d of drawn) {
    for (const [c, e] of d.segments) {
      const x = segmentCross(p, q, c, e);
      if (x && (d.short || [...d.ends, ...own].some((end) => len(sub(x, end)) < JUNCTION_END))) out.push("junction");
      if (!x && (sideBySide(p, q, c, e) || sideBySide(c, e, p, q)) && segDist(p, q, c, e) < LINE_SEP) out.push("side by side");
    }
    if (d.bends.some((b) => pointSegDist(b, p, q) < BEND_CLEAR)) out.push("near a bend");
  }
  return out;
}

const HARD = /^(box|label)/;
// What a broken soft rule costs a route, in drawing units: far more than any detour, so a
// route breaks one only when every way around breaks one too, and then as few as it can.
const SOFT_COST = 2000;

/** The shortest way from port to port that crosses no box and no name, breaking the fewest
 *  softer rules, or null when every way crosses a box. */
function searchRoute(start: Pt, end: Pt, ends: readonly Box[], boxes: readonly Box[], label: Rect | null, drawn: readonly Drawn[], bounds: Rect): Pt[] | null {
  const own = [start, end];
  const cost = (p: Pt, q: Pt) => {
    const f = segmentFaults(p, q, ends, boxes, label, drawn, own);
    return f.some((x) => HARD.test(x)) ? Number.POSITIVE_INFINITY : len(sub(q, p)) + SOFT_COST * f.length;
  };
  const direct = cost(start, end);
  if (direct < SOFT_COST) return [start, end];
  // Corners just outside what is in the way, and a second ring further out, so a bend can
  // stand clear of the lines that pass the same corner.
  const solid: Rect[] = [...boxes.map((o) => rectOf(o)), ...(label ? [grow(label, LABEL_PAD - ROUTE_CLEAR)] : [])];
  const junctions: Rect[] = drawn.flatMap((d) =>
    d.ends.map(([x, y]) => ({ x: x - JUNCTION_END, y: y - JUNCTION_END, w: 2 * JUNCTION_END, h: 2 * JUNCTION_END })),
  );
  const corners: Pt[] = [
    ...[ROUTE_CLEAR + 2, ROUTE_CLEAR + 2 + BEND_CLEAR].flatMap((g) => solid.map((r) => grow(r, g))),
    ...junctions.map((r) => grow(r, 2)),
  ]
    .flatMap((r): Pt[] => [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]])
    .filter(
      ([x, y]) =>
        x >= bounds.x &&
        x <= bounds.x + bounds.w &&
        y >= bounds.y &&
        y <= bounds.y + bounds.h &&
        boxes.every((o) => !(Math.abs(x - o.x) < o.w / 2 + ROUTE_CLEAR && Math.abs(y - o.y) < BOX_H / 2 + ROUTE_CLEAR)),
    );
  const nodes: Pt[] = [start, end, ...corners];
  // A bend near a line already drawn reads as a connection to it.
  const nodeCost = nodes.map((pt, k) => (k > 1 && drawn.some((d) => d.segments.some(([c, e]) => pointSegDist(pt, c, e) < BEND_CLEAR)) ? SOFT_COST : 0));
  const dist = nodes.map(() => Number.POSITIVE_INFINITY);
  const prev = nodes.map(() => -1);
  const done = nodes.map(() => false);
  dist[0] = 0;
  // A*: the straight distance to the end never overstates what is left.
  const toEnd = nodes.map((pt) => len(sub(end, pt)));
  for (;;) {
    let i = -1;
    for (let k = 0; k < nodes.length; k++) if (!done[k] && (i < 0 || dist[k]! + toEnd[k]! < dist[i]! + toEnd[i]!)) i = k;
    if (i < 0 || dist[i] === Number.POSITIVE_INFINITY || i === 1) break;
    done[i] = true;
    for (let k = 1; k < nodes.length; k++) {
      if (done[k]) continue;
      // Each bend costs a little, so of two near-equal ways the plainer wins.
      const lower = dist[i]! + len(sub(nodes[k]!, nodes[i]!)) + 10 + nodeCost[k]!;
      if (lower >= dist[k]!) continue;
      const dd = dist[i]! + cost(nodes[i]!, nodes[k]!) + 10 + nodeCost[k]!;
      if (dd < dist[k]!) {
        dist[k] = dd;
        prev[k] = i;
      }
    }
  }
  if (prev[1] === -1) return direct < Number.POSITIVE_INFINITY ? [start, end] : null;
  const path: Pt[] = [];
  for (let k = 1; k !== -1; k = prev[k]!) path.unshift(nodes[k]!);
  return path;
}

/** Each line's two ports: where it leaves each of its boxes, on the side facing the other end,
 *  the lines sharing a side spread evenly along it in the order of where each heads (its far
 *  end, or `toward`, the first point it was routed to), so lines leaving a side do not cross. */
export function portsOf(boxes: readonly Box[], pairs: ReadonlyArray<readonly [string, string]>, toward?: ReadonlyMap<string, Pt>): Map<string, Pt> {
  const at = new Map(boxes.map((b) => [b.c.id, b]));
  type Use = { key: string; side: "top" | "bottom" | "left" | "right"; along: number };
  const uses = new Map<string, Use[]>();
  for (const [a, b] of pairs) {
    for (const [me, other] of [[a, b], [b, a]] as const) {
      const m = at.get(me)!;
      const o = at.get(other)!;
      const dx = o.x - m.x;
      const dy = o.y - m.y;
      const vertical = Math.abs(dy) / (BOX_H / 2) >= Math.abs(dx) / (m.w / 2);
      const side = vertical ? (dy < 0 ? "top" : "bottom") : dx < 0 ? "left" : "right";
      const list = uses.get(`${me} ${side}`) ?? [];
      const [hx, hy] = toward?.get(`${me}>${other}`) ?? [o.x, o.y];
      list.push({ key: `${me}>${other}`, side, along: vertical ? hx : hy });
      uses.set(`${me} ${side}`, list);
    }
  }
  const out = new Map<string, Pt>();
  for (const [k, list] of uses) {
    const m = at.get(k.split(" ")[0]!)!;
    list.sort((u, v) => u.along - v.along);
    list.forEach((u, i) => {
      const f = (i + 1) / (list.length + 1);
      const p: Pt =
        u.side === "top" || u.side === "bottom"
          ? [m.x - m.w / 2 + m.w * f, m.y + (u.side === "top" ? -BOX_H / 2 : BOX_H / 2)]
          : [m.x + (u.side === "left" ? -m.w / 2 : m.w / 2), m.y - BOX_H / 2 + BOX_H * f];
      out.set(u.key, p);
    });
  }
  return out;
}

/** The inside drawing's own size: the shell's, at least MIN_INSIDE_W wide and tall enough
 *  for every row of parts, with the shell's proportions so it fills the same stage. */
function insideViewBox(layout: Layout, containers: readonly MapContainer[]): [number, number, number, number] {
  const [, , vw, vh] = layout.viewBox;
  const ext = containers.filter((c) => c.kind === EXTERNAL).length;
  const bands = (ext > 0 ? 1 : 0) + (ext > 2 ? 1 : 0);
  const rowsFor = (w: number) => {
    const innerW = w - 2 * MARGIN - 2 * PAD;
    const perRow = (bw: number, max: number) => Math.max(1, Math.min(max, Math.floor((innerW + COL_GAP) / (bw + COL_GAP))));
    const tops = containers.filter((c) => c.kind !== EXTERNAL && !STORE_KINDS.has(c.kind)).length;
    const stores = containers.filter((c) => STORE_KINDS.has(c.kind)).length;
    return Math.ceil(tops / perRow(BOX_W, 2)) + Math.ceil(stores / perRow(88, 3));
  };
  let scale = Math.max(1, MIN_INSIDE_W / vw);
  for (let k = 0; k < 20; k++) {
    const h = vh * scale;
    const rows = rowsFor(vw * scale);
    const need = 2 * MARGIN + bands * (BOX_H + OUT_GAP) + 2 * PAD + LABEL_H + Math.max(0, rows - 1) * MIN_PITCH + BOX_H;
    if (need <= h) break;
    scale *= need / h;
  }
  const w = Math.round(vw * scale * 10) / 10;
  const h = Math.round(vh * scale * 10) / 10;
  return [-w / 2, -h / 2, w, h];
}

/** Everything drawn inside the core: the boundary and its name, the parts in and out of it,
 *  and every line between them, routed by the rules above. */
export function insideScene(containers: readonly MapContainer[], links: readonly MapLink[], layout: Layout, name = "Inside"): InsideScene {
  const viewBox = insideViewBox(layout, containers);
  const [vx, vy, vw, vh] = viewBox;
  const externals = containers.filter((c) => c.kind === EXTERNAL).slice(0, 4);
  const xl = vx + MARGIN + BOX_W / 2;
  const xr = vx + vw - MARGIN - BOX_W / 2;
  const outside: Box[] = externals.map((c, i) => ({ c, x: i % 2 === 0 ? xl : xr, y: i < 2 ? vy + MARGIN + BOX_H / 2 : vy + vh - MARGIN - BOX_H / 2, w: BOX_W }));
  const top = externals.length ? vy + MARGIN + BOX_H + OUT_GAP : vy + MARGIN;
  const bottom = externals.length > 2 ? vy + vh - MARGIN - BOX_H - OUT_GAP : vy + vh - MARGIN;
  const boundary: Rect = { x: vx + MARGIN, y: top, w: vw - 2 * MARGIN, h: bottom - top };
  // The name is 9-unit capitals in a monospace face, a little under 7 units a letter; a name
  // too long for the boundary is squeezed to fit (textLength), so lines avoid all of it.
  const maxLabel = boundary.w - 24;
  const labelW = Math.min(Math.round(name.length * 7 + 6), maxLabel);
  const label = {
    text: name,
    textX: boundary.x + 12,
    textY: boundary.y + boundary.h - 9,
    box: { x: boundary.x + 9, y: boundary.y + boundary.h - 9 - 11, w: labelW, h: 14 },
    squeeze: labelW === maxLabel ? labelW - 6 : null,
  };
  // The parts: rows of two (workers, sites, crons) above rows of three (stores), spread across
  // the boundary and down it, centred, at most MAX_PITCH apart.
  const x0 = boundary.x + PAD;
  const innerW = boundary.w - 2 * PAD;
  const y0 = boundary.y + PAD;
  const innerH = boundary.h - 2 * PAD - LABEL_H;
  const perRow = (bw: number, max: number) => Math.max(1, Math.min(max, Math.floor((innerW + COL_GAP) / (bw + COL_GAP))));
  const tops = containers.filter((c) => c.kind !== EXTERNAL && !STORE_KINDS.has(c.kind));
  const stores = containers.filter((c) => STORE_KINDS.has(c.kind));
  const rows: Array<{ items: MapContainer[]; w: number }> = [];
  for (const [list, bw, max] of [[tops, BOX_W, 2], [stores, 88, 3]] as const) {
    const n = perRow(bw, max);
    for (let i = 0; i < list.length; i += n) rows.push({ items: list.slice(i, i + n), w: bw });
  }
  const pitch = rows.length > 1 ? Math.min(MAX_PITCH, (innerH - BOX_H) / (rows.length - 1)) : 0;
  const firstY = y0 + (innerH - pitch * (rows.length - 1)) / 2;
  const inside: Box[] = rows.flatMap((row, r) =>
    row.items.map((c, i) => ({ c, x: Math.round((x0 + (innerW * (i + 0.5)) / row.items.length) * 10) / 10, y: Math.round((firstY + r * pitch) * 10) / 10, w: row.w })),
  );
  const boxes = [...inside, ...outside];
  const at = new Map(boxes.map((b) => [b.c.id, b]));
  // One line for a pair, drawn the way the data first names it.
  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const l of links) {
    if (!at.has(l.from) || !at.has(l.to) || l.from === l.to) continue;
    const key = [l.from, l.to].sort().join(" ");
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([l.from, l.to]);
  }
  const bounds: Rect = { x: vx, y: vy, w: vw, h: vh };
  // Every line, shortest first, each against the lines before it; with how many soft rules
  // the drawing breaks in all.
  const routeAll = (ports: Map<string, Pt>) => {
    const portOf = (p: readonly [string, string]) => len(sub(ports.get(`${p[0]}>${p[1]}`)!, ports.get(`${p[1]}>${p[0]}`)!));
    const order = [...pairs].sort((p, q) => portOf(p) - portOf(q));
    const drawn: Drawn[] = [];
    const routes = new Map<string, Pt[]>();
    let broken = 0;
    for (const [a, b] of order) {
      const start = ports.get(`${a}>${b}`)!;
      const end = ports.get(`${b}>${a}`)!;
      const ends = [at.get(a)!, at.get(b)!];
      // A line between two parts inside stays inside the boundary; one to a part outside may
      // use the whole drawing. A box or the name is never given up; if every way crosses one
      // (a core too crowded to draw), the line goes straight and the tests say so.
      const within = ends.every((e) => e.c.kind !== EXTERNAL) ? grow(boundary, -4) : bounds;
      const route = searchRoute(start, end, ends, boxes, label.box, drawn, within) ?? [start, end];
      broken += segmentsOf(route).reduce((n, [p, q]) => n + segmentFaults(p, q, ends, boxes, label.box, drawn, [start, end]).length, 0);
      drawn.push(drawnOf(route));
      routes.set(`${a} ${b}`, route);
    }
    return { routes, broken };
  };
  // Twice: the second time each box's ports are ordered by where its lines were first routed
  // to, which undoes most crossings at the ports; the drawing breaking fewer rules is kept.
  const first = routeAll(portsOf(boxes, pairs));
  let best = first;
  if (first.broken > 0) {
    const toward = new Map<string, Pt>();
    for (const [a, b] of pairs) {
      const r = first.routes.get(`${a} ${b}`)!;
      toward.set(`${a}>${b}`, r[1]!);
      toward.set(`${b}>${a}`, r.at(-2)!);
    }
    const second = routeAll(portsOf(boxes, pairs, toward));
    if (second.broken < first.broken) best = second;
  }
  const routes = best.routes;
  return { viewBox, boundary, label, boxes, wires: pairs.map(([a, b]) => ({ from: a, to: b, route: routes.get(`${a} ${b}`)! })) };
}

/** The flows a map can play: those whose every step runs along a line between two of the
 *  core's drawn parts, toward one of its ends, lighting only drawn parts. */
export function playableFlows(data: SystemMapData, core: MapSystem | undefined, layout: Layout = layoutMap(data.systems)): MapFlow[] {
  if (!core) return [];
  const mine = (data.containers ?? []).filter((c) => c.system === core.id);
  // What insideScene draws: every part inside, and the first four outside.
  const parts = new Set([...mine.filter((c) => c.kind !== EXTERNAL), ...mine.filter((c) => c.kind === EXTERNAL).slice(0, 4)].map((c) => c.id));
  const lines = new Set((data.relationships ?? []).filter((l) => parts.has(l.from) && parts.has(l.to)).map((l) => `${l.from} ${l.to}`));
  return (data.flows ?? []).filter(
    (f) =>
      f.steps.length > 0 &&
      f.steps.every((st) => st.from !== st.to && lines.has(`${st.from} ${st.to}`) && (st.toward === st.from || st.toward === st.to) && (st.lights ?? []).every((l) => parts.has(l))),
  );
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
  return `<svg class="cap-system-map-layer" data-layer="inside" viewBox="${f1(vx)} ${f1(vy)} ${f1(vw)} ${f1(vh)}" aria-hidden="true" focusable="false"><rect class="cap-system-map-boundary" x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="18"/><text class="cap-system-map-inside-title" x="${f1(scene.label.textX)}" y="${f1(scene.label.textY)}"${scene.label.squeeze ? ` textLength="${f1(scene.label.squeeze)}" lengthAdjust="spacingAndGlyphs"` : ""}>${escapeHtml(scene.label.text)}</text>${wires}${rects}${playable ? `<circle class="cap-system-map-token" r="6" cx="0" cy="0"/>` : ""}</svg>`;
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
    insideSvg(layout, core, data, playable.length > 0),
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

/** The token's way along a drawn line: its corners from `start` toward `end`. A line starts and
 *  ends on its boxes' edges, so its two ends move `gap` along it, off the boxes. `forward` says
 *  the line was drawn from start to end. */
export function tokenRoute(route: string, forward: boolean, gap = 8): Array<[number, number]> {
  const pts = route
    .split(" ")
    .filter(Boolean)
    .map((p) => p.split(",").map(Number) as [number, number]);
  if (pts.length < 2) return pts;
  const way = forward ? pts : pts.reverse();
  const nudge = (p: [number, number], q: [number, number]): [number, number] => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const t = l ? Math.min(gap, l / 2) / l : 0;
    return [Math.round((p[0] + (q[0] - p[0]) * t) * 10) / 10, Math.round((p[1] + (q[1] - p[1]) * t) * 10) / 10];
  };
  const first = nudge(way[0]!, way[1]!);
  way[way.length - 1] = nudge(way[way.length - 1]!, way[way.length - 2]!);
  way[0] = first;
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
    detail.innerHTML = `<strong class="cap-system-map-detail-name">Inside ${escapeHtml(name)}</strong><span class="cap-system-map-detail-text">${own} parts inside${outside ? `, ${outside} outside it` : ""}.</span><span class="cap-system-map-detail-actions">${plays}<button type="button" class="cap-btn" data-cap-part="leave">Step out</button></span>`;
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
      // The token follows the step's line as drawn, bends and all, from just off one box to just
      // off the other, so it never sits on a part's name.
      const start = st.toward === st.to ? st.from : st.to;
      const wire = [...inside.querySelectorAll<SVGPathElement>(".cap-system-map-wire")].find((w) => (w.dataset.from === start && w.dataset.to === st.toward) || (w.dataset.from === st.toward && w.dataset.to === start));
      const route = tokenRoute(wire?.dataset.route ?? "", wire?.dataset.from === start);
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
