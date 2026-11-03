// The system map's data and the pure reading of it (system-map.ts): who uses whom, a system's
// parts by what they do, and the flows over a system's parts.
// The group a system people use stands in, in a stranger's words (Dustin, 2026-10-23: like goes
// with like, and the map should explain itself). An admin MCP stands with its app.
const FAMILY_GROUP = { system: "Tools", writing: "Writing", product: "Apps", plumbing: "Tools", site: "Websites" };
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
export const placeOf = (kind) => (kind === EXTERNAL ? "outside" : STORE_KINDS.has(kind) ? "stores" : "runs");
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
    const raw = new Map(data.systems.map((s) => [s.id, { uses: new Map(), usedBy: new Map() }]));
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
    const sorted = (m) => [...m].map(([id, verbs]) => ({ id, verbs })).sort((x, y) => order.get(x.id) - order.get(y.id));
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
        steps: f.steps.map((st) => ({ text: st.text, toward: st.toward, lights: [...new Set([st.from, st.to, ...(st.lights ?? [])])].filter((p) => mine.has(p)) })),
    }))
        .filter((f) => f.steps.some((st) => st.lights.length > 0));
}
/** "1 part", "3 parts". */
export const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** What a step's status line says. */
export const stepText = (n, total) => `Step ${n} of ${total}`;
