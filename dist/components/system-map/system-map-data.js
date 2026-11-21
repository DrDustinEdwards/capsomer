// The system map's data and the pure reading of it (system-map.ts): who uses whom, a system's
// parts by what they do, and the flows over a system's parts.
// The group a system people use stands in, in a stranger's words (Dustin, 2026-10-23: like goes
// with like, and the map should explain itself). An admin MCP stands with its app.
const FAMILY_GROUP = {
    system: "Tools",
    writing: "Writing",
    product: "Apps",
    plumbing: "Tools",
    site: "Websites",
};
/**
 * What the map shows from Capsid's public model, the same on every host: each system with, for
 * what people use, its group, every line, and the parts, in the model's order (which sets the
 * groups' order too), and every flow with each step on the two ends of the line it rides (a step
 * on a line the model lacks is left out). `href` is where a system's card goes.
 */
export function modelMapData(model, href) {
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
        containers: model.containers.map(({ id, system, name, kind, technology, description }) => ({
            id,
            system,
            name,
            kind,
            technology,
            description,
        })),
        flows: (model.flows ?? []).map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            steps: f.steps.flatMap((st) => {
                const line = lines.get(st.relationship);
                return line
                    ? [{ from: line.from, to: line.to, toward: st.toward, text: st.text, lights: st.lights }]
                    : [];
            }),
        })),
    };
}
// ---------------------------------------------------------------------------------------
// Reading. Every line is read between the systems that own its ends, so a part's line to another
// system's part counts as the two systems' tie.
// A line in words, read from its `from` end.
export const VERB = {
    installs: "installs",
    "publishes-to": "publishes to",
    coordinates: "coordinates",
    watches: "watches",
    reads: "reads",
    writes: "writes to",
    deploys: "deploys",
    serves: "serves",
};
export const verbOf = (kind) => VERB[kind] ?? kind.replace(/-/g, " ");
export const STORE_KINDS = new Set(["database", "bucket", "kv", "queue"]);
export const EXTERNAL = "external";
/** Where a part stands inside its system: what runs, what stores, and what it works with outside. */
export const placeOf = (kind) => kind === EXTERNAL ? "outside" : STORE_KINDS.has(kind) ? "stores" : "runs";
/** The system each system and part belongs to, by id. */
export function ownerOf(data) {
    const out = new Map(data.systems.map((s) => [s.id, s.id]));
    for (const c of data.containers ?? [])
        if (out.has(c.system))
            out.set(c.id, c.system);
    return out;
}
/**
 * Each system's ties to the others: what it uses (lines from it or its parts to another system or
 * that system's parts) and what uses it, each other system once with every verb, in the systems'
 * order.
 */
export function tiesOf(data) {
    const owner = ownerOf(data);
    const order = new Map(data.systems.map((s, i) => [s.id, i]));
    const raw = new Map(data.systems.map((s) => [
        s.id,
        { uses: new Map(), usedBy: new Map() },
    ]));
    const add = (m, id, verb) => {
        const verbs = m.get(id) ?? [];
        if (!verbs.includes(verb))
            verbs.push(verb);
        m.set(id, verbs);
    };
    for (const l of data.relationships ?? []) {
        const a = owner.get(l.from);
        const b = owner.get(l.to);
        if (!a || !b || a === b)
            continue;
        add(raw.get(a).uses, b, verbOf(l.kind));
        add(raw.get(b).usedBy, a, verbOf(l.kind));
    }
    const sorted = (m) => [...m]
        .map(([id, verbs]) => ({ id, verbs }))
        .sort((x, y) => order.get(x.id) - order.get(y.id));
    return new Map([...raw].map(([id, t]) => [id, { uses: sorted(t.uses), usedBy: sorted(t.usedBy) }]));
}
/**
 * The flows shown on one system's page: those with a step that touches one of its parts, each step
 * lighting the parts of this system it touches. A step that touches none of them is still told.
 */
export function flowsOver(data, id) {
    const mine = new Set((data.containers ?? []).filter((c) => c.system === id).map((c) => c.id));
    return (data.flows ?? [])
        .map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        steps: f.steps.map((st) => ({
            text: st.text,
            toward: st.toward,
            lights: [...new Set([st.from, st.to, ...(st.lights ?? [])])].filter((p) => mine.has(p)),
        })),
    }))
        .filter((f) => f.steps.some((st) => st.lights.length > 0));
}
/** "1 part", "3 parts". */
export const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** What a step's status line says. */
export const stepText = (n, total) => `Step ${n} of ${total}`;
const LANE_INDEX = { left: 0, middle: 1, right: 2 };
/** The pairs of systems tied to each other, each pair once. */
export function tiePairs(data) {
    const seen = new Set();
    const out = [];
    for (const [id, t] of tiesOf(data)) {
        for (const u of t.uses) {
            const key = id < u.id ? `${id} ${u.id}` : `${u.id} ${id}`;
            if (seen.has(key))
                continue;
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
export function networkLayout(data, names) {
    const pairs = tiePairs(data);
    const used = data.systems.filter((s) => s.ring === "used");
    const blocks = [...new Set(used.map((s) => s.group ?? names.used))].map((g) => ({
        name: g,
        ring: "used",
        systems: used.filter((s) => (s.group ?? names.used) === g),
    }));
    const core = data.systems.filter((s) => s.ring === "core");
    if (core.length)
        blocks.push({ name: names.core, ring: "core", systems: core });
    const shared = data.systems.filter((s) => s.ring === "shared");
    const blockOf = new Map();
    blocks.forEach((b, i) => b.systems.forEach((s) => blockOf.set(s.id, i)));
    // Each block left or right: every assignment is tried (a network has a handful of blocks). A
    // tie that crosses the middle costs most and one inside a lane less, and an uneven pair of sides
    // costs the square of the cards it puts out of balance, since one long side makes the whole
    // drawing tall and its wires steep.
    let best = { cost: Infinity, sides: [] };
    const n = blocks.length;
    for (let mask = 0; mask < 1 << n; mask++) {
        const sides = blocks.map((_, i) => ((mask >> i) & 1 ? "right" : "left"));
        const laneOf = (id) => (blockOf.has(id) ? sides[blockOf.get(id)] : "middle");
        let cost = 0;
        for (const [a, b] of pairs) {
            const span = Math.abs(LANE_INDEX[laneOf(a)] - LANE_INDEX[laneOf(b)]);
            cost += span === 2 ? 3 : span === 0 ? 1 : 0;
        }
        const count = (side) => blocks.reduce((k, b, i) => k + (sides[i] === side ? b.systems.length : 0), 0);
        cost += (count("left") - count("right")) ** 2;
        if (n > 1 && (count("left") === 0 || count("right") === 0))
            cost += 1000;
        if (cost < best.cost)
            best = { cost, sides };
    }
    const lanes = [
        {
            lane: "left",
            blocks: blocks
                .filter((_, i) => best.sides[i] === "left")
                .map((b) => ({ ...b, systems: [...b.systems] })),
        },
        {
            lane: "middle",
            blocks: shared.length ? [{ name: names.shared, ring: "shared", systems: [...shared] }] : [],
        },
        {
            lane: "right",
            blocks: blocks
                .filter((_, i) => best.sides[i] === "right")
                .map((b) => ({ ...b, systems: [...b.systems] })),
        },
    ];
    // Barycenter sweeps: a system's place is the mean place of its neighbors in the other lanes,
    // each lane's places running 0 to 1 from top to bottom so lanes of different lengths compare.
    // Systems keep their block; blocks move as a whole, by their systems' mean.
    const neighbors = new Map(data.systems.map((s) => [s.id, []]));
    for (const [a, b] of pairs) {
        neighbors.get(a)?.push(b);
        neighbors.get(b)?.push(a);
    }
    const place = new Map();
    const laneId = new Map();
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
    const bary = (id) => {
        const others = (neighbors.get(id) ?? []).filter((o) => laneId.get(o) !== laneId.get(id));
        return others.length
            ? others.reduce((k, o) => k + place.get(o), 0) / others.length
            : place.get(id);
    };
    for (let sweep = 0; sweep < 8; sweep++) {
        const order = sweep % 2 ? [...lanes].reverse() : lanes;
        for (const l of order) {
            for (const b of l.blocks) {
                const at = new Map(b.systems.map((s) => [s.id, bary(s.id)]));
                b.systems.sort((x, y) => at.get(x.id) - at.get(y.id));
            }
            const at = new Map(l.blocks.map((b) => [b, b.systems.reduce((k, s) => k + bary(s.id), 0) / b.systems.length]));
            l.blocks.sort((x, y) => at.get(x) - at.get(y));
            measure();
        }
    }
    return lanes;
}
