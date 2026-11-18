// The system map's markup: the whole contract as a string, for a server or a static build (system-map.ts).
import { escapeHtml } from "@dustinedwards/site-runtime/html";
import { hexLayout, hexSvg } from "./system-map-hex.js";
import { count, flowsOver, networkLayout, ownerOf, placeOf, tiesOf, verbOf, } from "./system-map-data.js";
const RING_NAMES = {
    core: "Core",
    shared: "Shared packages",
    used: "What people use",
};
const PLACE_NAMES = {
    runs: "Runs",
    stores: "Stores",
    outside: "Outside",
};
const e = escapeHtml;
const heading = (level, cls, inner, id) => `<h${level} class="${cls}"${id ? ` id="${e(id)}"` : ""}>${inner}</h${level}>`;
const head = (id, label, caption) => `<figcaption class="cap-system-map-head"><span class="cap-system-map-title" id="${e(id)}-title">${e(label)}</span>${caption ? `<p class="cap-system-map-caption">${e(caption)}</p>` : ""}</figcaption>`;
/** A system's name, as a link to its page when it has one. */
// The class keeps the link out of the heading link's arrow cue (css/utilities.css), whose ::after
// would take the card's stretched hit area.
const nameLink = (s) => s.href ? `<a class="cap-system-map-link" href="${e(s.href)}">${e(s.name)}</a>` : e(s.name);
/**
 * One system as a card on the network, small enough that the whole network fits on one screen:
 * its short name (the link, stretched over the card) and, in words a screen reader reads but the
 * card does not show, its full name, what it is for, its address, and how many parts it has and
 * systems it uses and is used by. Pointing at the card, or focusing it, shows those words in the
 * map's detail line. `data-uses` and `data-used-by` carry the ties the script lights.
 */
function card(s, ties, parts, level) {
    const facts = [
        count(parts, "part"),
        `uses ${ties.uses.length}`,
        `used by ${ties.usedBy.length}`,
    ].join(" · ");
    const meta = [
        s.domain ? `<span class="cap-system-map-card-domain">${e(s.domain)}</span>` : "",
        s.private ? `<span class="cap-system-map-card-private">private</span>` : "",
        `<span class="cap-system-map-card-count">${facts}</span>`,
    ]
        .filter(Boolean)
        .join(" ");
    const ids = (list) => list.map((t) => t.id).join(" ");
    const all = [...new Set([...ties.uses, ...ties.usedBy].map((t) => t.id))].join(" ");
    const shown = { ...s, name: s.short ?? s.name };
    const about = `<span class="cap-system-map-card-about"><span class="cap-system-map-card-full">${e(s.name)}</span>${s.description ? ` <span class="cap-system-map-card-text">${e(s.description)}</span>` : ""} <span class="cap-system-map-card-meta">${meta}</span></span>`;
    return `<li class="cap-system-map-card" data-id="${e(s.id)}" data-wire="${e(s.id)}" data-wires="${e(all)}" data-uses="${e(ids(ties.uses))}" data-used-by="${e(ids(ties.usedBy))}"${s.private ? " data-private" : ""}${s.href ? " data-link" : ""}>${heading(level, "cap-system-map-card-name", nameLink(shown))}${about}<span class="cap-system-map-card-tie" aria-hidden="true"></span></li>`;
}
/**
 * Level 1, the network, as a layered drawing (networkLayout): three lanes side by side, the shared
 * packages in the middle and each block of the rest on the side that leaves the fewest crossings,
 * every block's systems ordered so their ties cross least. The cards are the markup; the script
 * draws a wire for each tie between the cards where they landed, and lights a card's wires when it
 * is pointed at or focused. A tap opens the system.
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
    let n = 0;
    const block = (b) => {
        const attr = b.ring === "used"
            ? `class="cap-system-map-group" data-group="${e(b.name)}"`
            : `class="cap-system-map-band" data-ring="${b.ring}"`;
        const k = n++;
        return `<section ${attr} aria-labelledby="${e(id)}-${k}">${heading(h, "cap-system-map-group-name", `${e(b.name)} <span class="cap-system-map-group-count">${b.systems.length}</span>`, `${id}-${k}`)}${cards(b.systems)}</section>`;
    };
    const lanes = networkLayout(data, names)
        .filter((l) => l.blocks.length)
        .map((l) => `<div class="cap-system-map-lane" data-lane="${l.lane}">${l.blocks.map(block).join("")}</div>`)
        .join("");
    return [
        `<figure class="cap-system-map" data-cap="system-map" data-level="network" id="${e(id)}" aria-labelledby="${e(id)}-title">`,
        head(id, label, options.caption),
        `<p class="cap-system-map-detail" data-cap-part="detail" aria-hidden="true" hidden></p>`,
        // Two views of one network as tabs (components/tabs): the hexagons first. With no script both
        // panels show, one after the other, and the tab list stays hidden.
        `<div class="cap-tabs cap-system-map-views" data-cap="tabs">`,
        `<div class="cap-tabs-list cap-system-map-switch" data-size="sm" role="tablist" aria-label="${e(label)}: view" hidden>`,
        `<button type="button" class="cap-tab" role="tab" id="${e(id)}-tab-hex" aria-selected="true" aria-controls="${e(id)}-hex" tabindex="0">Hexagons</button>`,
        `<button type="button" class="cap-tab" role="tab" id="${e(id)}-tab-plain" aria-selected="false" aria-controls="${e(id)}-plain" tabindex="-1">Plain map</button>`,
        `</div>`,
        `<div class="cap-tabs-panel cap-system-map-hex" role="tabpanel" id="${e(id)}-hex" aria-labelledby="${e(id)}-tab-hex">${hexSvg(data, hexLayout(data, (s) => s.group ?? names.used), `${id}-title`)}</div>`,
        `<div class="cap-tabs-panel cap-system-map-network" role="tabpanel" id="${e(id)}-plain" aria-labelledby="${e(id)}-tab-plain"><div class="cap-system-map-graph">${lanes}</div></div>`,
        `</div>`,
        `</figure>`,
    ].join("");
}
/** One system in a column of users or uses: its name, linked, and its verbs as text. */
const tieItem = (s, verbs, key, wires) => `<li class="cap-system-map-tie" data-id="${e(s.id)}"${wireAttrs(key, wires)}${s.private ? " data-private" : ""}><span class="cap-system-map-tie-name">${nameLink(s)}</span> <span class="cap-system-map-tie-verbs">${e(verbs.join(", "))}</span></li>`;
const wireAttrs = (key, wires) => wires.has(key) ? ` data-wire="${e(key)}" data-wires="${e([...wires.get(key)].join(" "))}"` : "";
function wiresOf(data, sid) {
    const owner = ownerOf(data);
    const mine = new Set((data.containers ?? []).filter((c) => c.system === sid).map((c) => c.id));
    const out = new Map();
    const add = (a, b) => {
        if (a === b)
            return;
        out.set(a, (out.get(a) ?? new Set()).add(b));
        out.set(b, (out.get(b) ?? new Set()).add(a));
    };
    const ours = (x) => mine.has(x) || x === sid;
    for (const l of data.relationships ?? []) {
        if (!ours(l.from) && !ours(l.to))
            continue;
        const end = (x, other, from) => {
            if (mine.has(x))
                return x;
            if (x === sid)
                return ours(other) ? null : "self";
            const o = owner.get(x);
            if (!o || o === sid)
                return null;
            return from ? `used-by:${o}` : `uses:${o}`;
        };
        const a = end(l.from, l.to, true);
        const b = end(l.to, l.from, false);
        if (a && b)
            add(a, b);
    }
    return out;
}
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
    const nameOf = new Map([
        ...data.systems.map((x) => [x.id, x.name]),
        ...containers.map((c) => [c.id, c.name]),
    ]);
    const owner = ownerOf(data);
    const mine = containers.filter((c) => c.system === sid);
    const wires = wiresOf(data, sid);
    // A step drawn lit, as the script would leave it.
    const shownFlows = flowsOver(data, sid);
    const lit = options.flow
        ? shownFlows.find((f) => f.id === options.flow.id)?.steps[options.flow.step - 1]
        : undefined;
    const litFlow = lit ? options.flow : undefined;
    const part = (c) => {
        const lines = (data.relationships ?? [])
            .filter((l) => l.from === c.id && nameOf.has(l.to))
            .map((l) => `${verbOf(l.kind)} ${nameOf.get(l.to)}${owner.get(l.to) !== sid && !byId.has(l.to) ? ` (${byId.get(owner.get(l.to))?.name ?? ""})` : ""}`);
        const on = lit?.lights.includes(c.id);
        return `<li class="cap-system-map-part" id="${e(id)}-part-${e(c.id)}" data-id="${e(c.id)}" data-place="${placeOf(c.kind)}" tabindex="0"${wireAttrs(c.id, wires)}${on ? " data-lit" : ""}${on && lit.toward === c.id ? " data-at" : ""}>${heading(h + 2, "cap-system-map-part-name", e(c.name))}${c.technology ? `<p class="cap-system-map-part-kind">${e(c.technology)}</p>` : ""}${c.description || lines.length ? `<span class="cap-system-map-part-about"><span class="cap-system-map-part-full">${e(c.name)}</span>${c.description ? ` <span class="cap-system-map-part-text">${e(c.description)}</span>` : ""}${lines.length ? ` <span class="cap-system-map-part-lines">${lines.map((x) => `<span>${e(x)}</span>`).join(" ")}</span>` : ""}</span>` : ""}</li>`;
    };
    const placeCount = ["runs", "stores", "outside"].filter((p) => mine.some((c) => placeOf(c.kind) === p)).length;
    const places = ["runs", "stores", "outside"]
        .map((p) => {
        const list = mine.filter((c) => placeOf(c.kind) === p);
        return list.length
            ? `<section class="cap-system-map-place" data-place="${p}">${heading(h + 1, "cap-system-map-place-name", PLACE_NAMES[p])}<ul class="cap-system-map-parts">${list.map(part).join("")}</ul></section>`
            : "";
    })
        .join("");
    const inside = `<section class="cap-system-map-column" data-column="inside" data-places="${Math.max(1, placeCount)}" aria-labelledby="${e(id)}-inside">${heading(h, "cap-system-map-column-name", `<span${wireAttrs("self", wires)}>Inside ${e(s.name)}</span>`, `${id}-inside`)}${places || `<p class="cap-system-map-none">No parts of its own are mapped.</p>`}</section>`;
    const tieColumn = (column, title, list, none) => `<section class="cap-system-map-column" data-column="${column}" aria-labelledby="${e(id)}-${column}">${heading(h, "cap-system-map-column-name", `${title} <span class="cap-system-map-group-count">${list.length}</span>`, `${id}-${column}`)}${list.length ? `<ul class="cap-system-map-ties">${list.map((t) => tieItem(byId.get(t.id), t.verbs, `${column}:${t.id}`, wires)).join("")}</ul>` : `<p class="cap-system-map-none">${none}</p>`}</section>`;
    const columns = options.only === "inside"
        ? inside
        : `${tieColumn("used-by", "Used by", ties.usedBy, "No system uses it.")}${inside}${tieColumn("uses", "Uses", ties.uses, "It uses no other system.")}`;
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
        `<p class="cap-system-map-detail" data-cap-part="detail" aria-hidden="true" hidden></p>`,
        `<div class="cap-system-map-columns"${options.only ? ` data-only="${options.only}"` : ""}>${columns}</div>`,
        flows
            ? `<section class="cap-system-map-flows" aria-labelledby="${e(id)}-flows">${heading(h, "cap-system-map-column-name", "Step by step", `${id}-flows`)}${flows}</section>`
            : "",
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
