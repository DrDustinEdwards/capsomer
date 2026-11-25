// The honeycomb's placement search (system-map-hex.ts lays the network out with it): a seeded
// annealing over the cells of an axial hexagon grid. Pure.
import type { MapSystem } from "./system-map-data.ts";

// A cell of the grid, axial (q, r) coordinates.
export type Axial = [number, number];

// The number of steps between two cells of the grid.
const hexDist = (a: Axial, b: Axial) =>
  (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2;

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
export function search(
  place: Map<string, Axial>,
  net: {
    groups: MapSystem[][];
    shared: MapSystem[];
    outerRing: Axial[];
    sharedRing: Axial[];
    sharedStep: number;
    pairs: [string, string][];
  },
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
  const turnOf = (c: Axial | undefined, ring: Axial[]) =>
    Math.max(
      0,
      ring.findIndex((r) => c && r[0] === c[0] && r[1] === c[1]),
    );
  const sStart = shared.length
    ? Math.min(...shared.map((x) => turnOf(place.get(x.id), sharedRing)))
    : 0;
  let state: State = {
    order: groups.map((_, i) => i),
    gaps: groups.map(
      (_, i) => Math.floor(spare / Math.max(1, G)) + (i < spare % Math.max(1, G) ? 1 : 0),
    ),
    members: groups.map((g) => [...g]),
    turn: 0,
    sOrder: [...shared].sort(
      (a, b) =>
        ((turnOf(place.get(a.id), sharedRing) - sStart + sharedRing.length) % sharedRing.length) -
        ((turnOf(place.get(b.id), sharedRing) - sStart + sharedRing.length) % sharedRing.length),
    ),
    sTurn: sStart,
  };
  const apply = (st: State) => {
    let i = st.turn;
    for (const gi of st.order) {
      for (const x of st.members[gi]!) place.set(x.id, outerRing[i++ % outerRing.length]!);
      i += st.gaps[gi]!;
    }
    st.sOrder.forEach((x, k) =>
      place.set(x.id, sharedRing[(st.sTurn + k * sharedStep) % sharedRing.length]!),
    );
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
  const clone = (st: State): State => ({
    order: [...st.order],
    gaps: [...st.gaps],
    members: st.members.map((m) => [...m]),
    turn: st.turn,
    sOrder: [...st.sOrder],
    sTurn: st.sTurn,
  });
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
    else if (kind === 3)
      n.turn = (n.turn + (rnd() < 0.5 ? 1 : outerRing.length - 1)) % outerRing.length;
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
