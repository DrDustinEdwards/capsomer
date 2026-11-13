// Capsid's public system model: the one schema every reader checks it against (the explorer's
// build, every site's /systems pages, the refresh script), the cross-checks the shape cannot say,
// and the model in Markdown for a page's machine-readable twin. Capsid writes the model from its
// own source schema (src/system-model.ts); this is what it publishes. Server and build only: it
// needs zod, which the map's page bundle does not.
import { z } from "zod";
import { VERB } from "./system-map-data.js";
export const SYSTEM_FAMILIES = ["system", "writing", "product", "plumbing", "site"];
export const SYSTEM_RINGS = ["core", "shared", "used"];
export const RELATIONSHIP_KINDS = [
    "installs",
    "publishes-to",
    "coordinates",
    "watches",
    "reads",
    "writes",
    "deploys",
    "serves",
];
export const CONTAINER_KINDS = [
    "worker",
    "database",
    "bucket",
    "kv",
    "queue",
    "cron",
    "package",
    "site",
    "external",
];
// Kebab case with no leading, trailing or doubled hyphen: the producer's rule, so nothing Capsid
// publishes is refused and nothing it would refuse is read.
const Id = z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const Text = (max) => z.string().min(1).max(max);
const OpenSystem = z.strictObject({
    id: Id,
    name: Text(40),
    short: Text(12),
    family: z.enum(SYSTEM_FAMILIES),
    ring: z.enum(SYSTEM_RINGS),
    private: z.literal(false),
    description: Text(280).optional(),
    domain: Text(253).optional(),
    repos: z.array(z.url().max(512)).optional(),
});
// A private system is everything a public one is but its repo link.
const PrivateSystem = OpenSystem.omit({ repos: true }).extend({ private: z.literal(true) });
export const PublicModelSchema = z.strictObject({
    version: z.literal(1),
    as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    systems: z.array(z.union([PrivateSystem, OpenSystem])),
    containers: z.array(z.strictObject({
        id: Id,
        system: Id,
        name: Text(40),
        kind: z.enum(CONTAINER_KINDS),
        technology: Text(60),
        description: Text(280).optional(),
    })),
    relationships: z.array(z.strictObject({
        id: Text(200),
        from: Id,
        to: Id,
        kind: z.enum(RELATIONSHIP_KINDS),
        title: Text(280).optional(),
    })),
    // Walks the explorer animates. Optional, so a model written before flows existed still parses.
    flows: z
        .array(z.strictObject({
        id: Id,
        name: Text(60),
        description: Text(280).optional(),
        steps: z
            .array(z.strictObject({
            relationship: Text(200),
            toward: Id,
            text: Text(280),
            lights: z.array(Id).max(8).optional(),
        }))
            .min(2)
            .max(20),
    }))
        .optional(),
    counts: z.strictObject({
        systems: z.number().int(),
        public: z.number().int(),
        private: z.number().int(),
        containers: z.number().int(),
        relationships: z.number().int(),
    }),
});
// The model, or every reason it is refused. Beyond the shape: ids are unique, every container and
// line names something that exists, every flow rides lines the model has toward one of their ends
// and lights parts of the systems it runs in, and the counts match.
export function parsePublicModel(raw) {
    const parsed = PublicModelSchema.safeParse(raw);
    if (!parsed.success)
        return {
            ok: false,
            problems: parsed.error.issues.map((i) => `${i.path.join(".") || "(model)"}: ${i.message}`),
        };
    const model = parsed.data;
    const problems = [];
    const systems = new Map(model.systems.map((s) => [s.id, s]));
    const containers = new Map(model.containers.map((c) => [c.id, c]));
    if (systems.size !== model.systems.length)
        problems.push("systems: an id is used twice");
    if (containers.size !== model.containers.length)
        problems.push("containers: an id is used twice");
    for (const c of model.containers)
        if (!systems.has(c.system))
            problems.push(`containers.${c.id}: no system ${c.system}`);
    for (const r of model.relationships)
        for (const end of [r.from, r.to])
            if (!systems.has(end) && !containers.has(end))
                problems.push(`relationships.${r.id}: no element ${end}`);
    const edges = new Map(model.relationships.map((r) => [r.id, r]));
    const flowIds = new Set();
    for (const flow of model.flows ?? []) {
        if (flowIds.has(flow.id))
            problems.push(`flows.${flow.id}: the id is used twice`);
        flowIds.add(flow.id);
        flow.steps.forEach((step, i) => {
            const where = `flows.${flow.id}.steps.${i + 1}`;
            const edge = edges.get(step.relationship);
            if (!edge) {
                problems.push(`${where}: rides ${step.relationship}, which is not a relationship in the model`);
                return;
            }
            if (step.toward !== edge.from && step.toward !== edge.to)
                problems.push(`${where}: goes toward ${step.toward}, which is not an end of ${edge.id}`);
            const within = new Set([edge.from, edge.to].map((end) => containers.get(end)?.system ?? end));
            for (const light of step.lights ?? []) {
                const part = containers.get(light);
                if (!part)
                    problems.push(`${where}: lights ${light}, which is not a container`);
                else if (!within.has(part.system))
                    problems.push(`${where}: lights ${light}, a part of ${part.system}, which the step does not run in`);
            }
        });
    }
    const privates = model.systems.filter((s) => "private" in s && s.private).length;
    const c = model.counts;
    if (c.systems !== model.systems.length ||
        c.private !== privates ||
        c.public !== model.systems.length - privates ||
        c.containers !== model.containers.length ||
        c.relationships !== model.relationships.length)
        problems.push("counts: do not match the systems");
    return problems.length ? { ok: false, problems } : { ok: true, model };
}
// Two models say the same thing when only the day they were read differs.
export function sameModel(a, b) {
    const { as_of: _a, ...left } = a;
    const { as_of: _b, ...right } = b;
    return JSON.stringify(left) === JSON.stringify(right);
}
// The Capsid explorer, where every system has its own page.
export const EXPLORER_ORIGIN = "https://capsid.dustinedwards.info";
// A system's page in the explorer (or the explorer itself with no id): "/s/<id>/", and its
// "containers" or "code" page with `sub`.
export function explorerHref(id, options = {}) {
    const origin = (options.origin ?? EXPLORER_ORIGIN).replace(/\/$/, "");
    if (!id)
        return `${origin}/`;
    return `${origin}/s/${encodeURIComponent(id)}/${options.sub ? `${options.sub}/` : ""}`;
}
// The address as a person reads it in a link's text: "capsid.dustinedwards.info/s/carrel".
export function explorerLabel(id, origin = EXPLORER_ORIGIN) {
    return `${new URL(origin).host}/s/${id}`;
}
// A line read from its `to` end: "is written to by".
export const VERB_INWARD = {
    installs: "is installed by",
    "publishes-to": "is published to by",
    coordinates: "is coordinated by",
    watches: "is watched by",
    reads: "is read by",
    writes: "is written to by",
    deploys: "is deployed by",
    serves: "is served by",
};
// The lines between this system and other systems (not their parts), in the model's order.
export function connectionsOf(model, id) {
    const names = new Map(model.systems.map((s) => [s.id, s.name]));
    const out = [];
    for (const r of model.relationships) {
        if (r.from === r.to || !names.has(r.from) || !names.has(r.to))
            continue;
        const outward = r.from === id;
        if (!outward && r.to !== id)
            continue;
        const other = outward ? r.to : r.from;
        const verb = outward ? (VERB[r.kind] ?? r.kind) : (VERB_INWARD[r.kind] ?? r.kind);
        out.push({
            verb: verb.charAt(0).toUpperCase() + verb.slice(1),
            other,
            name: names.get(other),
        });
    }
    return out;
}
// A system's own parts (not the outside things it works with), and the outside things.
export const partsOf = (model, id) => model.containers.filter((c) => c.system === id && c.kind !== "external");
export const outsideOf = (model, id) => model.containers.filter((c) => c.system === id && c.kind === "external");
// The lines inside one system, as sentences: "Worker writes to Database". A line between two
// outside things is left out.
export function wiresOf(model, id) {
    const own = new Map(model.containers.filter((c) => c.system === id).map((c) => [c.id, c]));
    return model.relationships.flatMap((r) => {
        const from = own.get(r.from);
        const to = own.get(r.to);
        if (!from || !to || (from.kind === "external" && to.kind === "external"))
            return [];
        return [`${from.name} ${VERB[r.kind] ?? r.kind} ${to.name}`];
    });
}
const containerLine = (c) => `${c.name} (${c.technology})${c.description ? `: ${c.description}` : ""}`;
// One system as a Markdown section: what it is, its addresses, its parts, how they connect and
// the systems it ties to. Null for an id the model does not have (the page answers 404).
export function systemMarkdown(model, id, o, level = 3) {
    const s = model.systems.find((x) => x.id === id);
    if (!s)
        return null;
    const isPrivate = "private" in s && s.private === true;
    const h = "#".repeat(level);
    const summary = [s.description, isPrivate ? (o.privateNote ?? "Its repo is private.") : ""]
        .filter(Boolean)
        .join(" ");
    const repo = !isPrivate && "repos" in s ? s.repos?.[0] : undefined;
    const lines = [
        `${h} ${s.name}${isPrivate ? " (private)" : ""}`,
        "",
        ...(summary ? [summary, ""] : []),
        `- Its page: ${o.origin}${o.pageHref(s.id)}`,
        ...(s.domain ? [`- Address: https://${s.domain}`] : []),
        ...(repo ? [`- Source: ${repo}`] : []),
        `- In the Capsid explorer: ${explorerHref(s.id, { origin: o.explorerOrigin })}`,
    ];
    const parts = partsOf(model, s.id);
    const outside = outsideOf(model, s.id);
    const wires = wiresOf(model, s.id);
    if (parts.length)
        lines.push("", `${h}# Inside`, "", ...parts.map((c) => `- ${containerLine(c)}`));
    if (outside.length)
        lines.push("", `${h}# Outside it`, "", ...outside.map((c) => `- ${containerLine(c)}`));
    if (wires.length)
        lines.push("", "How they connect:", "", ...wires.map((w) => `- ${w}`));
    const ties = connectionsOf(model, s.id);
    lines.push("", `${h}# Connections`, "", ...(ties.length
        ? ties.map((t) => `- ${t.verb} [${t.name}](${o.origin}${o.pageHref(t.other)})`)
        : ["No connections."]));
    return lines.join("\n");
}
// The whole model as Markdown: the title, the intro, then each ring's systems in model order.
export function modelMarkdown(model, o) {
    const rings = { core: "Core", shared: "Shared", used: "Used", ...o.rings };
    const out = [`# ${o.title ?? "Systems"}`, ""];
    if (o.intro)
        out.push(o.intro, "");
    for (const ring of SYSTEM_RINGS) {
        const inRing = model.systems.filter((s) => s.ring === ring);
        if (inRing.length === 0)
            continue;
        out.push(`## ${rings[ring]}`, "");
        for (const s of inRing)
            out.push(systemMarkdown(model, s.id, o) ?? "", "");
    }
    out.push(`Capsid explorer: ${explorerHref(undefined, { origin: o.explorerOrigin })}`);
    return out.join("\n");
}
