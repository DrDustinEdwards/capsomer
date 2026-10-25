// The system map's inside view: the core's parts placed in its boundary and the lines routed between them (system-map.ts).

import { BOX_W, EXTERNAL, type Layout, type MapContainer, type MapFlow, type MapLink, type MapSystem, STORE_KINDS, type SystemMapData, layoutMap } from "./system-map-data.ts";
import type { Box } from "./system-map-html.ts";

// ---------------------------------------------------------------------------------------
// Inside the core. The core's parts sit inside a dashed circle, the capsid's own outline and
// C4's system boundary, as large as the stage allows, its name at its foot; what the core
// works with outside it (`external` parts: the agents that call it, the host its code lives
// on) sits in the stage's corners outside the circle, above it and, when there are more than
// two, below it (Dustin, 2026-10-13: the circle, made bigger). The seat's rulings on
// capsomer#64 decide how lines run between them:
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

export const BOX_H = 32;
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
// The name's baseline sits this far above the circle's foot.
const LABEL_FOOT = 16;
// Every part outside keeps this far from the circle.
const OUT_CLEAR = 2 * ROUTE_CLEAR;
const MIN_PITCH = BOX_H + 2 * ROUTE_CLEAR + 12;
const MAX_PITCH = 104;
const ROOMY_PITCH = 80;
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

export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface InsideScene {
  viewBox: [number, number, number, number];
  boundary: Circle;
  // The boundary's name: its text starts at (textX, textY), and `box` is what lines avoid.
  label: { text: string; textX: number; textY: number; box: Rect; squeeze: number | null };
  boxes: Box[];
  wires: InsideWire[];
}

const rectOf = (b: Box): Rect => ({ x: b.x - b.w / 2, y: b.y - BOX_H / 2, w: b.w, h: BOX_H });
const rectCorners = (r: Rect): Pt[] => [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];

/** How far a rectangle sits inside a circle: the circle's radius less its farthest corner's
 *  distance from the center (below 0, a corner is outside). */
export function rectInset(r: Rect, c: Circle): number {
  return c.r - Math.max(...rectCorners(r).map(([x, y]) => Math.hypot(x - c.cx, y - c.cy)));
}

/** How far a rectangle sits outside a circle: its nearest point's distance from the center
 *  less the radius (below 0, it reaches inside). */
export function rectOutset(r: Rect, c: Circle): number {
  return Math.hypot(Math.max(r.x - c.cx, 0, c.cx - r.x - r.w), Math.max(r.y - c.cy, 0, c.cy - r.y - r.h)) - c.r;
}
const grow = (r: Rect, g: number): Rect => ({ x: r.x - g, y: r.y - g, w: r.w + 2 * g, h: r.h + 2 * g });

/** Whether the segment p-q passes through the rectangle's inside (a touch is not a hit). */
export function segmentHitsRect(p: Pt, q: Pt, r: Rect): boolean {
  return hitsRect(p[0], p[1], q[0], q[1], r);
}

/** The same from four numbers, for a search's hot path (system-map-circles-search.ts). */
export function hitsRect(px: number, py: number, qx: number, qy: number, r: Rect): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = qx - px;
  const dy = qy - py;
  for (const [pk, qk] of [[-dx, px - r.x], [dx, r.x + r.w - px], [-dy, py - r.y], [dy, r.y + r.h - py]] as const) {
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
function searchRoute(start: Pt, end: Pt, ends: readonly Box[], boxes: readonly Box[], label: Rect | null, drawn: readonly Drawn[], within: (p: Pt) => boolean): Pt[] | null {
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
    .flatMap(rectCorners)
    .filter(([x, y]) => within([x, y]) && boxes.every((o) => !(Math.abs(x - o.x) < o.w / 2 + ROUTE_CLEAR && Math.abs(y - o.y) < BOX_H / 2 + ROUTE_CLEAR)));
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

/** The core's parts in rows inside the circle: rows of two (workers, sites, crons) above rows
 *  of three (stores), the rows as far apart as fits (at most MAX_PITCH), each spread along its
 *  chord, every box at least PAD inside the circle and the name's band left clear at its
 *  foot. Null when they do not fit, so the drawing is made larger. */
function placeInside(containers: readonly MapContainer[], c: Circle, minPitch: number): Box[] | null {
  const tops = containers.filter((k) => k.kind !== EXTERNAL && !STORE_KINDS.has(k.kind));
  const stores = containers.filter((k) => STORE_KINDS.has(k.kind));
  const R = c.r - PAD;
  // Two to a row above three; a drawing too small for that is made larger rather than stacked.
  {
    const [maxTop, maxStore] = [2, 3];
    const rows: Array<{ items: MapContainer[]; w: number }> = [];
    for (const [list, bw, max] of [[tops, BOX_W, maxTop], [stores, 88, maxStore]] as const) {
      for (let i = 0; i < list.length; i += max) rows.push({ items: list.slice(i, i + max), w: bw });
    }
    if (rows.length === 0) return [];
    // Half a box's width from the center of each slot to its edge; the slots sit COL_GAP apart.
    const fits = (pitch: number): Box[] | null => {
      const mid = c.cy - LABEL_H / 2;
      const out: Box[] = [];
      for (const [r, row] of rows.entries()) {
        const y = mid + (r - (rows.length - 1) / 2) * pitch;
        const far = Math.abs(y - c.cy) + BOX_H / 2;
        if (far >= R || y + BOX_H / 2 > c.cy + c.r - PAD - LABEL_H) return null;
        const half = Math.sqrt(R * R - far * far);
        const n = row.items.length;
        const step = n > 1 ? Math.min((2 * half - row.w) / (n - 1), (2 * R) / n) : 0;
        if (n > 1 && step < row.w + COL_GAP) return null;
        if (n === 1 && row.w / 2 > half) return null;
        row.items.forEach((k, i) => out.push({ c: k, x: Math.round((c.cx + (i - (n - 1) / 2) * step) * 10) / 10, y: Math.round(y * 10) / 10, w: row.w }));
      }
      return out;
    };
    for (let pitch = rows.length > 1 ? MAX_PITCH : 0; pitch >= (rows.length > 1 ? minPitch : 0); pitch -= 2) {
      const placed = fits(pitch);
      if (placed) return placed;
      if (rows.length === 1) break;
    }
  }
  return null;
}

/** Everything drawn inside the core: the circle and its name, the parts in and out of it,
 *  and every line between them, routed by the rules above. */
export function insideScene(containers: readonly MapContainer[], links: readonly MapLink[], layout: Layout, name = "Inside"): InsideScene {
  const externals = containers.filter((c) => c.kind === EXTERNAL).slice(0, 4);
  // The drawing grows until its parts fit inside the circle.
  let [vx, vy, vw, vh] = insideViewBox(layout, containers);
  let boundary: Circle = { cx: 0, cy: 0, r: 0 };
  let outside: Box[] = [];
  let inside: Box[] | null = null;
  for (let k = 0; k < 40; k++) {
    const xl = vx + MARGIN + BOX_W / 2;
    const xr = vx + vw - MARGIN - BOX_W / 2;
    outside = externals.map((c, i) => ({ c, x: i % 2 === 0 ? xl : xr, y: i < 2 ? vy + MARGIN + BOX_H / 2 : vy + vh - MARGIN - BOX_H / 2, w: BOX_W }));
    // The circle is centered between the bands the parts outside sit in, and as large as the
    // drawing allows: within its margins, and OUT_CLEAR from every part outside, which sit in
    // the corners it leaves.
    const top = externals.length ? vy + MARGIN + BOX_H + OUT_GAP : vy + MARGIN;
    const bottom = externals.length > 2 ? vy + vh - MARGIN - BOX_H - OUT_GAP : vy + vh - MARGIN;
    const cx = vx + vw / 2;
    const cy = (top + bottom) / 2;
    const r = Math.min(vw / 2 - MARGIN, cy - vy - MARGIN, vy + vh - MARGIN - cy, ...outside.map((o) => rectOutset(rectOf(o), { cx, cy, r: 0 }) - OUT_CLEAR));
    boundary = { cx, cy, r: Math.floor(r * 10) / 10 };
    // Rows at least ROOMY_PITCH apart leave the lines room to keep their rules; a drawing
    // grown a third larger still short of that takes the rows as close as MIN_PITCH.
    inside = placeInside(containers, boundary, ROOMY_PITCH) ?? (k >= 4 ? placeInside(containers, boundary, MIN_PITCH) : null);
    if (inside) break;
    [vx, vy, vw, vh] = [vx * 1.08, vy * 1.08, vw * 1.08, vh * 1.08];
  }
  if (!inside) inside = [];
  const viewBox: [number, number, number, number] = [Math.round(vx * 10) / 10, Math.round(vy * 10) / 10, Math.round(vw * 10) / 10, Math.round(vh * 10) / 10];
  // The name is 9-unit capitals in a monospace face, a little under 7 units a letter, centered
  // at the circle's foot; a name too long for the chord there is squeezed to fit (textLength),
  // so lines avoid all of it.
  const textY = boundary.cy + boundary.r - LABEL_FOOT;
  const chord = 2 * Math.sqrt(Math.max(0, boundary.r ** 2 - (textY + 3 - boundary.cy) ** 2));
  const maxLabel = Math.max(24, Math.floor(chord - 12));
  const labelW = Math.min(Math.round(name.length * 7 + 6), maxLabel);
  const label = {
    text: name,
    textX: boundary.cx,
    textY,
    box: { x: boundary.cx - labelW / 2, y: textY - 11, w: labelW, h: 14 },
    squeeze: labelW === maxLabel ? labelW - 6 : null,
  };
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
  const inView = ([x, y]: Pt) => x >= vx && x <= vx + vw && y >= vy && y <= vy + vh;
  const inCircle = ([x, y]: Pt) => Math.hypot(x - boundary.cx, y - boundary.cy) <= boundary.r - 4;
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
      // A line between two parts inside stays inside the circle; one to a part outside may
      // use the whole drawing. A box or the name is never given up; if every way crosses one
      // (a core too crowded to draw), the line goes straight and the tests say so.
      const within = ends.every((e) => e.c.kind !== EXTERNAL) ? inCircle : inView;
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
