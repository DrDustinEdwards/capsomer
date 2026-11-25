// The media library's tiles: the status glyphs and the markup a tile is drawn from. A tile's facts are
// its data attributes, so the page, the filters and the inspector read one thing.

import { enhance as enhanceMeters, percent } from "../meter/meter.ts";
import {
  describeRecord,
  flagsFor,
  parseTags,
  tileId,
  type AltState,
  type MediaRecord,
  type UsedIn,
} from "./media-record.ts";
import { formatBytes } from "../format/format.ts";
import { glyphEl, statusEl } from "../status/status.ts";

const NS = "http://www.w3.org/2000/svg";

const CHECK_PATH = "M3.5 8.5l3 3 6-7";

function checkBox(): HTMLElement[] {
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

export const part = <T extends HTMLElement = HTMLElement>(root: ParentNode, name: string) =>
  root.querySelector<T>(`[data-cap-part='${name}']`);

// Tiles. A tile's facts are its data attributes, so the page, the filters and the inspector read
// one thing.

export function recordOf(tile: HTMLElement): MediaRecord {
  const d = tile.dataset;
  let used: UsedIn[] = [];
  try {
    const parsed: unknown = JSON.parse(d.usedIn ?? "[]");
    if (Array.isArray(parsed))
      used = parsed.filter(
        (u): u is UsedIn =>
          !!u &&
          typeof u === "object" &&
          typeof (u as UsedIn).title === "string" &&
          typeof (u as UsedIn).href === "string",
      );
  } catch {
    used = [];
  }
  let suggested: string[] = [];
  try {
    const parsed: unknown = JSON.parse(d.suggestedTags ?? "[]");
    if (Array.isArray(parsed)) suggested = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    suggested = [];
  }
  const altState: AltState = d.alt === "decorative" || d.alt === "set" ? d.alt : "missing";
  const img = tile.querySelector<HTMLImageElement>(".cap-media-thumb img");
  const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);
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
    state:
      d.state === "uploading" || d.state === "failed" || d.state === "binned" ? d.state : "ready",
    suggestedTags: suggested,
    progress: num(d.progress),
    error: d.error,
  };
}

// Writes a record's facts onto a tile's attributes (the tile's markup is then redrawn by syncTile).
export function writeRecord(tile: HTMLElement, r: Partial<MediaRecord>): void {
  const d = tile.dataset;
  if (r.key !== undefined) d.key = r.key;
  if (r.name !== undefined) d.label = r.name;
  if (r.url !== undefined) d.url = r.url;
  if (r.kind !== undefined) d.kind = r.kind;
  if (r.type !== undefined) d.type = r.type;
  if (r.bytes !== undefined) d.bytes = String(r.bytes);
  if (r.width !== undefined) d.width = String(r.width);
  if (r.height !== undefined) d.height = String(r.height);
  if (r.uploaded !== undefined) d.uploaded = r.uploaded;
  if (r.altState !== undefined) d.alt = r.altState;
  if (r.alt !== undefined) d.altText = r.alt;
  if (r.title !== undefined) d.title = r.title;
  if (r.caption !== undefined) d.caption = r.caption;
  if (r.tags !== undefined) d.tags = r.tags.join(", ");
  if (r.used !== undefined) {
    d.usedIn = JSON.stringify(r.used);
    d.used = String(r.used.length);
  }
  if (r.state !== undefined) d.state = r.state;
  if (r.suggestedTags !== undefined) d.suggestedTags = JSON.stringify(r.suggestedTags);
  if (r.progress !== undefined) d.progress = String(r.progress);
  if (r.error !== undefined) d.error = r.error;
}

// Redraws what a tile shows from its attributes: the flags, the meta line, the description the
// link carries, and the progress or failure block. The thumbnail and the name are not touched.
export function syncTile(tile: HTMLElement): void {
  const r = recordOf(tile);
  tile.dataset.used = String(r.used.length);
  const open = tile.querySelector<HTMLElement>(".cap-media-open");
  const meta = tile.querySelector<HTMLElement>(".cap-media-meta");
  if (meta)
    meta.textContent =
      r.state === "uploading"
        ? "Uploading"
        : r.state === "failed"
          ? "Not uploaded"
          : [r.type.split("/").pop()?.toUpperCase(), formatBytes(r.bytes)]
              .filter(Boolean)
              .join(" · ");
  let flags = tile.querySelector<HTMLElement>(".cap-media-flags");
  if (!flags) {
    flags = document.createElement("span");
    flags.className = "cap-media-flags";
    flags.id = `${tile.id || `tile-${Math.random().toString(36).slice(2, 8)}`}-flags`;
    tile.append(flags);
  }
  const items: Node[] = flagsFor(r).map((f) => statusEl(f.tone, f.word));
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
    if (flags.id) open.setAttribute("aria-describedby", flags.id);
    if (r.state === "uploading" || r.state === "failed")
      open.setAttribute("aria-description", describeRecord(r));
    else open.removeAttribute("aria-description");
  }
  for (const old of tile.querySelectorAll(".cap-media-state")) old.remove();
  if (r.state === "uploading") {
    const block = document.createElement("div");
    block.className = "cap-media-state";
    const pct = percent(r.progress ?? 0);
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
    // A native progress bar (its role and value the browser's own), styled as the meter's track (meter.css).
    const bar = document.createElement("progress");
    bar.className = "cap-meter-bar";
    bar.max = 100;
    bar.value = pct;
    bar.setAttribute("aria-labelledby", label.id);
    bar.setAttribute("aria-valuetext", `${pct} percent of ${r.name} uploaded`);
    meter.append(label, value, bar);
    block.append(meter);
    tile.append(block);
    enhanceMeters(tile);
  } else if (r.state === "failed") {
    const block = document.createElement("div");
    block.className = "cap-media-state";
    block.dataset.tone = "crit";
    const lead = document.createElement("p");
    lead.className = "cap-media-state-lead";
    lead.append(glyphEl("crit"), document.createTextNode("Upload failed"));
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
export function buildTile(r: MediaRecord): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "cap-media-tile";
  li.id = tileId(r.key);
  writeRecord(li, r);
  li.dataset.used = String(r.used.length);
  const selectable = r.state === "ready" || r.state === "binned";
  const open = selectable ? document.createElement("a") : document.createElement("button");
  open.className = "cap-media-open";
  if (open instanceof HTMLAnchorElement) open.href = `?key=${encodeURIComponent(r.key)}`;
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
  } else {
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

// Moves an uploading tile's progress bar and its spoken description. False when the tile has no bar
// to move, so the caller redraws it whole.
export function showProgress(tile: HTMLElement, progress: number): boolean {
  const bar = tile.querySelector<HTMLProgressElement>("progress.cap-meter-bar");
  if (!bar) return false;
  const pct = percent(progress);
  bar.value = pct;
  bar.setAttribute(
    "aria-valuetext",
    `${pct} percent of ${tile.dataset.label ?? "the file"} uploaded`,
  );
  const value = tile.querySelector<HTMLElement>(".cap-meter-value");
  if (value) value.textContent = `${pct}%`;
  tile
    .querySelector<HTMLElement>(".cap-media-open")
    ?.setAttribute("aria-description", describeRecord({ ...recordOf(tile), progress: pct }));
  return true;
}
