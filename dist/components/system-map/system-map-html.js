// The system map's markup: the whole contract as a string, for a server or a static build (system-map.ts).
import { escapeHtml } from "../email/email.js";
import { count, flowsOver, ownerOf, placeOf, tiesOf, verbOf } from "./system-map-data.js";
export { escapeHtml };
const RING_NAMES = { core: "Core", shared: "Shared packages", used: "What people use" };
const PLACE_NAMES = { runs: "Runs", stores: "Stores", outside: "Outside" };
const e = escapeHtml;
const heading = (level, cls, inner, id) => `<h${level} class="${cls}"${id ? ` id="${e(id)}"` : ""}>${inner}</h${level}>`;
const head = (id, label, caption) => `<figcaption class="cap-system-map-head"><span class="cap-system-map-title" id="${e(id)}-title">${e(label)}</span>${caption ? `<p class="cap-system-map-caption">${e(caption)}</p>` : ""}</figcaption>`;
/** A system's name, as a link to its page when it has one. */
// The class keeps the link out of the heading link's arrow cue (css/utilities.css), whose ::after
// would take the card's stretched hit area.
const nameLink = (s) => (s.href ? `<a class="cap-system-map-link" href="${e(s.href)}">${e(s.name)}</a>` : e(s.name));
/**
 * One system as a card on the network: its name (the link, stretched over the card), what it is
 * for, its address, and how many parts it has and systems it uses and is used by. `data-uses` and
 * `data-used-by` carry the ties the script lights.
 */
function card(s, ties, parts, level) {
    const facts = [count(parts, "part"), `uses ${ties.uses.length}`, `used by ${ties.usedBy.length}`].join(" · ");
    const meta = [
        s.domain ? `<span class="cap-system-map-card-domain">${e(s.domain)}</span>` : "",
        s.private ? `<span class="cap-system-map-card-private">private</span>` : "",
        `<span class="cap-system-map-card-count">${facts}</span>`,
    ].join("");
    const ids = (list) => list.map((t) => t.id).join(" ");
    return `<li class="cap-system-map-card" data-id="${e(s.id)}" data-uses="${e(ids(ties.uses))}" data-used-by="${e(ids(ties.usedBy))}"${s.private ? " data-private" : ""}${s.href ? " data-link" : ""}>${heading(level, "cap-system-map-card-name", nameLink(s))}${s.description ? `<p class="cap-system-map-card-text">${e(s.description)}</p>` : ""}<p class="cap-system-map-card-meta">${meta}</p><span class="cap-system-map-card-tie" aria-hidden="true"></span></li>`;
}
/**
 * Level 1, the network: every system a card, the systems people use in a column per group, then
 * a band of the shared packages and one of the core. No lines are drawn: hovering over or
 * focusing a card lights what it uses and what uses it, and a tap opens it.
 */
function networkHtml(data, options) {
    const id = options.id ?? "system-map";
    const label = options.label ?? "System map";
    const names = { ...RING_NAMES, ...options.ringNames };
    const h = options.headingLevel ?? 3;
    const ties = tiesOf(data);
    const parts = new Map();
    for (const c of data.containers ?? [])
        if (c.kind !== "external")
            parts.set(c.system, (parts.get(c.system) ?? 0) + 1);
    const cards = (list) => `<ul class="cap-system-map-cards">${list.map((s) => card(s, ties.get(s.id), parts.get(s.id) ?? 0, h + 1)).join("")}</ul>`;
    const section = (cls, attr, title, list, n) => list.length ? `<section class="${cls}" ${attr} aria-labelledby="${e(id)}-${n}">${heading(h, "cap-system-map-group-name", `${e(title)} <span class="cap-system-map-group-count">${list.length}</span>`, `${id}-${n}`)}${cards(list)}</section>` : "";
    const used = data.systems.filter((s) => s.ring === "used");
    const groups = [...new Set(used.map((s) => s.group ?? names.used))];
    let n = 0;
    const columns = groups.map((g) => section("cap-system-map-group", `data-group="${e(g)}"`, g, used.filter((s) => (s.group ?? names.used) === g), n++)).join("");
    const band = (ring) => section("cap-system-map-band", `data-ring="${ring}"`, names[ring], data.systems.filter((s) => s.ring === ring), n++);
    return [
        `<figure class="cap-system-map" data-cap="system-map" data-level="network" id="${e(id)}" aria-labelledby="${e(id)}-title">`,
        head(id, label, options.caption),
        `<div class="cap-system-map-network">`,
        columns ? `<div class="cap-system-map-groups">${columns}</div>` : "",
        band("shared"),
        band("core"),
        `</div></figure>`,
    ].join("");
}
/** One system in a column of users or uses: its name, linked, and its verbs as text. */
const tieItem = (s, verbs) => `<li class="cap-system-map-tie" data-id="${e(s.id)}"${s.private ? " data-private" : ""}><span class="cap-system-map-tie-name">${nameLink(s)}</span> <span class="cap-system-map-tie-verbs">${e(verbs.join(", "))}</span></li>`;
/**
 * Level 2, one system: who uses it, its parts (what runs, what stores and what it works with
 * outside, each part with its own lines in words), what it uses, and the flows over its parts as
 * ordered steps, which work as a plain list with no script.
 */
function systemHtml(data, options, sid) {
    const s = data.systems.find((x) => x.id === sid);
    if (!s)
        throw new Error(`system-map: no system ${sid}`);
    const id = options.id ?? "system-map";
    const label = options.label ?? s.name;
    const h = options.headingLevel ?? 3;
    const byId = new Map(data.systems.map((x) => [x.id, x]));
    const ties = tiesOf(data).get(sid);
    const containers = data.containers ?? [];
    const nameOf = new Map([...data.systems.map((x) => [x.id, x.name]), ...containers.map((c) => [c.id, c.name])]);
    const owner = ownerOf(data);
    const mine = containers.filter((c) => c.system === sid);
    // A step drawn lit, as the script would leave it.
    const shownFlows = flowsOver(data, sid);
    const lit = options.flow ? shownFlows.find((f) => f.id === options.flow.id)?.steps[options.flow.step - 1] : undefined;
    const litFlow = lit ? options.flow : undefined;
    const part = (c) => {
        const lines = (data.relationships ?? [])
            .filter((l) => l.from === c.id && nameOf.has(l.to))
            .map((l) => `${verbOf(l.kind)} ${nameOf.get(l.to)}${owner.get(l.to) !== sid && !byId.has(l.to) ? ` (${byId.get(owner.get(l.to))?.name ?? ""})` : ""}`);
        const on = lit?.lights.includes(c.id);
        return `<li class="cap-system-map-part" id="${e(id)}-part-${e(c.id)}" data-id="${e(c.id)}" data-place="${placeOf(c.kind)}"${on ? " data-lit" : ""}${on && lit.toward === c.id ? " data-at" : ""}>${heading(h + 2, "cap-system-map-part-name", e(c.name))}${c.technology ? `<p class="cap-system-map-part-kind">${e(c.technology)}</p>` : ""}${c.description ? `<p class="cap-system-map-part-text">${e(c.description)}</p>` : ""}${lines.length ? `<p class="cap-system-map-part-lines">${lines.map((x) => `<span>${e(x)}</span>`).join(" ")}</p>` : ""}</li>`;
    };
    const places = ["runs", "stores", "outside"]
        .map((p) => {
        const list = mine.filter((c) => placeOf(c.kind) === p);
        return list.length ? `<section class="cap-system-map-place" data-place="${p}">${heading(h + 1, "cap-system-map-place-name", PLACE_NAMES[p])}<ul class="cap-system-map-parts">${list.map(part).join("")}</ul></section>` : "";
    })
        .join("");
    const inside = `<section class="cap-system-map-column" data-column="inside" aria-labelledby="${e(id)}-inside">${heading(h, "cap-system-map-column-name", `Inside ${e(s.name)}`, `${id}-inside`)}${places || `<p class="cap-system-map-none">No parts of its own are mapped.</p>`}</section>`;
    const tieColumn = (column, title, list, none) => `<section class="cap-system-map-column" data-column="${column}" aria-labelledby="${e(id)}-${column}">${heading(h, "cap-system-map-column-name", `${title} <span class="cap-system-map-group-count">${list.length}</span>`, `${id}-${column}`)}${list.length ? `<ul class="cap-system-map-ties">${list.map((t) => tieItem(byId.get(t.id), t.verbs)).join("")}</ul>` : `<p class="cap-system-map-none">${none}</p>`}</section>`;
    const columns = options.only === "inside" ? inside : `${tieColumn("used-by", "Used by", ties.usedBy, "No system uses it.")}${inside}${tieColumn("uses", "Uses", ties.uses, "It uses no other system.")}`;
    const flows = shownFlows
        .map((f) => {
        const on = litFlow?.id === f.id;
        const steps = f.steps
            .map((st, i) => `<li data-toward="${e(st.toward)}" data-lights="${e(st.lights.join(" "))}"${on && i + 1 === litFlow.step ? ` aria-current="step"` : ""}>${e(st.text)}</li>`)
            .join("");
        return `<section class="cap-system-map-flow" data-flow="${e(f.id)}" aria-labelledby="${e(id)}-flow-${e(f.id)}">${heading(h + 1, "cap-system-map-flow-name", e(f.name), `${id}-flow-${f.id}`)}${f.description ? `<p class="cap-system-map-flow-text">${e(f.description)}</p>` : ""}<ol class="cap-system-map-steps">${steps}</ol><p class="cap-system-map-flow-controls" data-cap-part="controls" hidden><button type="button" class="cap-btn" data-size="sm" data-cap-part="back">Back</button><button type="button" class="cap-btn" data-size="sm" data-cap-part="next">${on ? "Next" : "Start"}</button><span class="cap-system-map-flow-status" aria-live="polite"></span></p></section>`;
    })
        .join("");
    return [
        `<figure class="cap-system-map" data-cap="system-map" data-level="system" data-system="${e(sid)}" id="${e(id)}" aria-labelledby="${e(id)}-title"${litFlow ? ` data-flow="${e(litFlow.id)}" data-step="${litFlow.step}"` : ""}>`,
        head(id, label, options.caption),
        `<div class="cap-system-map-columns"${options.only ? ` data-only="${options.only}"` : ""}>${columns}</div>`,
        flows ? `<section class="cap-system-map-flows" aria-labelledby="${e(id)}-flows">${heading(h, "cap-system-map-column-name", "Step by step", `${id}-flows`)}${flows}</section>` : "",
        `</figure>`,
    ].join("");
}
/**
 * The map as HTML, every text escaped: the network (level 1), or with `system` one system (level
 * 2). Delivered with no script it is whole: every card is a link, every tie and line is words, and
 * every flow is an ordered list.
 */
export function systemMapHtml(data, options = {}) {
    return options.system ? systemHtml(data, options, options.system) : networkHtml(data, options);
}
