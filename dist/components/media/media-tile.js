// The media library's tiles: the status glyphs and the markup a tile is drawn from. A tile's facts are
// its data attributes, so the page, the filters and the inspector read one thing.
import { enhance as enhanceMeters } from "../meter/meter.js";
import { byteSize, describeRecord, flagsFor, parseTags } from "./media-record.js";
const NS = "http://www.w3.org/2000/svg";
const GLYPHS = {
    crit: ["M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"],
    warn: ["M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"],
    ok: ["M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"],
};
// A status glyph, drawn in currentColor: a shape for each meaning, so colour is never alone.
export function glyph(kind) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "cap-status-glyph");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const add = (tag, attrs) => {
        const el = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs))
            el.setAttribute(k, v);
        svg.append(el);
    };
    const paths = GLYPHS[kind];
    if (paths)
        for (const d of paths)
            add("path", { fill: "currentColor", "fill-rule": "evenodd", d });
    else if (kind === "info") {
        add("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", "stroke-width": "1.6" });
        add("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" });
    }
    else if (kind === "nodata") {
        add("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", "stroke-width": "1.6" });
        add("path", { fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", d: "M5 8h6" });
    }
    else {
        add("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", "stroke-width": "1.6", opacity: "0.35" });
        add("path", { fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2" });
    }
    return svg;
}
function statusSpan(tone, word) {
    const span = document.createElement("span");
    span.className = "cap-status";
    span.dataset.tone = tone;
    span.append(glyph(tone), document.createTextNode(word));
    return span;
}
const CHECK_PATH = "M3.5 8.5l3 3 6-7";
function checkBox() {
    const box = document.createElement("span");
    box.className = "cap-media-check-box";
    box.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2.4");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("d", CHECK_PATH);
    svg.append(p);
    box.append(svg);
    const word = document.createElement("span");
    word.className = "cap-media-check-word";
    word.setAttribute("aria-hidden", "true");
    word.textContent = "Selected";
    return [box, word];
}
export const part = (root, name) => root.querySelector(`[data-cap-part='${name}']`);
// ---------------------------------------------------------------------------------------
// Tiles. A tile's facts are its data attributes, so the page, the filters and the inspector read
// one thing.
export function recordOf(tile) {
    const d = tile.dataset;
    let used = [];
    try {
        const parsed = JSON.parse(d.usedIn ?? "[]");
        if (Array.isArray(parsed))
            used = parsed.filter((u) => !!u && typeof u === "object" && typeof u.title === "string" && typeof u.href === "string");
    }
    catch {
        used = [];
    }
    let suggested = [];
    try {
        const parsed = JSON.parse(d.suggestedTags ?? "[]");
        if (Array.isArray(parsed))
            suggested = parsed.filter((t) => typeof t === "string");
    }
    catch {
        suggested = [];
    }
    const altState = d.alt === "decorative" || d.alt === "set" ? d.alt : "missing";
    const img = tile.querySelector(".cap-media-thumb img");
    const num = (v) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);
    return {
        key: d.key ?? "",
        name: d.label ?? d.key ?? "",
        url: d.url ?? "",
        thumb: img?.getAttribute("src") ?? undefined,
        kind: d.kind === "document" ? "document" : "image",
        type: d.type ?? "",
        bytes: num(d.bytes) ?? 0,
        width: num(d.width),
        height: num(d.height),
        uploaded: d.uploaded,
        alt: d.altText ?? "",
        altState,
        title: d.title ?? "",
        caption: d.caption ?? "",
        tags: parseTags(d.tags ?? ""),
        used,
        state: d.state === "uploading" || d.state === "failed" || d.state === "binned" ? d.state : "ready",
        suggestedTags: suggested,
        progress: num(d.progress),
        error: d.error,
    };
}
// Writes a record's facts onto a tile's attributes (the tile's markup is then redrawn by syncTile).
export function writeRecord(tile, r) {
    const d = tile.dataset;
    if (r.key !== undefined)
        d.key = r.key;
    if (r.name !== undefined)
        d.label = r.name;
    if (r.url !== undefined)
        d.url = r.url;
    if (r.kind !== undefined)
        d.kind = r.kind;
    if (r.type !== undefined)
        d.type = r.type;
    if (r.bytes !== undefined)
        d.bytes = String(r.bytes);
    if (r.width !== undefined)
        d.width = String(r.width);
    if (r.height !== undefined)
        d.height = String(r.height);
    if (r.uploaded !== undefined)
        d.uploaded = r.uploaded;
    if (r.altState !== undefined)
        d.alt = r.altState;
    if (r.alt !== undefined)
        d.altText = r.alt;
    if (r.title !== undefined)
        d.title = r.title;
    if (r.caption !== undefined)
        d.caption = r.caption;
    if (r.tags !== undefined)
        d.tags = r.tags.join(", ");
    if (r.used !== undefined) {
        d.usedIn = JSON.stringify(r.used);
        d.used = String(r.used.length);
    }
    if (r.state !== undefined)
        d.state = r.state;
    if (r.suggestedTags !== undefined)
        d.suggestedTags = JSON.stringify(r.suggestedTags);
    if (r.progress !== undefined)
        d.progress = String(r.progress);
    if (r.error !== undefined)
        d.error = r.error;
}
// Redraws what a tile shows from its attributes: the flags, the meta line, the description the
// link carries, and the progress or failure block. The thumbnail and the name are not touched.
export function syncTile(tile) {
    const r = recordOf(tile);
    tile.dataset.used = String(r.used.length);
    const open = tile.querySelector(".cap-media-open");
    const meta = tile.querySelector(".cap-media-meta");
    if (meta)
        meta.textContent = r.state === "uploading" ? "Uploading" : r.state === "failed" ? "Not uploaded" : [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes)].filter(Boolean).join(" · ");
    let flags = tile.querySelector(".cap-media-flags");
    if (!flags) {
        flags = document.createElement("span");
        flags.className = "cap-media-flags";
        flags.id = `${tile.id || `tile-${Math.random().toString(36).slice(2, 8)}`}-flags`;
        tile.append(flags);
    }
    const items = flagsFor(r).map((f) => statusSpan(f.tone, f.word));
    if (r.state === "binned") {
        const restore = document.createElement("button");
        restore.type = "button";
        restore.className = "cap-btn";
        restore.dataset.size = "xs";
        restore.dataset.capPart = "restore";
        restore.append("Restore");
        const sr = document.createElement("span");
        sr.className = "cap-sr-only";
        sr.textContent = ` ${r.name}`;
        restore.append(sr);
        items.push(restore);
    }
    flags.replaceChildren(...items);
    if (open) {
        if (flags.id)
            open.setAttribute("aria-describedby", flags.id);
        if (r.state === "uploading" || r.state === "failed")
            open.setAttribute("aria-description", describeRecord(r));
        else
            open.removeAttribute("aria-description");
    }
    for (const old of tile.querySelectorAll(".cap-media-state"))
        old.remove();
    if (r.state === "uploading") {
        const block = document.createElement("div");
        block.className = "cap-media-state";
        const pct = Math.max(0, Math.min(100, Math.round(r.progress ?? 0)));
        const meter = document.createElement("div");
        meter.className = "cap-meter";
        meter.dataset.cap = "meter";
        const label = document.createElement("span");
        label.className = "cap-meter-label";
        label.id = `${flags.id}-p`;
        label.textContent = "Uploading";
        const value = document.createElement("span");
        value.className = "cap-meter-value";
        value.textContent = `${pct}%`;
        const bar = document.createElement("span");
        bar.className = "cap-meter-bar";
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-labelledby", label.id);
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        bar.setAttribute("aria-valuenow", String(pct));
        bar.setAttribute("aria-valuetext", `${pct} percent of ${r.name} uploaded`);
        const fill = document.createElement("span");
        fill.className = "cap-meter-fill";
        bar.append(fill);
        meter.append(label, value, bar);
        block.append(meter);
        tile.append(block);
        enhanceMeters(tile);
    }
    else if (r.state === "failed") {
        const block = document.createElement("div");
        block.className = "cap-media-state";
        block.dataset.tone = "crit";
        const lead = document.createElement("p");
        lead.className = "cap-media-state-lead";
        lead.append(glyph("crit"), document.createTextNode("Upload failed"));
        const why = document.createElement("p");
        why.className = "cap-media-reason";
        why.textContent = r.error ?? "The server did not say why.";
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "cap-btn";
        retry.dataset.size = "sm";
        retry.dataset.capPart = "retry";
        retry.append("Retry");
        const sr = document.createElement("span");
        sr.className = "cap-sr-only";
        sr.textContent = ` uploading ${r.name}`;
        retry.append(sr);
        block.append(lead, why, retry);
        tile.append(block);
    }
}
// Builds a tile for a record, as the server would render it. Used for uploads and anything the
// page adds after it loaded.
export function buildTile(r) {
    const li = document.createElement("li");
    li.className = "cap-media-tile";
    li.id = `tile-${r.key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
    writeRecord(li, r);
    li.dataset.used = String(r.used.length);
    const selectable = r.state === "ready" || r.state === "binned";
    const open = selectable ? document.createElement("a") : document.createElement("button");
    open.className = "cap-media-open";
    if (open instanceof HTMLAnchorElement)
        open.href = `?key=${encodeURIComponent(r.key)}`;
    else {
        open.type = "button";
        open.setAttribute("aria-disabled", "true");
    }
    const thumb = document.createElement("span");
    thumb.className = "cap-media-thumb";
    if (r.kind === "image" && r.thumb) {
        const img = document.createElement("img");
        img.src = r.thumb;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.width = 320;
        img.height = 320;
        thumb.append(img);
    }
    else {
        const doc = document.createElement("span");
        doc.className = "cap-media-doc";
        doc.setAttribute("aria-hidden", "true");
        doc.textContent = (r.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase();
        thumb.append(doc);
    }
    const name = document.createElement("span");
    name.className = "cap-media-name";
    name.title = r.key;
    name.textContent = r.name;
    const meta = document.createElement("span");
    meta.className = "cap-media-meta";
    open.append(thumb, name, meta);
    li.append(open);
    if (selectable) {
        const check = document.createElement("label");
        check.className = "cap-media-check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = r.key;
        input.dataset.capSelect = "";
        input.setAttribute("aria-label", `Select ${r.name}`);
        check.append(input, ...checkBox());
        li.append(check);
    }
    syncTile(li);
    return li;
}
