// The system map's data shape, its hexagonal layout and the arrow keys' neighbours (system-map.ts).

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
export const LOOSE_KINDS = new Set(["coordinates", "watches"]);
export const STORE_KINDS = new Set(["database", "bucket", "kv", "queue"]);
export const EXTERNAL = "external";
export const BOX_W = 104;

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
