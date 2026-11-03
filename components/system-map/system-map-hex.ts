// The network as hexagons (system-map.ts): the core in the middle of a honeycomb, the shared
// packages on a ring around it, and what people use on an outer ring in its groups, every other
// cell of the comb left empty and faded. Each tie is a line between two cells, bent around the
// cells it would otherwise cross. Pure: the whole drawing is an SVG string a server delivers, so
// the lines are there with no script; the script only lights a cell's lines.

import { escapeHtml as e } from "../email/email.ts";
import type { MapSystem, SystemMapData } from "./system-map-data.ts";
import { tiePairs } from "./system-map-data.ts";

// A cell's radius (center to corner) in the drawing's own units. The drawing scales to its box;
// the text sizes below are set so that at the narrowest map that shows it (44rem) no text is
// under 12 px.
const R = 58;
const SQRT3 = Math.sqrt(3);
const NAME_SIZE = 18;
const LABEL_SIZE = 16;

type Axial = [number, number];
const DIRS: Axial[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

/** The cells of ring k around the center, in order around it. */
export function ringCells(k: number): Axial[] {
  if (k === 0) return [[0, 0]];
  const out: Axial[] = [];
  let q = DIRS[4]![0] * k;
  let r = DIRS[4]![1] * k;
  for (const [dq, dr] of DIRS) {
    for (let i = 0; i < k; i++) {
      out.push([q, r]);
      q += dq;
      r += dr;
    }
  }
  return out;
}

const xy = ([q, r]: Axial): [number, number] => [R * SQRT3 * (q + r / 2), R * 1.5 * r];
const angleOf = (c: Axial) => {
  const [x, y] = xy(c);
  return Math.atan2(y, x);
};
// Angles measured clockwise from the top, 0 to 2π, so rings read from twelve o'clock.
const fromTop = (a: number) => (a + Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI);
const byAngle = (cells: Axial[]) => [...cells].sort((a, b) => fromTop(angleOf(a)) - fromTop(angleOf(b)));
const wrap = (a: number, around: number) => {
  let x = a;
  while (x < around - Math.PI) x += 2 * Math.PI;
  while (x > around + Math.PI) x -= 2 * Math.PI;
  return x;
};

export interface HexCell {
  id: string;
  at: Axial;
  x: number;
  y: number;
}

export interface HexLayout {
  cells: HexCell[];
  // The empty cells of the comb, drawn faded.
  comb: Axial[];
  groups: { name: string; x: number; y: number }[];
  lines: { a: string; b: string; d: string }[];
  box: [number, number, number, number];
}

// The number of steps between two cells of the grid.
const hexDist = (a: Axial, b: Axial) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2;

// A small seeded random source (mulberry32), so the same network always lays out the same way.
function random(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The placement, searched (simulated annealing, Kirkpatrick, Gelatt and Vecchi 1983) from the
 * barycenter's start: the groups' order round the ring, the empty cells between them, each group's
 * order, the ring's turn, and the shared packages' order and turn, keeping whichever costs least.
 * The cost is the lines' total length in steps of the grid. Measured on the network's real lines
 * once routed, this also gave the fewest crossings and corners: adding a cost for straight lines
 * crossing made the routed lines longer and cross more, since a routed line does not run straight.
 * Many placements tie on length and differ in crossings, so hexLayout runs a few seeds and keeps
 * the one whose routed lines cross least. Seeded, so the same network always lays out the same way.
 */
function search(
  place: Map<string, Axial>,
  net: { groups: MapSystem[][]; shared: MapSystem[]; outerRing: Axial[]; sharedRing: Axial[]; sharedStep: number; pairs: [string, string][] },
  seed: number,
) {
  const { groups, shared, outerRing, sharedRing, sharedStep, pairs } = net;
  const G = groups.length;
  const used = groups.reduce((n, g) => n + g.length, 0);
  const spare = outerRing.length - used;
  if (!G && !shared.length) return;
  interface State {
    order: number[];
    gaps: number[];
    members: MapSystem[][];
    turn: number;
    sOrder: MapSystem[];
    sTurn: number;
  }
  // The start: what the barycenter left.
  const turnOf = (c: Axial | undefined, ring: Axial[]) => Math.max(0, ring.findIndex((r) => c && r[0] === c[0] && r[1] === c[1]));
  const sStart = shared.length ? Math.min(...shared.map((x) => turnOf(place.get(x.id), sharedRing))) : 0;
  let state: State = {
    order: groups.map((_, i) => i),
    gaps: groups.map((_, i) => Math.floor(spare / Math.max(1, G)) + (i < spare % Math.max(1, G) ? 1 : 0)),
    members: groups.map((g) => [...g]),
    turn: 0,
    sOrder: [...shared].sort((a, b) => ((turnOf(place.get(a.id), sharedRing) - sStart + sharedRing.length) % sharedRing.length) - ((turnOf(place.get(b.id), sharedRing) - sStart + sharedRing.length) % sharedRing.length)),
    sTurn: sStart,
  };
  const apply = (st: State) => {
    let i = st.turn;
    for (const gi of st.order) {
      for (const x of st.members[gi]!) place.set(x.id, outerRing[i++ % outerRing.length]!);
      i += st.gaps[gi]!;
    }
    st.sOrder.forEach((x, k) => place.set(x.id, sharedRing[(st.sTurn + k * sharedStep) % sharedRing.length]!));
  };
  const cost = (st: State) => {
    apply(st);
    let c = 0;
    for (const [a, b] of pairs) {
      const p = place.get(a);
      const q = place.get(b);
      if (p && q) c += hexDist(p, q);
    }
    return c;
  };
  const rnd = random(seed);
  const pick = (n: number) => Math.floor(rnd() * n);
  const clone = (st: State): State => ({ order: [...st.order], gaps: [...st.gaps], members: st.members.map((m) => [...m]), turn: st.turn, sOrder: [...st.sOrder], sTurn: st.sTurn });
  const move = (st: State) => {
    const n = clone(st);
    const kind = pick(6);
    const swap = <T>(list: T[]) => {
      if (list.length < 2) return;
      const i = pick(list.length);
      const j = pick(list.length);
      [list[i], list[j]] = [list[j]!, list[i]!];
    };
    if (kind === 0) swap(n.order);
    else if (kind === 1 && G > 1) {
      // An empty cell moves from one gap to another; every group keeps one between it and the next.
      const from = pick(G);
      const to = pick(G);
      if (n.gaps[from]! > (spare >= G ? 1 : 0)) {
        n.gaps[from]!--;
        n.gaps[to]!++;
      }
    } else if (kind === 2) swap(n.members[pick(Math.max(1, G))] ?? []);
    else if (kind === 3) n.turn = (n.turn + (rnd() < 0.5 ? 1 : outerRing.length - 1)) % outerRing.length;
    else if (kind === 4) swap(n.sOrder);
    else n.sTurn = (n.sTurn + (rnd() < 0.5 ? 1 : sharedRing.length - 1)) % sharedRing.length;
    return n;
  };
  let now = cost(state);
  let best = state;
  let bestCost = now;
  const steps = 2000;
  for (let k = 0; k < steps; k++) {
    const temp = 3 * (1 - k / steps) + 0.01;
    const next = move(state);
    const c = cost(next);
    if (c <= now || rnd() < Math.exp((now - c) / temp)) {
      state = next;
      now = c;
      if (c < bestCost) {
        best = next;
        bestCost = c;
      }
    }
  }
  apply(best);
}

/**
 * Where each system stands in the honeycomb, and each tie's line. The core takes the middle (more
 * than one core: the first ring). The shared packages take every other cell of the smallest ring
 * with room for that, so lines pass between them. What people use takes the ring two out, each
 * group a run of cells with empty cells between groups, in the groups' order from twelve o'clock.
 * Then, by the barycenter idea on a circle, each shared package moves toward the systems that use
 * it and each system within its group toward the packages it uses, so lines run short.
 */
export function hexLayout(data: SystemMapData, groupOf: (s: MapSystem) => string): HexLayout {
  const core = data.systems.filter((s) => s.ring === "core");
  const shared = data.systems.filter((s) => s.ring === "shared");
  const used = data.systems.filter((s) => s.ring === "used");
  const groupNames = [...new Set(used.map(groupOf))];
  const groups = groupNames.map((g) => used.filter((s) => groupOf(s) === g));
  const pairs = tiePairs(data);
  const neighbors = new Map(data.systems.map((s) => [s.id, [] as string[]]));
  for (const [a, b] of pairs) {
    neighbors.get(a)?.push(b);
    neighbors.get(b)?.push(a);
  }

  const place = new Map<string, Axial>();
  core.forEach((s, i) => place.set(s.id, i === 0 ? [0, 0] : byAngle(ringCells(1))[(i - 1) % 6]!));
  let sk = 2;
  while (6 * sk < 2 * shared.length) sk++;
  const sharedRing = byAngle(ringCells(sk));
  const sharedStep = Math.max(1, Math.floor(sharedRing.length / Math.max(1, shared.length)));
  let ok = sk + 2;
  while (6 * ok < used.length + groups.length) ok++;
  const outerRing = byAngle(ringCells(ok));

  // The outer ring: each group a run, the spare cells spread between groups.
  const spare = outerRing.length - used.length;
  const placeOuter = () => {
    let i = 0;
    groups.forEach((g, gi) => {
      for (const s of g) place.set(s.id, outerRing[i++ % outerRing.length]!);
      i += Math.floor(spare / groups.length) + (gi < spare % groups.length ? 1 : 0);
    });
  };
  const placeShared = (order: MapSystem[], start: number) => order.forEach((s, i) => place.set(s.id, sharedRing[(start + i * sharedStep) % sharedRing.length]!));
  placeOuter();
  placeShared(shared, 0);

  const mean = (id: string, among: (o: string) => boolean, around: number) => {
    const others = (neighbors.get(id) ?? []).filter(among);
    if (!others.length) return around;
    let x = 0;
    let y = 0;
    for (const o of others) {
      const a = angleOf(place.get(o)!);
      x += Math.cos(a);
      y += Math.sin(a);
    }
    return wrap(Math.atan2(y, x), around);
  };
  const isUsed = new Set(used.map((s) => s.id));
  const isShared = new Set(shared.map((s) => s.id));
  for (let sweep = 0; sweep < 6; sweep++) {
    // Shared packages in the order of where their users stand; the ring turned to fit the first.
    const want = new Map(shared.map((s) => [s.id, fromTop(mean(s.id, (o) => isUsed.has(o), angleOf(place.get(s.id)!)))]));
    const order = [...shared].sort((a, b) => want.get(a.id)! - want.get(b.id)!);
    let start = 0;
    let best = Infinity;
    for (let k = 0; k < sharedRing.length; k++) {
      let cost = 0;
      order.forEach((s, i) => {
        const at = fromTop(angleOf(sharedRing[(k + i * sharedStep) % sharedRing.length]!));
        const d = Math.abs(at - want.get(s.id)!);
        cost += Math.min(d, 2 * Math.PI - d);
      });
      if (cost < best) {
        best = cost;
        start = k;
      }
    }
    placeShared(order, start);
    for (const g of groups) {
      const mid = g.reduce((k, s) => k + fromTop(angleOf(place.get(s.id)!)), 0) / g.length;
      const at = new Map(g.map((s) => [s.id, fromTop(mean(s.id, (o) => isShared.has(o) || core.some((c) => c.id === o), angleOf(place.get(s.id)!)))]));
      const key = (s: MapSystem) => wrap(at.get(s.id)!, mid);
      g.sort((a, b) => key(a) - key(b));
    }
    placeOuter();
  }

  // The placement searched from a few seeds; the one whose routed lines cross least is kept.
  const net = { groups, shared, outerRing, sharedRing, sharedStep, pairs };
  const draw = (place: Map<string, Axial>) => {
    const cells: HexCell[] = data.systems.flatMap((s) => {
      const at = place.get(s.id);
      if (!at) return [];
      const [x, y] = xy(at);
      return [{ id: s.id, at, x, y }];
    });
    const taken = new Set(cells.map((c) => `${c.at[0]},${c.at[1]}`));
    const comb: Axial[] = [];
    for (let k = 0; k <= ok + 1; k++) for (const c of ringCells(k)) if (!taken.has(`${c[0]},${c[1]}`)) comb.push(c);

    // Each line runs through the comb's empty cells, never under another system: the shortest path
    // over the hex grid whose middle cells are all empty A cell already carrying a line costs a
    // little less, so lines gather into tracks), drawn as straight runs with rounded corners. Lines
    // sharing a cell stand side by side in it. Ties between neighbors are a straight line.
    const key = (c: Axial) => `${c[0]},${c[1]}`;
    const ringOf = ([q, r]: Axial) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
    const load = new Map<string, number>();
    const at = new Map(cells.map((c) => [c.id, c]));
    // Dijkstra over (cell, heading): a step costs 1, a turn a little more, so lines run straight
    // along the comb's channels and bundle there, like tracks, instead of wandering.
    const route = (from: Axial, to: Axial): Axial[] => {
      const goal = key(to);
      const sk0 = `${key(from)}|-1`;
      const dist = new Map<string, number>([[sk0, 0]]);
      const prev = new Map<string, string>();
      const cellOf = new Map<string, Axial>([[sk0, from]]);
      const open: [number, string][] = [[0, sk0]];
      let end = "";
      while (open.length) {
        open.sort((x, y) => x[0] - y[0]);
        const [d, st] = open.shift()!;
        if (d > dist.get(st)!) continue;
        const c = cellOf.get(st)!;
        if (key(c) === goal) {
          end = st;
          break;
        }
        const h = Number(st.split("|")[1]);
        DIRS.forEach(([dq, dr], di) => {
          const n: Axial = [c[0] + dq, c[1] + dr];
          const nk = key(n);
          if (nk !== goal && (taken.has(nk) || ringOf(n) > ok)) return;
          const turn = h < 0 || h === di ? 0 : Math.min((h - di + 6) % 6, (di - h + 6) % 6) === 1 ? 0.45 : 1.2;
          const nd = d + 1 + turn - (nk !== goal && load.has(nk) ? 0.3 : 0);
          const ns = `${nk}|${di}`;
          if (nd < (dist.get(ns) ?? Infinity)) {
            dist.set(ns, nd);
            prev.set(ns, st);
            cellOf.set(ns, n);
            open.push([nd, ns]);
          }
        });
      }
      if (!end) return [from, to];
      const path: Axial[] = [];
      for (let st: string | undefined = end; st; st = prev.get(st)) path.unshift(cellOf.get(st)!);
      return path;
    };
    // Longer ties first, so the short ones fit around them.
    const ordered = pairs
      .filter(([a, b]) => at.has(a) && at.has(b))
      .sort(([a, b], [c, d]) => Math.hypot(at.get(d)!.x - at.get(c)!.x, at.get(d)!.y - at.get(c)!.y) - Math.hypot(at.get(b)!.x - at.get(a)!.x, at.get(b)!.y - at.get(a)!.y));
    const paths = ordered.map(([a, b]) => {
      const path = route(at.get(a)!.at, at.get(b)!.at);
      for (const c of path.slice(1, -1)) load.set(key(c), (load.get(key(c)) ?? 0) + 1);
      return { a, b, path };
    });
    // Where each line stands inside a shared cell: spread across it, in a steady order.
    const slots = new Map<string, number>();
    const f = (n: number) => Math.round(n * 10) / 10;
    const lines = paths.map(({ a, b, path }) => {
      const pts = path.map((c, i) => {
        const [x, y] = xy(c);
        if (i === 0 || i === path.length - 1) return [x, y] as [number, number];
        const k = key(c);
        const n = load.get(k)!;
        const slot = slots.get(k) ?? 0;
        slots.set(k, slot + 1);
        const [px, py] = xy(path[i - 1]!);
        const [nx2, ny2] = xy(path[i + 1]!);
        const len = Math.hypot(nx2 - px, ny2 - py) || 1;
        const off = (slot - (n - 1) / 2) * Math.min(3, (R * 0.5) / Math.max(1, n));
        return [x - ((ny2 - py) / len) * off, y + ((nx2 - px) / len) * off] as [number, number];
      });
      // Straight runs joined by rounded corners, as a track is drawn.
      let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i - 1]!;
        const [x, y] = pts[i]!;
        const [nx2, ny2] = pts[i + 1]!;
        const l0 = Math.hypot(x - px, y - py) || 1;
        const l1 = Math.hypot(nx2 - x, ny2 - y) || 1;
        const r = Math.min(R * 0.6, l0 / 2, l1 / 2);
        d += ` L${f(x - ((x - px) / l0) * r)} ${f(y - ((y - py) / l0) * r)} Q${f(x)} ${f(y)} ${f(x + ((nx2 - x) / l1) * r)} ${f(y + ((ny2 - y) / l1) * r)}`;
      }
      d += ` L${f(pts[pts.length - 1]![0])} ${f(pts[pts.length - 1]![1])}`;
      return { a, b, d, pts };
    });
    // How many pairs of lines cross, counted on the routes as drawn.
    let crossings = 0;
    const o = (p: [number, number], q: [number, number], r: [number, number]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const cut = (p: [number, number], q: [number, number], r: [number, number], t: [number, number]) => o(p, q, r) * o(p, q, t) < 0 && o(r, t, p) * o(r, t, q) < 0;
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const P = lines[i]!.pts;
        const Q = lines[j]!.pts;
        if (P.some((_, x) => x > 0 && Q.some((_, y) => y > 0 && cut(P[x - 1]!, P[x]!, Q[y - 1]!, Q[y]!)))) crossings++;
      }
    }
    return { cells, comb, lines: lines.map(({ a, b, d }) => ({ a, b, d })), crossings };
  };
  const start = new Map(place);
  let drawn: ReturnType<typeof draw> | null = null;
  for (const seed of [0x5eed, 1, 2, 3]) {
    const tried = new Map(start);
    search(tried, net, seed);
    const d = draw(tried);
    if (!drawn || d.crossings < drawn.crossings) {
      drawn = d;
      for (const [k, v] of tried) place.set(k, v);
    }
  }
  const { cells, comb, lines } = drawn!;

  // Each group's name in the empty ring just outside it, at the cell nearest its run's middle.
  const outside = ringCells(ok + 1);
  const labels = groups.map((g, i) => {
    const ang = Math.atan2(
      g.reduce((k, s) => k + Math.sin(angleOf(place.get(s.id)!)), 0),
      g.reduce((k, s) => k + Math.cos(angleOf(place.get(s.id)!)), 0),
    );
    const cell = outside.reduce((best, c) => (Math.abs(wrap(angleOf(c), ang) - ang) < Math.abs(wrap(angleOf(best), ang) - ang) ? c : best));
    const [x, y] = xy(cell);
    return { name: groupNames[i]!, x, y };
  });
  // The box: every cell of the comb, with a cell's room around it.
  const pts = [...comb, ...cells.map((c) => c.at)].map(xy);
  const x0 = Math.min(...pts.map((p) => p[0])) - R;
  const x1 = Math.max(...pts.map((p) => p[0])) + R;
  const y0 = Math.min(...pts.map((p) => p[1])) - R;
  const y1 = Math.max(...pts.map((p) => p[1])) + R;
  return { cells, comb, groups: labels, lines, box: [x0, y0, x1 - x0, y1 - y0] };
}

const hexPoints = (x: number, y: number, r = R * 0.94) =>
  Array.from({ length: 6 }, (_, i) => {
    const t = Math.PI / 6 + (i * Math.PI) / 3;
    return `${Math.round((x + r * Math.cos(t)) * 10) / 10},${Math.round((y + r * Math.sin(t)) * 10) / 10}`;
  }).join(" ");

/** A name in a cell: one line, or two split at a space when it is long (the space kept, so the
 * words read as the name they are). */
function nameText(name: string, x: number, y: number): string {
  const words = name.split(" ");
  if (name.length <= 9 || words.length < 2) return `<text class="cap-system-map-cell-name" x="${x}" y="${y}" dy="0.35em">${e(name)}</text>`;
  let best = 1;
  for (let i = 1; i < words.length; i++) if (Math.abs(words.slice(0, i).join(" ").length - name.length / 2) < Math.abs(words.slice(0, best).join(" ").length - name.length / 2)) best = i;
  return `<text class="cap-system-map-cell-name" x="${x}" y="${y}"><tspan x="${x}" dy="-0.2em">${e(words.slice(0, best).join(" "))} </tspan><tspan x="${x}" dy="1.15em">${e(words.slice(best).join(" "))}</tspan></text>`;
}

/**
 * The honeycomb as an SVG string. Each system is a link (its full name as the link's name, its
 * short name as the text) carrying `data-id`, `data-ring` and, when private, `data-private`; each
 * line carries `data-a` and `data-b`. The comb, the lines and the group names are hidden from
 * assistive technology: the cells' links and the plain map hold the same ties as words.
 */
export function hexSvg(data: SystemMapData, layout: HexLayout, labelId: string): string {
  const byId = new Map(data.systems.map((s) => [s.id, s]));
  const [bx, by, bw, bh] = layout.box.map((n) => Math.round(n));
  const comb = layout.comb.map((c) => `<polygon points="${hexPoints(...xy(c))}"/>`).join("");
  const lines = layout.lines.map((l) => `<path class="cap-system-map-wire" data-a="${e(l.a)}" data-b="${e(l.b)}" d="${l.d}"/>`).join("");
  const groups = layout.groups.map((g) => `<text class="cap-system-map-comb-group" x="${Math.round(g.x)}" y="${Math.round(g.y)}" dy="0.35em">${e(g.name)}</text>`).join("");
  const cells = layout.cells
    .map((c) => {
      const s = byId.get(c.id)!;
      const x = Math.round(c.x * 10) / 10;
      const y = Math.round(c.y * 10) / 10;
      const inner = `<polygon points="${hexPoints(c.x, c.y, s.ring === "core" ? R * 0.98 : R * 0.94)}"/>${nameText(s.short ?? s.name, x, y)}`;
      const attrs = `class="cap-system-map-cell" data-id="${e(s.id)}" data-ring="${s.ring}"${s.private ? " data-private" : ""}`;
      // The name a link is known by starts with the words it shows (WCAG 2.5.3), then the full name.
      const label = s.short && s.short !== s.name ? `${s.short}, ${s.name}` : s.name;
      return s.href ? `<a ${attrs} href="${e(s.href)}" aria-label="${e(label)}">${inner}</a>` : `<g ${attrs} role="img" aria-label="${e(label)}">${inner}</g>`;
    })
    .join("");
  return `<svg class="cap-system-map-comb" viewBox="${bx} ${by} ${bw} ${bh}" role="group" aria-labelledby="${e(labelId)}" style="--cap-name-size: ${NAME_SIZE}px; --cap-label-size: ${LABEL_SIZE}px"><g class="cap-system-map-comb-cells" aria-hidden="true">${comb}</g><g class="cap-system-map-comb-lines" aria-hidden="true">${lines}</g><g aria-hidden="true">${groups}</g>${cells}</svg>`;
}
