// The media library's behaviour: a grid of tiles with roving focus and two-dimensional arrow keys,
// selection by real checkboxes, an inspector that sits beside the grid (a pane) or over it (a
// side sheet) and SAVES BY ITSELF, the copy button, the filters, search, the bin and Restore.
// Extracted from the site admin's media-keyboard.tsx and tile-nav.mjs (the arrow keys read the
// rendered boxes, not a column count), media-grid.tsx, media-tile.tsx, media-inspector*.tsx,
// copy-button.tsx, media-facets.tsx and lib/media/usage.mjs (the three-way alt state, the copy
// snippets, "unattached is not unused"); rewritten for Capsomer: the site's inspector was a form
// with Save buttons; this one saves after typing stops, with a live status that never loses
// typed text. No framework; the React wrapper uses the same pure functions.

import { enhance as enhanceMeters } from "../meter/meter.ts";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { fail, say } from "../message/message.ts";
import { performBulk, type BulkHandler, type BulkItem } from "../bulk-bar/bulk-bar.ts";

const READY = "data-cap-ready";

// ---------------------------------------------------------------------------------------
// The records, pure.

export type AltState = "missing" | "decorative" | "set";
export type TileState = "ready" | "uploading" | "failed" | "binned";

export interface UsedIn {
  title: string;
  href: string;
  // How the post uses it: "image in the body", "cover".
  how?: string;
}

export interface MediaRecord {
  key: string;
  name: string;
  url: string;
  thumb?: string;
  kind: "image" | "document";
  type: string;
  bytes: number;
  width?: number;
  height?: number;
  uploaded?: string;
  alt: string;
  altState: AltState;
  title: string;
  caption: string;
  tags: string[];
  used: UsedIn[];
  state: TileState;
  suggestedTags?: string[];
  progress?: number;
  error?: string;
}

// What the inspector edits.
export interface MediaFields {
  alt: string;
  decorative: boolean;
  title: string;
  caption: string;
  tags: string[];
}

// Decimal unit names, binary division: the site's own rule, so a size reads the same on both.
export function byteSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const LARGE_BYTES = 1024 * 1024;

// "foxhound-hero.jpg" gives "foxhound hero": offered as alt text, never applied (alt text nobody
// read is worse than a visibly empty field).
export function suggestedAlt(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

// The state of a file's alt text. Missing and decorative are different: missing is a to-do,
// decorative is a decision the author made.
export function altStateOf(alt: string, decorative: boolean): AltState {
  if (decorative) return "decorative";
  return alt.trim() ? "set" : "missing";
}

export function parseTags(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(",")) {
    const t = raw.trim().toLowerCase();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

// What a tile says about the file besides its name: the things a person should not miss.
export interface Flag {
  tone: "warn" | "info" | "nodata";
  word: string;
}
export function flagsFor(r: Pick<MediaRecord, "kind" | "altState" | "used" | "state">): Flag[] {
  const out: Flag[] = [];
  if (r.state === "binned") out.push({ tone: "nodata", word: "In the bin" });
  if (r.state === "uploading" || r.state === "failed") return out;
  if (r.kind === "image" && r.altState === "missing") out.push({ tone: "warn", word: "No alt text" });
  if (r.kind === "image" && r.altState === "decorative") out.push({ tone: "info", word: "Decorative" });
  if (r.state !== "binned" && r.used.length === 0) out.push({ tone: "nodata", word: "Unattached" });
  return out;
}

// What a tile's controls are called, in one line a screen reader reads after the file's name.
export function describeRecord(r: Pick<MediaRecord, "kind" | "type" | "bytes" | "state" | "progress" | "error">): string {
  const kind = r.type.split("/").pop()?.toUpperCase() || (r.kind === "image" ? "Image" : "File");
  if (r.state === "uploading") return `${kind}, uploading${r.progress != null ? ` ${Math.round(r.progress)} percent` : ""}`;
  if (r.state === "failed") return `${kind}, upload failed${r.error ? `: ${r.error}` : ""}`;
  return `${kind}, ${byteSize(r.bytes)}`;
}

// The three things a person copies: the address, the Markdown, the HTML. An image goes in as an
// image and a document as a link: an <img> for a PDF breaks the page.
export function copySnippets(r: Pick<MediaRecord, "url" | "kind" | "alt" | "name">): Array<{ id: string; label: string; name: string; value: string }> {
  const alt = r.alt.trim();
  const title = suggestedAlt(r.name);
  if (r.kind === "image") {
    return [
      { id: "address", label: "Copy address", name: "Copy the address", value: r.url },
      { id: "markdown", label: "Markdown", name: "Copy the Markdown image", value: `![${alt}](${r.url})` },
      { id: "html", label: "HTML tag", name: "Copy the HTML image tag", value: `<img src="${r.url}" alt="${alt}">` },
    ];
  }
  return [
    { id: "address", label: "Copy address", name: "Copy the address", value: r.url },
    { id: "markdown", label: "Markdown", name: "Copy the Markdown link", value: `[${title}](${r.url})` },
    { id: "html", label: "HTML link", name: "Copy the HTML link", value: `<a href="${r.url}">${title}</a>` },
  ];
}

// ---------------------------------------------------------------------------------------
// The grid's arrow keys, from the rendered boxes. Extracted from the site's tile-nav.mjs: the
// browser decides the column count, and a second layout engine would disagree with it at the
// widths nobody tested.

export interface TileBox {
  id: string;
  top: number;
  left: number;
  width: number;
}
export interface Band {
  top: number;
  items: Array<{ id: string; mid: number }>;
}
export type Direction = "left" | "right" | "up" | "down" | "first" | "last" | "prev" | "next";

// Visual rows: tiles within 6 px of one another share a row. A box with no width is not laid out.
export function bands(boxes: Iterable<TileBox>): Band[] {
  const out: Band[] = [];
  for (const r of boxes) {
    if (!r.width) continue;
    const entry = { id: r.id, mid: r.left + r.width / 2 };
    const band = out.find((b) => Math.abs(b.top - r.top) < 6);
    if (band) band.items.push(entry);
    else out.push({ top: r.top, items: [entry] });
  }
  out.sort((a, b) => a.top - b.top);
  for (const b of out) b.items.sort((x, y) => x.mid - y.mid);
  return out;
}

// The tile an arrow key moves to, or null to stay put. With nothing active, or an active id no
// longer on the page, the first tile. Left and right wrap across rows in reading order; up and
// down take the nearest tile by centre in the next row, and stop at the edges. First and last
// are Home and End; prev and next step in reading order (the inspector's Alt+arrows).
export function nextTile(rows: Band[], active: string, dir: Direction): string | null {
  const flat = rows.flatMap((b) => b.items.map((i) => i.id));
  const first = flat[0];
  if (first === undefined) return null;
  if (dir === "first") return first;
  if (dir === "last") return flat[flat.length - 1] ?? null;
  if (!active) return first;
  const at = flat.indexOf(active);
  if (at < 0) return first;
  if (dir === "prev") return flat[at - 1] ?? null;
  if (dir === "next") return flat[at + 1] ?? null;
  let ri = -1;
  let ci = -1;
  rows.forEach((b, i) =>
    b.items.forEach((it, j) => {
      if (it.id === active) {
        ri = i;
        ci = j;
      }
    }),
  );
  const row = rows[ri];
  const current = row?.items[ci];
  if (!row || !current) return null;
  if (dir === "left" || dir === "right") {
    const next = row.items[ci + (dir === "right" ? 1 : -1)];
    if (next) return next.id;
    return flat[at + (dir === "right" ? 1 : -1)] ?? null;
  }
  const band = rows[ri + (dir === "down" ? 1 : -1)];
  if (!band) return null;
  let best = band.items[0];
  let bestD = Infinity;
  for (const it of band.items) {
    const d = Math.abs(it.mid - current.mid);
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best?.id ?? null;
}

// ---------------------------------------------------------------------------------------
// Autosave, pure. It waits until typing stops, saves, and says where it is. A change that
// arrives while a save runs is saved after it. Nothing here touches the fields, so what was
// typed is never lost: a failure only changes the state.

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "failed";

export interface AutosaveOptions {
  // Milliseconds of quiet before a save: 800.
  delay?: number;
  // Reads the fields and sends them. Called synchronously when a save starts, so what it reads is
  // what the person had typed at that moment. Reject with an Error that says why.
  save: () => Promise<void>;
  onState?: (state: SaveState, error?: string) => void;
}

export interface Autosave {
  // A change was made: save when typing stops.
  schedule(): void;
  // Save now, if there is anything unsaved (a field lost focus).
  flush(): Promise<void>;
  // Try again after a failure.
  retry(): Promise<void>;
  state(): SaveState;
  // Forget the timer (the inspector moved to another file).
  cancel(): void;
}

export const AUTOSAVE_MS = 800;

export function createAutosave(opts: AutosaveOptions): Autosave {
  const delay = opts.delay ?? AUTOSAVE_MS;
  let state: SaveState = "idle";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  let again = false;
  const set = (s: SaveState, error?: string) => {
    state = s;
    opts.onState?.(s, error);
  };
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const run = (): Promise<void> => {
    stop();
    if (running) {
      again = true;
      return running;
    }
    set("saving");
    let pending: Promise<void>;
    try {
      pending = opts.save();
    } catch (err) {
      pending = Promise.reject(err);
    }
    running = pending
      .then(
        () => {
          running = null;
          if (again) {
            again = false;
            return run();
          }
          set("saved");
          return undefined;
        },
        (err: unknown) => {
          running = null;
          again = false;
          set("failed", err instanceof Error && err.message ? err.message : "Nothing says why.");
        },
      )
      .then(() => undefined);
    return running;
  };
  return {
    schedule() {
      if (running) again = true;
      else set("dirty");
      stop();
      timer = setTimeout(() => void run(), delay);
    },
    flush() {
      if (running) {
        again = again || state === "dirty";
        return running;
      }
      if (state === "dirty") return run();
      return Promise.resolve();
    },
    retry() {
      return run();
    },
    state: () => state,
    cancel: stop,
  };
}

// ---------------------------------------------------------------------------------------
// Bulk tags, extracted from the site's lib/admin/bulk-tag.ts: add or remove one tag across a
// selection. An item already in the wanted state is skipped, so it is not rewritten for nothing,
// and one item's failure is recorded without stopping the rest.
export async function applyBulkTag<T>({
  ids,
  wanted,
  adding,
  missing,
  read,
  write,
}: {
  ids: readonly string[];
  wanted: string;
  adding: boolean;
  missing: string;
  read: (id: string) => Promise<{ item: T; tags: string[] } | null>;
  write: (id: string, item: T, tags: string[]) => Promise<unknown>;
}): Promise<{ done: string[]; skipped: string[]; failed: string[] }> {
  const failed: string[] = [];
  const done: string[] = [];
  const skipped: string[] = [];
  for (const id of ids) {
    try {
      const found = await read(id);
      if (!found) {
        failed.push(`${id}: ${missing}`);
        continue;
      }
      if (adding === found.tags.includes(wanted)) {
        skipped.push(id);
        continue;
      }
      await write(id, found.item, adding ? [...found.tags, wanted] : found.tags.filter((t) => t !== wanted));
      done.push(id);
    } catch (error) {
      failed.push(`${id}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
  return { done, skipped, failed };
}

// ---------------------------------------------------------------------------------------
// The clipboard. Copy through the Clipboard API; where the page may not, through a selected
// field and the document's own copy command; where neither works, say so and leave the text
// selected.

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fall through
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.setProperty("position", "fixed");
    area.style.setProperty("opacity", "0");
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------
// Markup helpers.

const NS = "http://www.w3.org/2000/svg";
const GLYPHS: Record<string, string[]> = {
  crit: ["M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"],
  warn: ["M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"],
  ok: ["M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"],
};

// A status glyph, drawn in currentColor: a shape for each meaning, so colour is never alone.
export function glyph(kind: "crit" | "warn" | "info" | "ok" | "nodata" | "running"): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "cap-status-glyph");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.append(el);
  };
  const paths = GLYPHS[kind];
  if (paths) for (const d of paths) add("path", { fill: "currentColor", "fill-rule": "evenodd", d });
  else if (kind === "info") {
    add("rect", { x: "1.5", y: "1.5", width: "13", height: "13", rx: "2", fill: "none", stroke: "currentColor", "stroke-width": "1.6" });
    add("path", { fill: "currentColor", d: "M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" });
  } else if (kind === "nodata") add("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-dasharray": "2.6 2.2" });
  else {
    add("circle", { cx: "8", cy: "8", r: "6.2", fill: "none", stroke: "currentColor", "stroke-width": "1.6", opacity: "0.35" });
    add("path", { fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", d: "M8 1.8a6.2 6.2 0 0 1 6.2 6.2" });
  }
  return svg;
}

function statusSpan(tone: Flag["tone"], word: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "cap-status";
  span.dataset.tone = tone;
  span.append(glyph(tone), document.createTextNode(word));
  return span;
}

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

const part = <T extends HTMLElement = HTMLElement>(root: ParentNode, name: string) => root.querySelector<T>(`[data-cap-part='${name}']`);

// ---------------------------------------------------------------------------------------
// Tiles. A tile's facts are its data attributes, so the page, the filters and the inspector read
// one thing.

export function recordOf(tile: HTMLElement): MediaRecord {
  const d = tile.dataset;
  let used: UsedIn[] = [];
  try {
    const parsed: unknown = JSON.parse(d.usedIn ?? "[]");
    if (Array.isArray(parsed)) used = parsed.filter((u): u is UsedIn => !!u && typeof u === "object" && typeof (u as UsedIn).title === "string" && typeof (u as UsedIn).href === "string");
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
    state: d.state === "uploading" || d.state === "failed" || d.state === "binned" ? d.state : "ready",
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
  if (meta) meta.textContent = r.state === "uploading" ? "Uploading" : r.state === "failed" ? "Not uploaded" : [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes)].filter(Boolean).join(" · ");
  let flags = tile.querySelector<HTMLElement>(".cap-media-flags");
  if (!flags) {
    flags = document.createElement("span");
    flags.className = "cap-media-flags";
    flags.id = `${tile.id || `tile-${Math.random().toString(36).slice(2, 8)}`}-flags`;
    tile.append(flags);
  }
  const items: Node[] = flagsFor(r).map((f) => statusSpan(f.tone, f.word));
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
    if (r.state === "uploading" || r.state === "failed") open.setAttribute("aria-description", describeRecord(r));
    else open.removeAttribute("aria-description");
  }
  for (const old of tile.querySelectorAll(".cap-media-state")) old.remove();
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
  } else if (r.state === "failed") {
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
export function buildTile(r: MediaRecord): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "cap-media-tile";
  li.id = `tile-${r.key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
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

// ---------------------------------------------------------------------------------------
// The controller.

export interface MediaOptions {
  // Sends the inspector's fields. Reject with an Error that says why. Default: a POST of the
  // inspector's form to its action.
  save?: (key: string, fields: MediaFields) => Promise<void>;
  // Persist a move to the bin, a restore, a retry. Each rejects with an Error that says why.
  bin?: (keys: string[]) => Promise<void>;
  restore?: (keys: string[]) => Promise<void>;
  retry?: (key: string) => Promise<void>;
  // Deletes files for good (the bulk bar's destructive action, after its preview).
  delete?: (keys: string[]) => Promise<void>;
}

export interface MediaController {
  open(key: string): void;
  close(): void;
  setActive(key: string): void;
  selectedKeys(): string[];
  // Adds a tile (an upload) at the start of the first grid.
  add(record: MediaRecord): HTMLElement;
  // Changes a tile's facts and redraws it (progress, a finished upload, a failure).
  update(key: string, patch: Partial<MediaRecord>): void;
  bin(keys: string[]): Promise<boolean>;
  restore(keys: string[]): Promise<boolean>;
  // The actions a bulk bar over this library runs: bin, restore, copy, add-tag, remove-tag.
  bulkHandlers(): Record<string, BulkHandler>;
  refresh(): void;
  detach(): void;
}

const controllers = new WeakMap<HTMLElement, MediaController>();

export function controllerFor(root: HTMLElement | null): MediaController | undefined {
  return root ? controllers.get(root) : undefined;
}

function singleKeysOff(): boolean {
  return document.documentElement.dataset.capSingleKeys === "off";
}

const SAVE_TEXT: Record<SaveState, string> = {
  idle: "Changes save by themselves.",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  failed: "Could not save",
};

export function attachMedia(root: HTMLElement, options: MediaOptions = {}): MediaController {
  const existing = controllers.get(root);
  if (existing) return existing;
  root.setAttribute(READY, "");
  const layout = root.querySelector<HTMLElement>(".cap-media-layout") ?? root;
  const inspector = root.querySelector<HTMLDialogElement>("dialog.cap-media-inspector");
  const tiles = () => Array.from(root.querySelectorAll<HTMLElement>(".cap-media-tile"));
  const shown = () => tiles().filter((t) => !t.hidden && !t.closest("[hidden]"));
  const cleanups: Array<() => void> = [];
  const listen = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Document | Window, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
    el.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener, opts));
  };

  let active: HTMLElement | null = root.querySelector<HTMLElement>(".cap-media-tile[data-active]") ?? shown()[0] ?? null;
  let anchor: HTMLElement | null = null;
  let unwire: (() => void) | null = null;
  const tileOf = (el: Element | null) => el?.closest<HTMLElement>(".cap-media-tile") ?? null;
  const byKey = (key: string) => tiles().find((t) => t.dataset.key === key) ?? null;
  const modeOf = () => (getComputedStyle(layout).getPropertyValue("--cap-media-mode").trim() === "pane" ? "pane" : "sheet");
  const openLink = (t: HTMLElement | null) => t?.querySelector<HTMLElement>(".cap-media-open") ?? null;

  // ---- roving focus: one tile's controls take Tab, the arrows move between tiles.
  const controlsOf = (t: HTMLElement) => Array.from(t.querySelectorAll<HTMLElement>(".cap-media-open, .cap-media-check > input, [data-cap-part='retry'], [data-cap-part='restore']"));
  const syncRoving = () => {
    for (const t of tiles()) {
      const on = t === active;
      for (const c of controlsOf(t)) c.tabIndex = on ? 0 : -1;
      if (on) t.setAttribute("data-active", "");
      else t.removeAttribute("data-active");
      const link = openLink(t);
      if (link) {
        if (on && inspector?.open) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    }
  };
  const setActive = (t: HTMLElement | null) => {
    if (t === active) return;
    active = t;
    syncRoving();
  };
  const focusTile = (t: HTMLElement | null) => {
    const link = openLink(t);
    if (!t || !link) return;
    setActive(t);
    link.focus();
    t.scrollIntoView({ block: "nearest" });
  };
  const move = (from: HTMLElement, dir: Direction): HTMLElement | null => {
    const boxes = shown().map((t) => {
      const r = t.getBoundingClientRect();
      return { id: t.dataset.key ?? "", top: r.top, left: r.left, width: r.width };
    });
    const id = nextTile(bands(boxes), from.dataset.key ?? "", dir);
    return id === null ? null : byKey(id);
  };

  // ---- selection: the real checkboxes; the tile mirrors them.
  const boxOf = (t: HTMLElement) => t.querySelector<HTMLInputElement>(".cap-media-check > input");
  const syncSelected = (t: HTMLElement) => {
    const box = boxOf(t);
    if (box?.checked) t.setAttribute("data-selected", "");
    else t.removeAttribute("data-selected");
  };
  const selectedKeys = () => tiles().filter((t) => boxOf(t)?.checked).map((t) => t.dataset.key ?? "");
  const toggle = (t: HTMLElement) => {
    const box = boxOf(t);
    if (box && !box.disabled) box.click();
  };
  const range = (to: HTMLElement) => {
    const list = shown();
    const a = list.indexOf(anchor ?? active ?? to);
    const b = list.indexOf(to);
    if (a < 0 || b < 0) return;
    for (const t of list.slice(Math.min(a, b), Math.max(a, b) + 1)) {
      const box = boxOf(t);
      if (box && !box.checked) box.click();
    }
  };

  // ---- the inspector.
  let current: HTMLElement | null = null;
  let saveState: SaveState = "idle";
  let session = 0;
  const drafts = new Map<string, MediaFields>();
  let autosave: Autosave | null = null;
  const ins = <T extends HTMLElement = HTMLElement>(name: string) => (inspector ? part<T>(inspector, name) : null);

  const readFields = (): MediaFields => {
    const decorative = ins<HTMLInputElement>("decorative")?.checked ?? false;
    return {
      alt: decorative ? "" : (ins<HTMLTextAreaElement>("alt")?.value ?? "").trim(),
      decorative,
      title: (ins<HTMLInputElement>("title-field")?.value ?? "").trim(),
      caption: (ins<HTMLTextAreaElement>("caption")?.value ?? "").trim(),
      tags: parseTags(ins<HTMLInputElement>("tags-value")?.value ?? ""),
    };
  };

  const renderSave = (state: SaveState, error?: string) => {
    saveState = state;
    const wrap = ins("save");
    const status = ins("save-status");
    const alert = ins("save-error");
    const retry = ins("retry-save");
    const form = ins("form");
    if (wrap) wrap.dataset.state = state;
    if (form) {
      if (state === "saving") form.setAttribute("aria-busy", "true");
      else form.removeAttribute("aria-busy");
    }
    if (status) {
      if (state === "failed") status.replaceChildren();
      else {
        const kids: Node[] = [];
        if (state === "saving") kids.push(glyph("running"));
        else if (state === "saved") kids.push(glyph("ok"));
        else if (state === "dirty") kids.push(glyph("info"));
        kids.push(document.createTextNode(SAVE_TEXT[state]));
        status.replaceChildren(...kids);
      }
    }
    if (alert) {
      if (state === "failed") alert.replaceChildren(glyph("crit"), document.createTextNode(`Could not save${error ? `: ${error.replace(/\.$/, "")}` : ""}. What you typed is still here.`));
      else alert.replaceChildren();
    }
    if (retry) retry.hidden = state !== "failed";
  };

  const defaultSave = async (key: string, fields: MediaFields): Promise<void> => {
    const form = ins<HTMLFormElement>("form");
    if (!form) return;
    const body = new FormData(form);
    body.set("key", key);
    const res = await fetch(form.getAttribute("action") || location.href, { method: (form.getAttribute("method") || "post").toUpperCase(), body, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`The server answered ${res.status}.`);
    void fields;
  };

  // Applies saved fields to the tile, so the grid, the filters and the next open read them.
  const applySaved = (tile: HTMLElement, f: MediaFields) => {
    writeRecord(tile, { altState: altStateOf(f.alt, f.decorative), alt: f.alt, title: f.title, caption: f.caption, tags: f.tags });
    syncTile(tile);
    applyFilters(false);
    updateCounts();
  };

  const startSession = (tile: HTMLElement | null) => {
    session += 1;
    const mine = session;
    autosave?.cancel();
    current = tile;
    autosave = tile
      ? createAutosave({
          save: () => {
            // Read now: this runs the moment a save starts, before anything else can change the fields.
            const fields = readFields();
            const key = tile.dataset.key ?? "";
            const send = options.save ?? defaultSave;
            return send(key, fields).then(
              () => {
                drafts.delete(key);
                applySaved(tile, fields);
              },
              (err: unknown) => {
                drafts.set(key, fields);
                throw err;
              },
            );
          },
          onState: (s, err) => {
            if (mine === session) renderSave(s, err);
            else if (s === "failed") fail(`Could not save the changes to ${tile.dataset.label ?? "a file"}: ${err ?? "nothing says why"}. Open it again to retry.`);
          },
        })
      : null;
  };

  // Writes a record into the inspector's fields and lists. Idempotent: the server's own markup
  // for the first file is what this would write.
  const fill = (tile: HTMLElement) => {
    if (!inspector) return;
    const r = recordOf(tile);
    const draft = drafts.get(r.key);
    startSession(tile);
    const set = <T extends HTMLElement>(name: string, fn: (el: T) => void) => {
      const el = ins<T>(name);
      if (el) fn(el);
    };
    set("title", (el) => (el.textContent = r.name));
    set("subtitle", (el) => (el.textContent = [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes), r.width && r.height ? `${r.width} by ${r.height}` : ""].filter(Boolean).join(" · ")));
    set<HTMLImageElement>("preview", (img) => {
      const frame = img.closest<HTMLElement>(".cap-media-preview");
      if (r.kind === "image" && r.thumb) {
        img.hidden = false;
        img.src = r.thumb;
        frame?.querySelector(".cap-media-doc")?.remove();
      } else {
        img.hidden = true;
        if (frame && !frame.querySelector(".cap-media-doc")) {
          const doc = document.createElement("span");
          doc.className = "cap-media-doc";
          doc.setAttribute("aria-hidden", "true");
          doc.textContent = (r.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase();
          frame.append(doc);
        }
      }
    });
    set<HTMLInputElement>("key", (el) => (el.value = r.key));
    const values: MediaFields = draft ?? { alt: r.alt, decorative: r.altState === "decorative", title: r.title, caption: r.caption, tags: r.tags };
    const alt = ins<HTMLTextAreaElement>("alt");
    const deco = ins<HTMLInputElement>("decorative");
    if (alt && deco) {
      deco.checked = values.decorative;
      alt.value = values.decorative ? "" : values.alt;
      alt.disabled = values.decorative;
      alt.dataset.prev = "";
    }
    const imageOnly = r.kind === "image";
    for (const name of ["alt-field", "decorative-field"]) set(name, (el) => (el.hidden = !imageOnly));
    set("alt-document", (el) => (el.hidden = imageOnly));
    set<HTMLInputElement>("title-field", (el) => (el.value = values.title));
    set<HTMLTextAreaElement>("caption", (el) => (el.value = values.caption));
    renderTags(values.tags, r.suggestedTags ?? []);
    set<HTMLInputElement>("address", (el) => (el.value = r.url));
    for (const b of inspector.querySelectorAll<HTMLElement>("[data-cap-copy-kind]")) {
      const snippet = copySnippets({ url: r.url, kind: r.kind, alt: values.alt, name: r.name }).find((s) => s.id === b.dataset.capCopyKind);
      if (snippet) {
        b.dataset.capCopy = snippet.value;
        b.setAttribute("aria-label", snippet.name);
        const label = b.querySelector<HTMLElement>("[data-cap-part='copy-label']");
        if (label) label.textContent = snippet.label;
      }
    }
    set("copied", (el) => el.replaceChildren());
    set("facts", (dl) => {
      const rows: Array<[string, string]> = [
        ["Key", r.key],
        ["Type", r.type || "unknown"],
        ["Size", byteSize(r.bytes)],
        ["Dimensions", r.width && r.height ? `${r.width} by ${r.height}` : "not measured"],
        ["Uploaded", r.uploaded ?? "ships with the site"],
      ];
      dl.replaceChildren(
        ...rows.flatMap(([k, v]) => {
          const dt = document.createElement("dt");
          dt.textContent = k;
          const dd = document.createElement("dd");
          dd.textContent = v;
          return [dt, dd];
        }),
      );
    });
    set("used", (box) => {
      box.replaceChildren();
      if (r.used.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "cap-media-used";
        for (const u of r.used) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = u.href;
          a.textContent = u.title;
          li.append(a);
          if (u.how) {
            const how = document.createElement("span");
            how.className = "cap-media-used-how";
            how.textContent = u.how;
            li.append(how);
          }
          ul.append(li);
        }
        box.append(ul);
      } else {
        const p = document.createElement("p");
        p.className = "cap-media-used-empty";
        p.textContent = "Not used anywhere.";
        const note = document.createElement("p");
        note.className = "cap-media-note";
        note.append("No post cites this file. That is not proof it is unused: a page built in code can still use it, so check before you delete it. The Unattached filter lists every file like this. ");
        const show = document.createElement("button");
        show.type = "button";
        show.className = "cap-btn";
        show.dataset.variant = "link";
        show.dataset.capPart = "show-unattached";
        show.textContent = "Show unattached files";
        note.append(show);
        box.append(p, note);
      }
    });
    const binned = r.state === "binned";
    set("bin", (el) => (el.hidden = binned));
    set("restore", (el) => (el.hidden = !binned));
    renderSave(draft ? "failed" : "idle", draft ? "the last save did not go through" : undefined);
    syncRoving();
  };

  const renderTags = (tags: string[], suggested: string[]) => {
    const list = ins("tags");
    const hidden = ins<HTMLInputElement>("tags-value");
    if (hidden) hidden.value = tags.join(", ");
    if (list) {
      list.replaceChildren(
        ...tags.map((t) => {
          const li = document.createElement("li");
          const b = document.createElement("button");
          b.type = "button";
          b.className = "cap-chip";
          b.dataset.capTag = t;
          b.setAttribute("aria-label", `Remove tag ${t}`);
          b.append(t, " ");
          const x = document.createElement("span");
          x.setAttribute("aria-hidden", "true");
          x.textContent = "×";
          b.append(x);
          li.append(b);
          return li;
        }),
      );
    }
    const sug = ins("suggestions");
    if (sug) {
      sug.replaceChildren(
        ...suggested
          .filter((t) => !tags.includes(t))
          .map((t) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.type = "button";
            b.className = "cap-chip";
            b.dataset.capSuggest = t;
            b.setAttribute("aria-label", `Add suggested tag ${t}`);
            b.textContent = `+ ${t}`;
            li.append(b);
            return li;
          }),
      );
    }
  };

  const setTags = (tags: string[]) => {
    const r = current ? recordOf(current) : null;
    renderTags(tags, r?.suggestedTags ?? []);
    autosave?.schedule();
    void autosave?.flush();
  };

  const closePending = () => void autosave?.flush();

  const showPane = () => {
    if (!inspector || inspector.open) return;
    inspector.show();
  };

  const openInspector = (tile: HTMLElement, o: { focus: boolean }) => {
    if (!inspector) return;
    setActive(tile);
    const switching = current !== tile;
    if (switching) {
      closePending();
      fill(tile);
    }
    if (modeOf() === "pane") {
      if (inspector.matches(":modal")) inspector.close();
      showPane();
      syncRoving();
      if (o.focus) firstField()?.focus();
    } else if (!inspector.open || !inspector.matches(":modal")) {
      if (inspector.open) inspector.close();
      unwire?.();
      unwire = wireDialog(inspector, { returnTo: openLink(tile) });
      openDialog(inspector, openLink(tile), { focus: firstField() });
      syncRoving();
    }
  };
  const firstField = () => {
    const alt = ins<HTMLTextAreaElement>("alt");
    if (alt && !alt.disabled && !alt.closest("[hidden]")) return alt;
    return ins<HTMLInputElement>("decorative") ?? ins<HTMLInputElement>("title-field");
  };
  const closeInspector = (o: { focus: boolean } = { focus: true }) => {
    if (!inspector) return;
    closePending();
    const was = inspector.open;
    if (was) inspector.close();
    syncRoving();
    if (was && o.focus) focusTile(active);
  };

  // ---- filters, search, view, size, counts.
  const view = () => root.querySelector<HTMLInputElement>("[data-cap-part='view'] input:checked")?.value ?? "library";
  const query = () => (root.querySelector<HTMLInputElement>("[data-cap-part='search']")?.value ?? "").trim().toLowerCase();
  const chipsGroup = () => root.querySelector<HTMLElement>("[data-cap-part='filters']");
  const pressed = () => {
    const g = chipsGroup();
    return g ? Array.from(g.querySelectorAll<HTMLElement>(".cap-chip[aria-pressed='true']")).map((c) => c.dataset.value ?? "") : [];
  };
  const matchesFilter = (t: HTMLElement, name: string): boolean => {
    const r = recordOf(t);
    if (name === "unattached") return r.used.length === 0;
    if (name === "no-alt") return r.kind === "image" && r.altState === "missing";
    if (name === "large") return r.bytes > LARGE_BYTES;
    return true;
  };
  const haystack = (t: HTMLElement) => [t.dataset.label, t.dataset.altText, t.dataset.title, t.dataset.caption, t.dataset.tags, t.dataset.key].join(" ").toLowerCase();

  const countEl = () => root.querySelector<HTMLElement>(".cap-media-count");
  const applyFilters = (announce = true) => {
    const v = view();
    const q = query();
    const names = pressed();
    let visible = 0;
    let matchable = 0;
    let library = 0;
    for (const t of tiles()) {
      const state = t.dataset.state ?? "ready";
      const inView = v === "bin" ? state === "binned" : state !== "binned";
      if (state !== "binned") library += 1;
      let show = inView;
      const settled = state === "ready" || state === "binned";
      // An upload in progress or a failed one stays in view: it is not a search result, it is news.
      if (show && settled) {
        if (q && !q.split(/\s+/).every((w) => haystack(t).includes(w))) show = false;
        if (show && names.some((n) => !matchesFilter(t, n))) show = false;
      }
      t.hidden = !show;
      // A file that is out of sight is not selected: an action must never reach what the person cannot see.
      if (!show) {
        const box = boxOf(t);
        if (box?.checked) {
          box.checked = false;
          box.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      if (show) visible += 1;
      if (show && settled) matchable += 1;
    }
    for (const g of root.querySelectorAll<HTMLElement>(".cap-media-group")) g.hidden = !g.querySelector(".cap-media-tile:not([hidden])");
    const empty = root.querySelector<HTMLElement>(".cap-media-empty");
    if (empty) {
      const narrowed = !!q || names.length > 0;
      const none = visible === 0 || (matchable === 0 && narrowed && v === "library");
      const cause = !none ? "" : v === "bin" ? "bin" : q ? "search" : names.length ? "filter" : library === 0 ? "library" : "library";
      empty.hidden = !none;
      for (const child of empty.querySelectorAll<HTMLElement>("[data-cap-empty]")) child.hidden = child.dataset.capEmpty !== cause;
    }
    const count = countEl();
    if (count && announce) {
      const total = tiles().filter((t) => (v === "bin" ? t.dataset.state === "binned" : t.dataset.state === "ready")).length;
      count.textContent = v === "bin" ? `${matchable} in the bin` : matchable === total ? `${matchable} ${matchable === 1 ? "file" : "files"}` : `${matchable} of ${total} files`;
    }
    if (active && (active.hidden || active.closest("[hidden]"))) {
      const first = shown()[0] ?? null;
      setActive(first);
      if (inspector?.open) {
        if (first) {
          closePending();
          fill(first);
        } else closeInspector({ focus: false });
      }
    } else if (!active) setActive(shown()[0] ?? null);
    syncRoving();
  };
  const updateCounts = () => {
    const g = chipsGroup();
    const lib = tiles().filter((t) => t.dataset.state === "ready");
    if (g) {
      for (const chip of g.querySelectorAll<HTMLElement>(".cap-chip")) {
        const n = lib.filter((t) => matchesFilter(t, chip.dataset.value ?? "")).length;
        const el = chip.querySelector<HTMLElement>(".cap-chip-count");
        if (el) el.textContent = String(n);
      }
    }
    const nLib = tiles().filter((t) => t.dataset.state === "ready").length;
    const nBin = tiles().filter((t) => t.dataset.state === "binned").length;
    for (const el of root.querySelectorAll<HTMLElement>("[data-cap-count='library']")) el.textContent = String(nLib);
    for (const el of root.querySelectorAll<HTMLElement>("[data-cap-count='bin']")) el.textContent = String(nBin);
  };

  // ---- the bin.
  const rawBin = async (keys: string[], to: "binned" | "ready") => {
    const before = keys.map((k) => ({ k, state: byKey(k)?.dataset.state ?? "ready" }));
    for (const k of keys) {
      const t = byKey(k);
      if (!t) continue;
      writeRecord(t, { state: to });
      syncTile(t);
    }
    applyFilters();
    updateCounts();
    try {
      await (to === "binned" ? options.bin : options.restore)?.(keys);
    } catch (err) {
      for (const b of before) {
        const t = byKey(b.k);
        if (t) {
          t.dataset.state = b.state;
          syncTile(t);
        }
      }
      applyFilters();
      updateCounts();
      throw err;
    }
  };
  const itemsOf = (keys: string[]): BulkItem[] => keys.map((k) => ({ id: k, label: byKey(k)?.dataset.label ?? k }));
  const bin = (keys: string[]) =>
    performBulk({
      action: "bin",
      items: itemsOf(keys),
      run: () => rawBin(keys, "binned"),
      undo: () => rawBin(keys, "ready"),
      said: keys.length === 1 ? `Moved ${byKey(keys[0] ?? "")?.dataset.label ?? "the file"} to the bin.` : "Moved {n} files to the bin.",
      undone: keys.length === 1 ? "Put it back in the library." : "Put {n} files back in the library.",
      returnTo: openLink(active),
    });
  const restore = (keys: string[]) =>
    performBulk({
      action: "restore",
      items: itemsOf(keys),
      run: () => rawBin(keys, "ready"),
      undo: () => rawBin(keys, "binned"),
      said: keys.length === 1 ? `Restored ${byKey(keys[0] ?? "")?.dataset.label ?? "the file"} to the library.` : "Restored {n} files to the library.",
      undone: keys.length === 1 ? "Put it back in the bin." : "Put {n} files back in the bin.",
      returnTo: openLink(active),
    });

  // ---- events.
  listen(root, "change", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const tile = tileOf(t);
    if (tile && t.closest(".cap-media-check")) {
      syncSelected(tile);
      anchor = tile;
      return;
    }
    if (inspector?.contains(t)) {
      if (t.dataset.capPart === "decorative") {
        const alt = ins<HTMLTextAreaElement>("alt");
        if (alt) {
          if (t.checked) {
            alt.dataset.prev = alt.value;
            alt.value = "";
            alt.disabled = true;
          } else {
            alt.disabled = false;
            alt.value = alt.dataset.prev ?? "";
          }
        }
        autosave?.schedule();
        void autosave?.flush();
      }
      return;
    }
    if (t.closest("[data-cap-part='view']")) {
      applyFilters();
      return;
    }
    if (t.closest("[data-cap-part='size']")) root.dataset.size = t.value;
  });

  listen(root, "input", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (inspector?.contains(t) && (t.dataset.capPart === "alt" || t.dataset.capPart === "title-field" || t.dataset.capPart === "caption")) autosave?.schedule();
    else if (t.dataset.capPart === "search") applyFilters();
  });

  listen(root, "cap:filter-change", () => applyFilters());

  listen(root, "focusout", (e: FocusEvent) => {
    const t = e.target;
    // A field that loses focus saves what was typed in it.
    if (t instanceof HTMLElement && inspector?.contains(t) && /^(INPUT|TEXTAREA)$/.test(t.tagName) && t.dataset.capPart !== "tag-input") void autosave?.flush();
    if (t instanceof HTMLElement && t.dataset.capPart === "tag-input") {
      const input = t as HTMLInputElement;
      if (input.value.trim()) addTagFrom(input);
    }
  });

  const addTagFrom = (input: HTMLInputElement) => {
    const add = parseTags(input.value);
    input.value = "";
    if (add.length === 0) return;
    const have = parseTags(ins<HTMLInputElement>("tags-value")?.value ?? "");
    setTags([...have, ...add.filter((t) => !have.includes(t))]);
  };

  listen(root, "focusin", (e: FocusEvent) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const tile = tileOf(t);
    if (!tile || inspector?.contains(t)) return;
    if (tile !== active) setActive(tile);
    // The inspector follows the tile that has focus; focus stays where it is.
    if (inspector?.open && !inspector.matches(":modal") && current !== tile && tile.dataset.state !== "uploading" && tile.dataset.state !== "failed") {
      closePending();
      fill(tile);
    }
  });

  listen(root, "click", (e: MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const tile = tileOf(target);
    const open = target.closest<HTMLElement>(".cap-media-open");
    if (tile && open && root.contains(open)) {
      e.preventDefault();
      if (e.shiftKey) return range(tile);
      if (e.ctrlKey || e.metaKey) return toggle(tile);
      if (open.getAttribute("aria-disabled") === "true") return;
      return openInspector(tile, { focus: true });
    }
    const retry = target.closest<HTMLElement>("[data-cap-part='retry']");
    if (retry && tile) {
      const key = tile.dataset.key ?? "";
      tile.dispatchEvent(new CustomEvent("cap-media-retry", { bubbles: true, detail: { key } }));
      void options.retry?.(key);
      return;
    }
    const restoreBtn = target.closest<HTMLElement>("[data-cap-part='restore']");
    if (restoreBtn && tile) {
      void restore([tile.dataset.key ?? ""]);
      return;
    }
    if (target.closest("[data-cap-part='clear-search']")) {
      const search = root.querySelector<HTMLInputElement>("[data-cap-part='search']");
      if (search) {
        search.value = "";
        applyFilters();
        search.focus();
      }
      return;
    }
    if (target.closest("[data-cap-part='clear-filters']")) {
      const clear = chipsGroup()?.querySelector<HTMLElement>("[data-cap-part='clear']");
      if (clear) clear.click();
      return;
    }
    if (!inspector?.contains(target)) return;
    const btn = target.closest<HTMLElement>("button");
    if (!btn) return;
    const p = btn.dataset.capPart;
    if (p === "close") closeInspector();
    else if (p === "bin" && current) void bin([current.dataset.key ?? ""]);
    else if (p === "restore" && current) void restore([current.dataset.key ?? ""]);
    else if (p === "retry-save") void autosave?.retry();
    else if (p === "show-unattached") {
      const chip = chipsGroup()?.querySelector<HTMLElement>(".cap-chip[data-value='unattached']");
      if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
      if (chip) chip.focus();
    } else if (btn.dataset.capTag !== undefined) {
      const have = parseTags(ins<HTMLInputElement>("tags-value")?.value ?? "");
      setTags(have.filter((x) => x !== btn.dataset.capTag));
      ins("tag-input")?.focus();
    } else if (btn.dataset.capSuggest !== undefined) {
      const have = parseTags(ins<HTMLInputElement>("tags-value")?.value ?? "");
      setTags([...have, btn.dataset.capSuggest]);
      ins("tag-input")?.focus();
    } else if (btn.dataset.capCopy !== undefined) {
      void copyFrom(btn);
    }
  });

  let copiedTimer: ReturnType<typeof setTimeout> | null = null;
  const copyFrom = async (btn: HTMLElement) => {
    const value = btn.dataset.capCopy || ins<HTMLInputElement>("address")?.value || "";
    const what = btn.getAttribute("aria-label")?.replace(/^Copy (the )?/, "") || "address";
    const status = ins("copied");
    if (copiedTimer) clearTimeout(copiedTimer);
    // Emptied first, so a second copy of the same thing is announced again.
    status?.replaceChildren();
    await Promise.resolve();
    const ok = await copyText(value);
    if (status) {
      if (ok) status.replaceChildren(glyph("ok"), document.createTextNode(`Copied the ${what}.`));
      else {
        status.replaceChildren(glyph("crit"), document.createTextNode("Could not copy. The address is selected: press Ctrl+C or Cmd+C."));
        ins<HTMLInputElement>("address")?.select();
      }
      copiedTimer = setTimeout(() => status.replaceChildren(), ok ? 2500 : 8000);
    }
  };

  // The inspector's keys: Enter in the tag field adds a tag; Esc goes back to the grid (a sheet
  // closes by itself); Alt and an arrow move to the next file without leaving the field.
  listen(root, "keydown", (e: KeyboardEvent) => {
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (!t || e.defaultPrevented || e.isComposing) return;
    if (inspector?.contains(t)) {
      if (t.dataset.capPart === "tag-input" && (e.key === "Enter" || e.key === ",")) {
        e.preventDefault();
        addTagFrom(t as HTMLInputElement);
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && current) {
        const dir: Direction | null = e.key === "ArrowLeft" || e.key === "ArrowUp" ? "prev" : e.key === "ArrowRight" || e.key === "ArrowDown" ? "next" : null;
        if (dir) {
          e.preventDefault();
          const next = move(current, dir);
          if (next && next.dataset.state !== "uploading" && next.dataset.state !== "failed") {
            closePending();
            setActive(next);
            fill(next);
            next.scrollIntoView({ block: "nearest" });
          }
          return;
        }
      }
      if (e.key === "Escape" && inspector.open && !inspector.matches(":modal")) {
        e.preventDefault();
        closePending();
        focusTile(active);
      }
      return;
    }
    // Keys on a tile's own controls.
    const tile = tileOf(t);
    if (!tile || e.ctrlKey || e.metaKey || e.altKey) return;
    const isControl = t.matches(".cap-media-open, .cap-media-check > input, [data-cap-part='retry'], [data-cap-part='restore']");
    if (!isControl) return;
    const dirs: Record<string, Direction> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Home: "first", End: "last" };
    const dir = dirs[e.key];
    if (dir) {
      e.preventDefault();
      const next = move(tile, dir);
      if (next) focusTile(next);
      return;
    }
    if (e.key === " " && !(t instanceof HTMLInputElement)) {
      e.preventDefault();
      toggle(tile);
    } else if ((e.key === "x" || e.key === "X") && !e.shiftKey && !singleKeysOff()) {
      e.preventDefault();
      toggle(tile);
    }
  });

  if (inspector) {
    listen(inspector, "close", () => {
      unwire?.();
      unwire = null;
      syncRoving();
    });
    listen(inspector, "submit", (e: Event) => {
      // The form's own Save button is for a page with no script; with script the pane saves itself.
      e.preventDefault();
      void autosave?.flush();
    });
  }
  // ---- mode: a pane beside the grid, or a sheet over it.
  let lastMode = modeOf();
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      const m = modeOf();
      if (m === lastMode) return;
      lastMode = m;
      if (!inspector) return;
      const wasOpen = inspector.open;
      if (!wasOpen) return;
      if (m === "pane") {
        if (inspector.matches(":modal")) {
          inspector.close();
          showPane();
        }
      } else if (!inspector.matches(":modal")) {
        closePending();
        inspector.close();
      }
      syncRoving();
    });
    ro.observe(root);
    cleanups.push(() => ro.disconnect());
  }

  // ---- start.
  for (const t of tiles()) syncSelected(t);
  if (inspector) {
    if (inspector.open) {
      if (modeOf() === "sheet") inspector.close();
      else if (active) {
        current = active;
        // The server rendered the inspector for the active tile: start its session without rewriting it.
        startSession(active);
        renderSave("idle");
      }
    }
  }
  syncRoving();
  enhanceMeters(root);
  applyFilters(false);
  updateCounts();

  const controller: MediaController = {
    open: (key) => {
      const t = byKey(key);
      if (t) openInspector(t, { focus: false });
    },
    close: () => closeInspector(),
    setActive: (key) => setActive(byKey(key)),
    selectedKeys,
    add: (r) => {
      const t = buildTile(r);
      let grid = root.querySelector<HTMLElement>(".cap-media-grid");
      if (!grid) {
        grid = document.createElement("ul");
        grid.className = "cap-media-grid";
        grid.setAttribute("role", "list");
        grid.setAttribute("aria-label", "Files");
        (root.querySelector(".cap-media-empty") ?? root.querySelector(".cap-media-main"))?.before(grid);
      }
      grid.prepend(t);
      applyFilters();
      updateCounts();
      return t;
    },
    update: (key, patch) => {
      const t = byKey(key);
      if (!t) return;
      const wasKey = t.dataset.key;
      writeRecord(t, patch);
      if (patch.state === "ready" && !t.querySelector(".cap-media-check")) {
        // An upload that finished becomes a tile that can be opened and selected.
        const fresh = buildTile(recordOf(t));
        t.replaceWith(fresh);
        if (active === t) active = fresh;
        applyFilters();
        updateCounts();
        return;
      }
      if (wasKey !== t.dataset.key) t.dataset.key = patch.key ?? wasKey ?? "";
      if (patch.progress !== undefined && t.dataset.state === "uploading") {
        const bar = t.querySelector<HTMLElement>(".cap-meter-bar");
        const pct = Math.max(0, Math.min(100, Math.round(patch.progress)));
        if (bar) {
          bar.setAttribute("aria-valuenow", String(pct));
          bar.setAttribute("aria-valuetext", `${pct} percent of ${t.dataset.label ?? "the file"} uploaded`);
          const value = t.querySelector<HTMLElement>(".cap-meter-value");
          if (value) value.textContent = `${pct}%`;
          const open = openLink(t);
          open?.setAttribute("aria-description", describeRecord({ ...recordOf(t), progress: pct }));
          return;
        }
      }
      syncTile(t);
      applyFilters();
      updateCounts();
    },
    bin,
    restore,
    bulkHandlers: () => ({
      bin: { run: (items) => rawBin(items.map((i) => i.id), "binned"), undo: (items) => rawBin(items.map((i) => i.id), "ready"), said: "Moved {n} file{s} to the bin.", undone: "Put {n} file{s} back in the library." },
      restore: { run: (items) => rawBin(items.map((i) => i.id), "ready"), undo: (items) => rawBin(items.map((i) => i.id), "binned"), said: "Restored {n} file{s} to the library.", undone: "Put {n} file{s} back in the bin." },
      copy: {
        run: async (items) => {
          const urls = items.map((i) => byKey(i.id)?.dataset.url ?? "").filter(Boolean);
          if (!(await copyText(urls.join("\n")))) throw new Error("the browser refused the clipboard");
        },
        said: "Copied the address of {n} file{s}.",
      },
      delete: {
        run: async (items) => {
          await options.delete?.(items.map((i) => i.id));
          for (const i of items) byKey(i.id)?.remove();
          applyFilters();
          updateCounts();
        },
        said: "Deleted {n} file{s} for good.",
      },
      "add-tag": tagHandler(true),
      "remove-tag": tagHandler(false),
    }),
    refresh: () => {
      applyFilters();
      updateCounts();
      syncRoving();
    },
    detach: () => {
      cleanups.forEach((f) => f());
      unwire?.();
      controllers.delete(root);
      root.removeAttribute(READY);
    },
  };

  // Bulk tags: add or remove one tag across the selection; undo reverses exactly what changed.
  function tagHandler(adding: boolean): BulkHandler {
    const changed = new WeakMap<object, string[]>();
    const apply = async (items: readonly BulkItem[], value: string | undefined, add: boolean) => {
      const tag = (value ?? "").trim().toLowerCase();
      if (!tag) throw new Error("name a tag first");
      const result = await applyBulkTag<HTMLElement>({
        ids: items.map((i) => i.id),
        wanted: tag,
        adding: add,
        missing: "no longer in the library",
        read: async (id) => {
          const t = byKey(id);
          return t ? { item: t, tags: parseTags(t.dataset.tags ?? "") } : null;
        },
        write: async (id, t, tags) => {
          t.dataset.tags = tags.join(", ");
          await options.save?.(id, { ...recordFields(t), tags });
        },
      });
      changed.set(items, result.done);
      if (result.failed.length > 0) throw new Error(result.failed.join("; "));
      updateCounts();
    };
    return {
      run: (items, value) => apply(items, value, adding),
      undo: async (items, value) => {
        const did = changed.get(items) ?? [];
        await apply(items.filter((i) => did.includes(i.id)), value, !adding);
      },
      said: adding ? "Added the tag to {n} file{s}." : "Removed the tag from {n} file{s}.",
      undone: adding ? "Took the tag off {n} file{s}." : "Put the tag back on {n} file{s}.",
    };
  }
  const recordFields = (t: HTMLElement): MediaFields => {
    const r = recordOf(t);
    return { alt: r.alt, decorative: r.altState === "decorative", title: r.title, caption: r.caption, tags: r.tags };
  };

  controllers.set(root, controller);
  return controller;
}

// Attaches to every [data-cap="media"] under root not yet attached (with the default save, a POST
// of the inspector's form). Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(root.querySelectorAll<HTMLElement>("[data-cap='media']:not([data-cap-ready])")).map((el) => attachMedia(el).detach);
  return () => undo.forEach((f) => f());
}
