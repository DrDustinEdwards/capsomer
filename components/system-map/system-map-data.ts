// The system map's data shape, its hexagonal layout and the arrow keys' neighbors (system-map.ts).

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
  // What it is for (Websites, Apps): the systems people use are drawn in groups, each
  // together and named, apart from the others. The order the groups first appear in is
  // the order they go round the map in.
  group?: string;
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

// Capsid's public model as it is served, before the map's narrowing: each system carries its
// family (what kind of thing it is), which the map turns into a group and a word.
export interface ModelSystem {
  id: string;
  name: string;
  short?: string;
  ring: MapRing;
  private?: boolean;
  family: string;
  description?: string;
  domain?: string;
}

export interface SystemModel {
  systems: readonly ModelSystem[];
  relationships: readonly MapLink[];
  containers: readonly MapContainer[];
}

// The word under a system and the group it is drawn in, in a stranger's words (Dustin,
// 2026-10-23: like goes with like, and the map should explain itself). An admin MCP sits in
// its app's group and says so.
const FAMILY_WORD: Record<string, string> = { system: "tool", writing: "writing", product: "app", plumbing: "tool", site: "site" };
const FAMILY_GROUP: Record<string, string> = { system: "Tools", writing: "Writing", product: "Apps", plumbing: "Tools", site: "Websites" };

/**
 * What the map draws from Capsid's public model, the same on every host: each system with its
 * word and, for what people use, its group, every line, and the parts with their kind (the box
 * under a part's name is sized for a word). `href` is where a system's "Open" goes.
 */
export function modelMapData(model: SystemModel, href?: (id: string) => string): SystemMapData {
  return {
    systems: model.systems.map((s) => ({
      id: s.id,
      name: s.name,
      short: s.short,
      ring: s.ring,
      private: s.private,
      tag: s.ring === "core" ? undefined : s.ring === "shared" ? "shared" : s.id.endsWith("-mcp") ? "admin" : (FAMILY_WORD[s.family] ?? s.family),
      group: s.ring === "used" ? FAMILY_GROUP[s.family] : undefined,
      description: s.description,
      domain: s.domain || undefined,
      href: href?.(s.id),
    })),
    relationships: model.relationships.map(({ from, to, kind }) => ({ from, to, kind })),
    containers: model.containers.map(({ id, system, name, kind }) => ({ id, system, name, kind })),
  };
}

export interface SystemMapOptions {
  // Unique on the page; prefixes every id the map writes.
  id?: string;
  label?: string;
  caption?: string;
  ringNames?: Partial<Record<MapRing, string>>;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  openLabel?: string;
  // Every system's inside, from circleLayers (system-map-circles.ts): one tap on any capsomer
  // zooms into its circle. `layers` are put in the markup, `src` is the address of all of them
  // as one JSON object by id, which the script fetches once the page has loaded, and `chosen`
  // is drawn zoomed into, with no script.
  circles?: { layers?: Readonly<Record<string, string>>; src?: string; chosen?: string };
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
  // Each group's name and where it is written, when the systems people use are grouped.
  labels: Array<{ text: string; x: number; y: number }>;
  // Grouped, the empty cells are gaps between groups and are not drawn.
  grouped: boolean;
}

const toXY = (q: number, r: number): [number, number] => [Math.round(1.5 * R * q * 100) / 100, Math.round(SQRT3 * R * (r + q / 2) * 100) / 100];

const NEIGHBORS: Array<[number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const ringOf = (q: number, r: number) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const key = (q: number, r: number) => `${q},${r}`;
// The size of a group's name, for room around the map: 11 px capitals, spaced.
const LABEL_CHAR = 8.4;
const LABEL_GAP = R + 12;

/**
 * The systems people use, in groups (Dustin, 2026-10-23: like goes with like, and a
 * stranger reads named groups, not rings): from the ring after the shared ones, each group
 * grows from its own direction, as near the middle as it can, its systems chained in the
 * order given, so each touches the one before it (a site beside its admin). No cell of
 * one group touches another group's, so the gaps say where a group ends. The groups go
 * round in the order they first appear, each given an arc in proportion to its size.
 */
function placeGroups(outer: readonly MapSystem[], start: number, taken: Map<string, string>): Map<string, [number, number]> {
  const names = [...new Set(outer.map((s) => s.group ?? ""))];
  const total = outer.length;
  const owner = new Map<string, number>();
  const out = new Map<string, [number, number]>();
  let before = 0;
  names.forEach((name, gi) => {
    const members = outer.filter((s) => (s.group ?? "") === name);
    // The middle of its arc, from the lower left round, as a reader's eye goes.
    const angle = (3 * Math.PI) / 4 - (2 * Math.PI * (before + members.length / 2)) / total;
    before += members.length;
    const [ax, ay] = [Math.cos(angle) * (start + 0.6) * 1.5 * R, Math.sin(angle) * (start + 0.6) * 1.5 * R];
    let last: [number, number] | null = null;
    for (const s of members) {
      const candidates: Array<{ q: number; r: number; score: number }> = [];
      const reach = start + members.length;
      for (let q = -reach; q <= reach; q++) {
        for (let r = -reach; r <= reach; r++) {
          if (ringOf(q, r) < start || taken.has(key(q, r))) continue;
          const near = NEIGHBORS.map(([dq, dr]) => [q + dq, r + dr] as [number, number]);
          if (near.some(([nq, nr]) => owner.has(key(nq, nr)) && owner.get(key(nq, nr)) !== gi)) continue;
          const mine = near.filter(([nq, nr]) => owner.get(key(nq, nr)) === gi).length;
          const touchesLast = last !== null && near.some(([nq, nr]) => nq === last![0] && nr === last![1]);
          if (last !== null && mine === 0) continue;
          const [x, y] = toXY(q, r);
          // Beside the one before it first, then near the group's direction and the middle,
          // then among more of its own.
          const score = (touchesLast || last === null ? 0 : 1e4) + Math.hypot(x - ax, y - ay) + ringOf(q, r) * 20 - mine * 10;
          candidates.push({ q, r, score });
        }
      }
      candidates.sort((a, b) => a.score - b.score || a.q - b.q || a.r - b.r);
      const best = candidates[0];
      if (!best) throw new Error(`no room for ${s.id} in its group`);
      out.set(s.id, [best.q, best.r]);
      owner.set(key(best.q, best.r), gi);
      taken.set(key(best.q, best.r), s.id);
      last = [best.q, best.r];
    }
  });
  return out;
}

/**
 * Places the systems: the first core system in the middle; shared parts from ring 1,
 * spilling outward if there are more than fit; what people use from the ring after the
 * last shared one, or in their groups when they have them (placeGroups). Ungrouped,
 * every cell of every ring up to the last filled one is drawn, the unused ones as empty
 * shell. Systems keep the order they are given in.
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
  const grouped = outer.some((s) => s.group);
  if (!grouped) {
    const rings = outer.length ? fill(outer.map((s) => s.id), lastInner + 1) : lastInner;
    const cells = placed.map(({ id, ring, q, r }) => {
      const [x, y] = toXY(q, r);
      return { id, ring, x, y };
    });
    const halfW = 1.5 * R * rings + R + 6;
    const halfH = SQRT3 * R * rings + (SQRT3 * R) / 2 + 6;
    return { cells, rings, viewBox: [-halfW, -halfH, halfW * 2, halfH * 2], labels: [], grouped: false };
  }
  // The inner rings' leftover cells stay empty: the groups start outside them.
  const taken = new Map(placed.filter((p) => p.id).map((p) => [key(p.q, p.r), p.id!]));
  const at = placeGroups(outer, lastInner + 1, taken);
  const rings = Math.max(lastInner, ...[...at.values()].map(([q, r]) => ringOf(q, r)));
  // Every cell to the outermost ring is in the layout, empty or not, as the lines walk
  // the seams of the gaps too; grouped, the empty ones are not drawn.
  const byCell = new Map([...at].map(([id, [q, r]]) => [key(q, r), id]));
  const cells: Cell[] = [];
  for (let k = 0; k <= rings; k++) {
    for (const [q, r] of ringCells(k)) {
      const [x, y] = toXY(q, r);
      const id = k <= lastInner ? (placed.find((p) => p.q === q && p.r === r)?.id ?? null) : (byCell.get(key(q, r)) ?? null);
      cells.push({ id, ring: k, x, y });
    }
  }
  // Each group's name just outside it, on the line from the middle through the group.
  const where = new Map(cells.filter((c) => c.id).map((c) => [c.id!, c]));
  const labels: Layout["labels"] = [...new Set(outer.map((s) => s.group ?? ""))].filter(Boolean).map((text) => {
    const pts = outer.filter((s) => s.group === text).map((s) => where.get(s.id)!);
    const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
    const len = Math.hypot(cx, cy) || 1;
    const far = Math.max(...pts.map((p) => (p.x * cx + p.y * cy) / len));
    // Clear of the outermost hexagon, and of it sideways by half the name.
    const d = far + LABEL_GAP + ((text.length * LABEL_CHAR) / 2) * Math.abs(cx / len);
    return { text, x: Math.round(((cx / len) * d) * 10) / 10, y: Math.round(((cy / len) * d + 4) * 10) / 10 };
  });
  let halfW = 1.5 * R * rings + R + 6;
  let halfH = SQRT3 * R * rings + (SQRT3 * R) / 2 + 6;
  for (const l of labels) {
    halfW = Math.max(halfW, Math.abs(l.x) + (l.text.length * LABEL_CHAR) / 2 + 6);
    halfH = Math.max(halfH, Math.abs(l.y) + 12);
  }
  return { cells, rings, viewBox: [-halfW, -halfH, halfW * 2, halfH * 2], labels, grouped: true };
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
