// The system map's data and the pure reading of it (system-map.ts): who uses whom, a system's
// parts by what they do, and the flows over a system's parts.

// ---------------------------------------------------------------------------------------
// Data. The shape of Capsid's public model (capsid/system/model.json through toPublic),
// narrowed to what the map shows; a host maps its own data onto it.

export type MapRing = "core" | "shared" | "used";

export interface MapSystem {
  id: string;
  name: string;
  // The name a card shows on the network, where room is short ("Site MCP"); the full name stays
  // in the card's words and on the system's page.
  short?: string;
  ring: MapRing;
  private?: boolean;
  // What it is for (Websites, Apps): the systems people use stand in a column per group, in the
  // order the groups first appear.
  group?: string;
  description?: string;
  domain?: string;
  // Where a tap on the system goes: its page, which shows it at level 2.
  href?: string;
}

// A line between two systems, between a system's parts, or from a part to another system.
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
  description?: string;
}

// A flow: ordered steps, each riding one line the data holds toward one of its ends, with a
// sentence and the parts it also touches.
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
// family (what kind of thing it is), which the map turns into a group.
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

// A flow in the model rides its lines by id; the map reads each step as the line's two ends.
export interface ModelFlow {
  id: string;
  name: string;
  description?: string;
  steps: readonly { relationship: string; toward: string; text: string; lights?: readonly string[] }[];
}

export interface SystemModel {
  systems: readonly ModelSystem[];
  relationships: readonly (MapLink & { id?: string })[];
  containers: readonly MapContainer[];
  flows?: readonly ModelFlow[];
}

// The group a system people use stands in, in a stranger's words (Dustin, 2026-10-23: like goes
// with like, and the map should explain itself). An admin MCP stands with its app.
const FAMILY_GROUP: Record<string, string> = { system: "Tools", writing: "Writing", product: "Apps", plumbing: "Tools", site: "Websites" };

/**
 * What the map shows from Capsid's public model, the same on every host: each system with, for
 * what people use, its group, every line, and the parts, in the model's order (which sets the
 * groups' order too), and every flow with each step on the two ends of the line it rides (a step
 * on a line the model lacks is left out). `href` is where a system's card goes.
 */
export function modelMapData(model: SystemModel, href?: (id: string) => string): SystemMapData {
  const lines = new Map(model.relationships.filter((r) => r.id).map((r) => [r.id, r]));
  return {
    systems: model.systems.map((s) => ({
      id: s.id,
      name: s.name,
      short: s.short && s.short !== s.name ? s.short : undefined,
      ring: s.ring,
      private: s.private,
      group: s.ring === "used" ? (FAMILY_GROUP[s.family] ?? s.family) : undefined,
      description: s.description,
      domain: s.domain || undefined,
      href: href?.(s.id),
    })),
    relationships: model.relationships.map(({ from, to, kind }) => ({ from, to, kind })),
    containers: model.containers.map(({ id, system, name, kind, technology, description }) => ({ id, system, name, kind, technology, description })),
    flows: (model.flows ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      steps: f.steps.flatMap((st) => {
        const line = lines.get(st.relationship);
        return line ? [{ from: line.from, to: line.to, toward: st.toward, text: st.text, lights: st.lights }] : [];
      }),
    })),
  };
}

export interface SystemMapOptions {
  // Unique on the page; prefixes every id the map writes.
  id?: string;
  label?: string;
  caption?: string;
  // The bands' headings, and the one column of what people use when none has a group.
  ringNames?: Partial<Record<MapRing, string>>;
  headingLevel?: 2 | 3 | 4;
  // Level 2: the one system shown, its users, its parts and what it uses. Without it, the network.
  system?: string;
  // Level 2: only the parts and the flows, for a host that shows the users and uses itself.
  only?: "inside";
  // Level 2: a flow's step drawn lit, as the script would leave it (steps count from 1).
  flow?: { id: string; step: number };
}

// ---------------------------------------------------------------------------------------
// Reading. Every line is read between the systems that own its ends, so a part's line to another
// system's part counts as the two systems' tie.

// A line in words, read from its `from` end.
export const VERB: Readonly<Record<string, string>> = {
  installs: "installs",
  "publishes-to": "publishes to",
  coordinates: "coordinates",
  watches: "watches",
  reads: "reads",
  writes: "writes to",
  deploys: "deploys",
  serves: "serves",
};
export const verbOf = (kind: string): string => VERB[kind] ?? kind.replace(/-/g, " ");

export const STORE_KINDS: ReadonlySet<string> = new Set(["database", "bucket", "kv", "queue"]);
export const EXTERNAL = "external";
export type PartPlace = "runs" | "stores" | "outside";
/** Where a part stands inside its system: what runs, what stores, and what it works with outside. */
export const placeOf = (kind: string): PartPlace => (kind === EXTERNAL ? "outside" : STORE_KINDS.has(kind) ? "stores" : "runs");

/** The system each system and part belongs to, by id. */
export function ownerOf(data: SystemMapData): Map<string, string> {
  const out = new Map(data.systems.map((s) => [s.id, s.id]));
  for (const c of data.containers ?? []) if (out.has(c.system)) out.set(c.id, c.system);
  return out;
}

export interface Tie {
  id: string;
  // The kinds of line, as words, in the order first met.
  verbs: string[];
}

export interface Ties {
  uses: Tie[];
  usedBy: Tie[];
}

/**
 * Each system's ties to the others: what it uses (lines from it or its parts to another system or
 * that system's parts) and what uses it, each other system once with every verb, in the systems'
 * order.
 */
export function tiesOf(data: SystemMapData): Map<string, Ties> {
  const owner = ownerOf(data);
  const order = new Map(data.systems.map((s, i) => [s.id, i]));
  const raw = new Map(data.systems.map((s) => [s.id, { uses: new Map<string, string[]>(), usedBy: new Map<string, string[]>() }]));
  const add = (m: Map<string, string[]>, id: string, verb: string) => {
    const verbs = m.get(id) ?? [];
    if (!verbs.includes(verb)) verbs.push(verb);
    m.set(id, verbs);
  };
  for (const l of data.relationships ?? []) {
    const a = owner.get(l.from);
    const b = owner.get(l.to);
    if (!a || !b || a === b) continue;
    add(raw.get(a)!.uses, b, verbOf(l.kind));
    add(raw.get(b)!.usedBy, a, verbOf(l.kind));
  }
  const sorted = (m: Map<string, string[]>) => [...m].map(([id, verbs]) => ({ id, verbs })).sort((x, y) => order.get(x.id)! - order.get(y.id)!);
  return new Map([...raw].map(([id, t]) => [id, { uses: sorted(t.uses), usedBy: sorted(t.usedBy) }]));
}

export interface ShownStep {
  text: string;
  toward: string;
  // The parts of the system shown that the step touches: its ends and what it lights.
  lights: string[];
}

export interface ShownFlow {
  id: string;
  name: string;
  description?: string;
  steps: ShownStep[];
}

/**
 * The flows shown on one system's page: those with a step that touches one of its parts, each step
 * lighting the parts of this system it touches. A step that touches none of them is still told.
 */
export function flowsOver(data: SystemMapData, id: string): ShownFlow[] {
  const mine = new Set((data.containers ?? []).filter((c) => c.system === id).map((c) => c.id));
  return (data.flows ?? [])
    .map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      steps: f.steps.map((st) => ({ text: st.text, toward: st.toward, lights: [...new Set([st.from, st.to, ...(st.lights ?? [])])].filter((p) => mine.has(p)) })),
    }))
    .filter((f) => f.steps.some((st) => st.lights.length > 0));
}

/** "1 part", "3 parts". */
export const count = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** What a step's status line says. */
export const stepText = (n: number, total: number): string => `Step ${n} of ${total}`;

// ---------------------------------------------------------------------------------------
// The network's layout. A layered drawing (Sugiyama, Tagawa and Toda 1981), with the layers set by
// what each system is rather than computed: the shared packages stand in the middle lane, since
// nearly every tie runs to or from one of them, and each block of the rest (a group of what people
// use, and the core) stands on the left or the right, whichever leaves the fewest ties crossing
// the middle and the two sides most even. Then the barycenter heuristic orders each lane's
// systems, and each lane's blocks, by where their neighbors stand, which is what keeps the wires
// from crossing.

export type Lane = "left" | "middle" | "right";

export interface NetworkBlock {
  // The group's name, or the ring's for the shared packages and the core.
  name: string;
  ring: MapRing;
  systems: MapSystem[];
}

export interface NetworkLane {
  lane: Lane;
  blocks: NetworkBlock[];
}

const LANE_INDEX: Record<Lane, number> = { left: 0, middle: 1, right: 2 };

/** The pairs of systems tied to each other, each pair once. */
export function tiePairs(data: SystemMapData): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const [id, t] of tiesOf(data)) {
    for (const u of t.uses) {
      const key = id < u.id ? `${id} ${u.id}` : `${u.id} ${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([id, u.id]);
    }
  }
  return out;
}

/**
 * The network's lanes: left, middle (the shared packages) and right, each a list of blocks in
 * the order they stand, each block's systems in order. Pure, so a server lays the map out and the
 * script only draws the wires between the cards where they landed.
 */
export function networkLayout(data: SystemMapData, names: Record<MapRing, string>): NetworkLane[] {
  const pairs = tiePairs(data);
  const used = data.systems.filter((s) => s.ring === "used");
  const blocks: NetworkBlock[] = [...new Set(used.map((s) => s.group ?? names.used))].map((g) => ({ name: g, ring: "used" as MapRing, systems: used.filter((s) => (s.group ?? names.used) === g) }));
  const core = data.systems.filter((s) => s.ring === "core");
  if (core.length) blocks.push({ name: names.core, ring: "core", systems: core });
  const shared = data.systems.filter((s) => s.ring === "shared");
  const blockOf = new Map<string, number>();
  blocks.forEach((b, i) => b.systems.forEach((s) => blockOf.set(s.id, i)));

  // Each block left or right: every assignment is tried (a network has a handful of blocks). A
  // tie that crosses the middle costs most and one inside a lane less, and an uneven pair of sides
  // costs the square of the cards it puts out of balance, since one long side makes the whole
  // drawing tall and its wires steep.
  let best = { cost: Infinity, sides: [] as Lane[] };
  const n = blocks.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const sides = blocks.map((_, i) => ((mask >> i) & 1 ? "right" : "left") as Lane);
    const laneOf = (id: string): Lane => (blockOf.has(id) ? sides[blockOf.get(id)!]! : "middle");
    let cost = 0;
    for (const [a, b] of pairs) {
      const span = Math.abs(LANE_INDEX[laneOf(a)] - LANE_INDEX[laneOf(b)]);
      cost += span === 2 ? 3 : span === 0 ? 1 : 0;
    }
    const count = (side: Lane) => blocks.reduce((k, b, i) => k + (sides[i] === side ? b.systems.length : 0), 0);
    cost += (count("left") - count("right")) ** 2;
    if (n > 1 && (count("left") === 0 || count("right") === 0)) cost += 1000;
    if (cost < best.cost) best = { cost, sides };
  }

  const lanes: NetworkLane[] = [
    { lane: "left", blocks: blocks.filter((_, i) => best.sides[i] === "left").map((b) => ({ ...b, systems: [...b.systems] })) },
    { lane: "middle", blocks: shared.length ? [{ name: names.shared, ring: "shared", systems: [...shared] }] : [] },
    { lane: "right", blocks: blocks.filter((_, i) => best.sides[i] === "right").map((b) => ({ ...b, systems: [...b.systems] })) },
  ];

  // Barycenter sweeps: a system's place is the mean place of its neighbors in the other lanes,
  // each lane's places running 0 to 1 from top to bottom so lanes of different lengths compare.
  // Systems keep their block; blocks move as a whole, by their systems' mean.
  const neighbors = new Map<string, string[]>(data.systems.map((s) => [s.id, []]));
  for (const [a, b] of pairs) {
    neighbors.get(a)?.push(b);
    neighbors.get(b)?.push(a);
  }
  const place = new Map<string, number>();
  const laneId = new Map<string, Lane>();
  const measure = () => {
    for (const l of lanes) {
      const all = l.blocks.flatMap((b) => b.systems);
      all.forEach((s, i) => {
        place.set(s.id, (i + 0.5) / all.length);
        laneId.set(s.id, l.lane);
      });
    }
  };
  measure();
  const bary = (id: string) => {
    const others = (neighbors.get(id) ?? []).filter((o) => laneId.get(o) !== laneId.get(id));
    return others.length ? others.reduce((k, o) => k + place.get(o)!, 0) / others.length : place.get(id)!;
  };
  for (let sweep = 0; sweep < 8; sweep++) {
    const order = sweep % 2 ? [...lanes].reverse() : lanes;
    for (const l of order) {
      for (const b of l.blocks) {
        const at = new Map(b.systems.map((s) => [s.id, bary(s.id)]));
        b.systems.sort((x, y) => at.get(x.id)! - at.get(y.id)!);
      }
      const at = new Map(l.blocks.map((b) => [b, b.systems.reduce((k, s) => k + bary(s.id), 0) / b.systems.length]));
      l.blocks.sort((x, y) => at.get(x)! - at.get(y)!);
      measure();
    }
  }
  return lanes;
}
