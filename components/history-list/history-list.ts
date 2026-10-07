// The history list's behaviour and its pure helpers. One line per change; autosaves fold
// into one line that opens in place; any two lines can be picked to compare; restoring a
// line makes a NEW version on top and offers Undo, so nothing is ever overwritten.
//
// The page is delivered with every line in the HTML. This module adds what only a person's
// action creates: the picks, the restore, the group that opens, a page of older lines.
// No framework; the React wrapper uses the same helpers.
import { toggleGroup } from "../disclosure/disclosure.ts";
import { initials } from "../avatar/avatar.ts";
import { GLYPHS, enhance as enhanceMessage, say } from "../message/message.ts";
import { listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { enhance as enhanceTime, parse, relative } from "../time/time.ts";

// ---------------------------------------------------------------------------------------
// The data.

export type HistoryKind = "edit" | "autosave" | "named" | "publish" | "restore";

export interface Destination {
  name: string;
  // Words, not colours alone: Live, Failed, Queued.
  status: "live" | "failed" | "queued";
}

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  // Who made the change, by name. `ai` sets the avatar's initials in the mono face.
  who: string;
  ai?: boolean;
  // When, as an ISO timestamp (a zoneless one is UTC, as in the time component).
  at: string;
  // The post's length in words after this change. The line's signed size change is the
  // difference from the next older line.
  words: number;
  // The signed change, when the caller knows it better than the difference (the oldest line,
  // whose predecessor is not loaded).
  delta?: number;
  // One line; the whole text stays in the link's name.
  summary: string;
  // A named version's name.
  name?: string;
  destinations?: Destination[];
  // A restore: the line it restored from.
  restoredFrom?: { id: string; at: string };
}

export interface Run {
  type: "run";
  entries: HistoryEntry[];
  // The oldest and newest times in the run.
  from: string;
  to: string;
  delta: number;
  who: string[];
}
export interface Single {
  type: "entry";
  entry: HistoryEntry;
}
export type Line = Run | Single;

// ---------------------------------------------------------------------------------------
// Pure helpers.

export function countWords(text: string): number {
  const t = text.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

// The signed change in length, in words: `after` minus `before`. Each is the text or its
// word count.
export function wordDelta(before: string | number, after: string | number): number {
  const n = (v: string | number) => (typeof v === "number" ? v : countWords(v));
  return n(after) - n(before);
}

export type Sign = "plus" | "minus" | "zero";

export function deltaSign(n: number): Sign {
  return n > 0 ? "plus" : n < 0 ? "minus" : "zero";
}

// "+142 words", "−30 words" (a real minus sign, which a screen reader says as "minus"),
// "+1 word", "no change in length". The sign is text; a drawn mark repeats it.
export function deltaText(n: number): string {
  if (n === 0) return "no change in length";
  const abs = Math.abs(n);
  return `${n > 0 ? "+" : "\u2212"}${abs} word${abs === 1 ? "" : "s"}`;
}

// The change each entry made, newest first: its length less the next older entry's. An
// entry that carries its own `delta`, or the oldest one (whose predecessor is not loaded),
// uses that, else the whole length.
export function deltaOf(entries: readonly HistoryEntry[], index: number): number {
  const e = entries[index];
  if (!e) return 0;
  if (e.delta !== undefined) return e.delta;
  const older = entries[index + 1];
  return older ? e.words - older.words : e.words;
}

// Groups runs of consecutive autosaves into one line each; every other entry stays a line
// of its own. Newest first, as the list is shown. The newest entry is the current version
// and always stays a line. A run needs `minRun` autosaves (two by default): one autosave on
// its own is just a line.
export function condense(entries: readonly HistoryEntry[], minRun = 2): Line[] {
  const out: Line[] = [];
  let i = 0;
  while (i < entries.length) {
    const e = entries[i] as HistoryEntry;
    if (e.kind !== "autosave" || i === 0) {
      out.push({ type: "entry", entry: e });
      i += 1;
      continue;
    }
    let j = i;
    while (j < entries.length && (entries[j] as HistoryEntry).kind === "autosave") j += 1;
    const run = entries.slice(i, j);
    if (run.length >= minRun) {
      const times = run.map((r) => parse(r.at));
      out.push({
        type: "run",
        entries: run,
        from: run[times.indexOf(Math.min(...times))]?.at ?? "",
        to: run[times.indexOf(Math.max(...times))]?.at ?? "",
        delta: run.reduce((sum, _r, k) => sum + deltaOf(entries, i + k), 0),
        who: [...new Set(run.map((r) => r.who))],
      });
    } else {
      for (const r of run) out.push({ type: "entry", entry: r });
    }
    i = j;
  }
  return out;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two = (n: number) => String(n).padStart(2, "0");

// "2 Oct, 14:40 UTC", with the year when it is not the reference year ("2 Oct 2025, ...").
// Always UTC, so the page delivered by a server and the page a browser draws agree.
export function stamp(iso: string, now: number = Date.now()): string {
  const t = parse(iso);
  if (!Number.isFinite(t)) return "an unreadable time";
  const d = new Date(t);
  const year = d.getUTCFullYear() === new Date(now).getUTCFullYear() ? "" : ` ${d.getUTCFullYear()}`;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${year}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`;
}

// "2 Oct": the day alone, for a sentence ("Restored version from 2 Oct").
export function dayOf(iso: string, now: number = Date.now()): string {
  return stamp(iso, now).replace(/, \d\d:\d\d UTC$/, "");
}

// "14:02 to 14:40 UTC" for a run inside one UTC day; with days when it spans more than one.
export function rangeText(fromIso: string, toIso: string, now: number = Date.now()): string {
  const a = new Date(parse(fromIso));
  const b = new Date(parse(toIso));
  const clock = (d: Date) => `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
  if (a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)) return `${clock(a)} to ${clock(b)} UTC`;
  return `${stamp(fromIso, now)} to ${stamp(toIso, now)}`;
}

// "12 autosaves", "2 autosaves".
export function runTitle(run: Pick<Run, "entries">): string {
  return `${run.entries.length} autosaves`;
}

export interface Picks {
  picked: string[];
  // True when a third pick was refused: two are picked already.
  blocked: boolean;
}

// Toggles one id in the picks. At most two: a third is refused (not swapped in), so the
// person chooses which to untick. Unpicking always works.
export function pickTwo(picked: readonly string[], id: string): Picks {
  if (picked.includes(id)) return { picked: picked.filter((p) => p !== id), blocked: false };
  if (picked.length >= 2) return { picked: [...picked], blocked: true };
  return { picked: [...picked, id], blocked: false };
}

// The pair in time order, older first, whichever was picked first. Ties keep the pick order.
export function orderPair(picked: readonly string[], at: (id: string) => number): [string, string] | null {
  const [a, b] = picked;
  if (a === undefined || b === undefined) return null;
  return at(b) < at(a) ? [b, a] : [a, b];
}

// The compare view's address: `?from=<older>&to=<newer>`, after `base` (a path, or "").
export function compareHref(base: string, older: string, newer: string): string {
  return `${base}?from=${encodeURIComponent(older)}&to=${encodeURIComponent(newer)}`;
}

export const PICK_NONE = "Pick two versions to compare.";
export const PICK_BLOCKED = "Two versions are picked; untick one first.";

export function pickedText(count: number, older?: string, newer?: string): string {
  if (count === 0) return PICK_NONE;
  if (count === 1) return "1 version picked. Pick one more.";
  return `2 versions picked. Older: ${older}. Newer: ${newer}. The older is always first, whichever you picked first.`;
}

// The line a restore adds on top: the restored text, as a new version.
export function restoredEntry(source: HistoryEntry, current: HistoryEntry, who: string, id: string, atIso: string, now: number = parse(atIso)): HistoryEntry {
  return {
    id,
    kind: "restore",
    who,
    at: atIso,
    words: source.words,
    delta: wordDelta(current.words, source.words),
    summary: `Restored the version from ${stamp(source.at, now)}`,
    restoredFrom: { id: source.id, at: source.at },
  };
}

export function restoredMessage(source: Pick<HistoryEntry, "at">, now: number = Date.now()): string {
  return `Restored version from ${dayOf(source.at, now)} as a new version.`;
}

export function destinationWord(s: Destination["status"]): string {
  return s === "live" ? "Live" : s === "failed" ? "Failed" : "Queued";
}

// ---------------------------------------------------------------------------------------
// DOM.

const SVG = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | boolean | undefined>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Array<Node | string>): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids);
  return el;
}

function svg(inner: string, size = 14): SVGSVGElement {
  const s = document.createElementNS(SVG, "svg");
  s.setAttribute("viewBox", "0 0 16 16");
  s.setAttribute("width", String(size));
  s.setAttribute("height", String(size));
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("focusable", "false");
  s.innerHTML = inner;
  return s;
}

const QUEUED_GLYPH = '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>';

export const SIGN_GLYPH: Record<Sign, string> = {
  plus: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 3v10M3 8h10"/>',
  minus: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 8h10"/>',
  zero: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 6h10M3 10h10"/>',
};

export function destinationGlyph(s: Destination["status"]): string {
  return s === "live" ? GLYPHS.ok : s === "failed" ? GLYPHS.failure : QUEUED_GLYPH;
}
export function destinationTone(s: Destination["status"]): string {
  return s === "live" ? "ok" : s === "failed" ? "crit" : "nodata";
}

function statusEl(tone: string, glyph: string, word: string): HTMLElement {
  return h("span", { class: "cap-status", "data-tone": tone }, svg(glyph), word);
}

function avatarEl(name: string, ai?: boolean): HTMLElement {
  // The name is text beside the avatar, so the avatar is hidden from screen readers.
  return h("span", { class: "cap-avatar", "data-size": "sm", "data-kind": ai ? "ai" : undefined, "aria-hidden": "true" }, h("span", { class: "cap-avatar-fallback" }, ai ? "AI" : initials(name)));
}

function whoEl(id: string, names: string[], ai?: boolean): HTMLElement {
  const first = names[0] ?? "";
  const label = names.length > 1 ? `${first} and ${names.length - 1} more` : first;
  return h("span", { class: "cap-hist-who", id }, avatarEl(first, ai), h("span", { class: "cap-hist-name" }, label));
}

function deltaEl(id: string, n: number): HTMLElement {
  const sign = deltaSign(n);
  return h("span", { class: "cap-hist-delta", id, "data-sign": sign }, svg(SIGN_GLYPH[sign], 12), h("span", {}, deltaText(n)));
}

function whenEl(id: string, iso: string, now: number, chevron = false): HTMLElement {
  const meta = h("span", { class: "cap-row-meta", id });
  meta.append(h("span", { class: "cap-hist-when" }, h("time", { class: "cap-time", "data-cap": "time", datetime: iso }, relative(parse(iso), now)), h("time", { class: "cap-hist-exact", datetime: iso }, stamp(iso, now))));
  if (chevron) meta.append(h("span", { class: "cap-row-chevron", "aria-hidden": "true" }));
  return meta;
}

export interface BuildOptions {
  // Prefix for the ids the line makes, so two lists on a page do not collide.
  prefix: string;
  current?: boolean;
  now?: number;
  // The address a line's title opens (the version's own page); "?version=" by default.
  versionHref?: string;
  // Load-into-editor mode: the action on an earlier line is a link to this address plus the
  // version's id (`?load=` is the usual tail), in place of Restore.
  loadHref?: string;
}

function detailFor(e: HistoryEntry, id: string, now: number): HTMLElement | null {
  const p = h("p", { class: "cap-row-detail", id });
  if (e.kind === "named") {
    p.append("Named version: ", h("b", {}, e.name ?? ""));
  } else if (e.kind === "publish") {
    p.append("Published to ");
    (e.destinations ?? []).forEach((d, i) => {
      if (i > 0) p.append(" ");
      p.append(h("span", { class: "cap-hist-dest" }, statusEl(destinationTone(d.status), destinationGlyph(d.status), destinationWord(d.status)), " ", d.name));
    });
  } else if (e.kind === "restore" && e.restoredFrom) {
    p.append(`Restored from ${stamp(e.restoredFrom.at, now)}`);
  } else if (e.kind === "autosave") {
    p.append("Autosave");
  } else {
    return null;
  }
  return p;
}

function pickEl(e: HistoryEntry, now: number): HTMLElement {
  const input = h("input", { type: "checkbox", name: "compare", value: e.id, "data-cap-part": "pick" });
  return h("span", { class: "cap-hist-pick" }, h("label", { class: "cap-check" }, input, h("span", { class: "cap-sr-only" }, `Compare this version, ${stamp(e.at, now)}, by ${e.who}`)));
}

function restoreButton(e: HistoryEntry, now: number): HTMLElement {
  return h("button", { type: "button", class: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "restore", "data-version": e.id }, "Restore", h("span", { class: "cap-sr-only" }, ` the version from ${stamp(e.at, now)} by ${e.who}`));
}

// Load into editor: a link, so the page works as delivered. Nothing is added to the history;
// the text goes to the editor and a save is what makes the version.
function loadLink(e: HistoryEntry, href: string, now: number): HTMLElement {
  return h("a", { class: "cap-btn", "data-variant": "quiet", "data-size": "sm", "data-cap-part": "load", "data-version": e.id, href: `${href}${encodeURIComponent(e.id)}` }, "Load into editor", h("span", { class: "cap-sr-only" }, ` the version from ${stamp(e.at, now)} by ${e.who}`));
}

function actionFor(e: HistoryEntry, now: number, loadHref?: string): HTMLElement {
  return loadHref ? loadLink(e, loadHref, now) : restoreButton(e, now);
}

// One line, exactly the markup the doc page shows (and the page is delivered with).
export function buildRow(e: HistoryEntry, delta: number, o: BuildOptions): HTMLLIElement {
  const now = o.now ?? Date.now();
  const p = `${o.prefix}-${e.id}`;
  const detail = detailFor(e, `${p}-d`, now);
  const described = [detail ? `${p}-d` : "", `${p}-w`, `${p}-t`].filter(Boolean).join(" ");
  const li = h("li", { class: "cap-row cap-hist-row", "data-kind": e.kind, "data-id": e.id, "data-at": e.at, "data-words": String(e.words), "data-who": e.who, "data-current": o.current ? "" : undefined });
  const title = h("div", { class: "cap-row-title" }, h("a", { href: `${o.versionHref ?? "?version="}${encodeURIComponent(e.id)}`, "aria-describedby": described, title: e.summary }, e.summary));
  const actions = h("div", { class: "cap-row-actions" }, o.current ? statusEl("ok", GLYPHS.ok, "Current") : actionFor(e, now, o.loadHref));
  li.append(pickEl(e, now), whoEl(`${p}-who`, [e.who], e.ai), title);
  if (detail) li.append(detail);
  li.append(deltaEl(`${p}-w`, delta), whenEl(`${p}-t`, e.at, now), actions);
  return li;
}

// The group line of a run of autosaves, and the region that holds its lines.
export function buildRun(run: Run, deltas: number[], o: BuildOptions): HTMLLIElement[] {
  const now = o.now ?? Date.now();
  const first = run.entries[0] as HistoryEntry;
  const p = `${o.prefix}-run-${first.id}`;
  const li = h("li", { class: "cap-row cap-hist-row", "data-kind": "run" });
  const button = h("button", { type: "button", "aria-expanded": "false", "aria-controls": `${p}-rows`, "aria-describedby": `${p}-d ${p}-w ${p}-t` }, runTitle(run));
  li.append(
    h("span", { class: "cap-hist-pick" }),
    whoEl(`${p}-who`, run.who),
    h("div", { class: "cap-row-title" }, button),
    h("p", { class: "cap-row-detail", id: `${p}-d` }, rangeText(run.from, run.to, now)),
    deltaEl(`${p}-w`, run.delta),
    whenEl(`${p}-t`, run.to, now, true),
    h("div", { class: "cap-row-actions" }),
  );
  const list = h("ul", { role: "list", "aria-label": runTitle(run) });
  run.entries.forEach((e, k) => list.append(buildRow(e, deltas[k] ?? 0, o)));
  const region = h("li", { class: "cap-hist-region", id: `${p}-rows`, hidden: true }, list);
  return [li, region];
}

// ---------------------------------------------------------------------------------------
// The behaviour.

const READY = "data-cap-ready";

function nowOf(root: Element): number {
  const fixed = root.closest<HTMLElement>("[data-cap-now]")?.dataset.capNow;
  return fixed ? parse(fixed) : Date.now();
}

const rowsOf = (root: HTMLElement) => root.querySelector<HTMLElement>(":scope > .cap-hist-list");

// A key typed into a text field, or with a modifier, is never a list shortcut. Unlike the row
// list's own check, a checkbox, a radio or a button is not typing: j and k must work from a
// pick box a person has just ticked.
const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|week|time)$/;
export function isTypingKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t instanceof HTMLInputElement) return TEXT_INPUT.test(t.type || "text");
  return t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']") !== null;
}

// j and k between the lines' titles, row-list's movement (moveRowFocus) with the check above.
// Attached once per list.
export function attachListKeys(list: HTMLElement): () => void {
  if (list.dataset.capKeys !== undefined) return () => {};
  list.dataset.capKeys = "";
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.key !== "j" && e.key !== "k")) return;
    if (isTypingKey(e) || singleKeysOff() || !listOwnsKeys(list)) return;
    if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement)) e.preventDefault();
  };
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("keydown", onKey);
    delete list.dataset.capKeys;
  };
}
const lineRows = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLLIElement>(".cap-hist-row[data-id]"));
const rowById = (root: HTMLElement, id: string) => lineRows(root).find((r) => r.dataset.id === id) ?? null;

// The status region for results and Undo is the page's one; where the page has none yet,
// one is placed after the list.
function ensureRegion(after: Element): void {
  if (document.querySelector("[data-cap='message']")) return;
  const region = h("div", { class: "cap-message", "data-cap": "message", role: "status", "aria-label": "Results and failures", "aria-atomic": "false" });
  after.after(region);
  enhanceMessage(region.parentNode ?? document);
}

function entryOf(row: HTMLElement): HistoryEntry {
  return { id: row.dataset.id ?? "", kind: (row.dataset.kind ?? "edit") as HistoryKind, who: row.dataset.who ?? "", at: row.dataset.at ?? "", words: Number(row.dataset.words ?? 0), summary: row.querySelector(".cap-row-title a")?.textContent ?? "" };
}

function setCurrent(root: HTMLElement, row: HTMLLIElement, current: boolean): void {
  const entry = entryOf(row);
  const actions = row.querySelector<HTMLElement>(".cap-row-actions");
  if (!actions) return;
  const now = nowOf(root);
  if (current) {
    row.dataset.current = "";
    actions.replaceChildren(statusEl("ok", GLYPHS.ok, "Current"));
  } else {
    delete row.dataset.current;
    actions.replaceChildren(actionFor(entry, now, root.dataset.loadHref));
  }
}

function currentRow(root: HTMLElement): HTMLLIElement | null {
  return root.querySelector<HTMLLIElement>(".cap-hist-row[data-current]");
}

export interface LoadDetail {
  // The line whose text goes to the editor.
  entry: HistoryEntry;
}

export interface RestoreDetail {
  // The line restored from, and the line a restore adds on top.
  source: HistoryEntry;
  entry: HistoryEntry;
}

// Restores a version: adds a new line on top, makes it current, says so with Undo. Nothing
// is overwritten; the line restored from stays. Fires `cap:history-restored` (and
// `cap:history-unrestored` on Undo) on the root, so the app can save or undo the new
// version on its server. Returns the new line, or null when the id is unknown.
export function restoreVersion(root: HTMLElement, id: string): HTMLLIElement | null {
  const list = rowsOf(root);
  const sourceRow = rowById(root, id);
  const previous = currentRow(root);
  if (!list || !sourceRow || !previous || sourceRow === previous) return null;
  const now = nowOf(root);
  const prefix = root.id || "cap-hist";
  const source = entryOf(sourceRow);
  const entry = restoredEntry(source, entryOf(previous), root.dataset.user || "You", `${id}-restored-${list.querySelectorAll("[data-kind='restore']").length + 1}`, new Date(now).toISOString(), now);
  const row = buildRow(entry, entry.delta ?? 0, { prefix, current: true, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref });
  setCurrent(root, previous, false);
  list.prepend(row);
  enhanceTime(row);
  root.dispatchEvent(new CustomEvent<RestoreDetail>("cap:history-restored", { bubbles: true, detail: { source, entry } }));
  ensureRegion(root);
  const opener = sourceRow.querySelector<HTMLElement>("[data-cap-part='restore']");
  say(restoredMessage(source, now), {
    undo: () => {
      row.remove();
      setCurrent(root, previous, true);
      syncPicks(root);
      root.dispatchEvent(new CustomEvent<RestoreDetail>("cap:history-unrestored", { bubbles: true, detail: { source, entry } }));
    },
    undone: "The restored copy was removed. The earlier version is current again.",
    returnFocus: () => (opener?.isConnected ? opener : (previous.querySelector<HTMLElement>(".cap-row-title a") ?? null)),
  });
  return row;
}

// Adds older lines at the foot (a page of history the app fetched). `more: false` removes
// the Load older control, because there is nothing older. A page should start on a line
// that is not an autosave, or a run is split in two at the join.
export function appendEntries(root: HTMLElement, entries: readonly HistoryEntry[], opts: { more?: boolean } = {}): void {
  const list = rowsOf(root);
  if (!list) return;
  const now = nowOf(root);
  const prefix = root.id || "cap-hist";
  const lines = condense(entries.map((e) => e));
  let index = 0;
  for (const line of lines) {
    if (line.type === "entry") {
      list.append(buildRow(line.entry, deltaOf(entries, index), { prefix, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref }));
      index += 1;
    } else {
      const deltas = line.entries.map((_e, k) => deltaOf(entries, index + k));
      list.append(...buildRun(line, deltas, { prefix, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref }));
      index += line.entries.length;
    }
  }
  enhanceTime(list);
  const more = root.querySelector<HTMLElement>("[data-cap-part='older']");
  if (more) {
    more.removeAttribute("aria-busy");
    if (opts.more === false) more.remove();
    else (more as HTMLAnchorElement).href = `?before=${encodeURIComponent((entries[entries.length - 1] as HistoryEntry).id)}`;
  }
  syncPicks(root);
}

// Reads the picks from the checkboxes, applies the "at most two" rule to the rest of them,
// and says what is picked. `blocked` says a third pick was just refused.
export function syncPicks(root: HTMLElement, blocked = false): string[] {
  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>("[data-cap-part='pick']"));
  const picked = boxes.filter((b) => b.checked).map((b) => b.value);
  const at = (id: string) => parse(rowById(root, id)?.dataset.at ?? "");
  const pair = orderPair(picked, at);
  for (const b of boxes) {
    if (!b.checked && picked.length >= 2) b.setAttribute("aria-disabled", "true");
    else b.removeAttribute("aria-disabled");
  }
  const now = nowOf(root);
  const status = root.querySelector<HTMLElement>("[data-cap-part='picked']");
  if (status) {
    const text = pair ? pickedText(2, stamp(rowById(root, pair[0])?.dataset.at ?? "", now), stamp(rowById(root, pair[1])?.dataset.at ?? "", now)) : pickedText(picked.length);
    status.textContent = blocked ? PICK_BLOCKED : text;
  }
  const link = root.querySelector<HTMLAnchorElement>("[data-cap-part='compare']");
  if (link) {
    if (pair) {
      link.href = compareHref(root.dataset.compareHref ?? "", pair[0], pair[1]);
      link.removeAttribute("aria-disabled");
      link.removeAttribute("role");
      link.removeAttribute("tabindex");
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("role", "link");
      link.setAttribute("tabindex", "0");
    }
  }
  root.dataset.picked = String(picked.length);
  return picked;
}

// Attaches to every [data-cap="history-list"] under root not yet attached: j and k on its
// list, the group lines that open, the picks, Restore and Load older. Returns a function
// that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='history-list']")) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    const list = rowsOf(el);
    if (list) undo.push(attachListKeys(list));
    enhanceTime(el);

    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      const group = t.closest<HTMLElement>("button[aria-expanded][aria-controls]");
      if (group && el.contains(group)) return toggleGroup(group);
      const box = t.closest<HTMLInputElement>("[data-cap-part='pick']");
      if (box && box.getAttribute("aria-disabled") === "true") {
        // A third pick: refused, and said.
        e.preventDefault();
        syncPicks(el, true);
        return;
      }
      const restore = t.closest<HTMLElement>("[data-cap-part='restore']");
      if (restore) return void restoreVersion(el, restore.dataset.version ?? "");
      const load = t.closest<HTMLAnchorElement>("[data-cap-part='load']");
      if (load) {
        // The app may load the text into its own editor: cancel the event and do it. Without
        // a listener the link is followed, so the page works as delivered.
        const row = load.closest<HTMLElement>(".cap-hist-row");
        if (row && !el.dispatchEvent(new CustomEvent<LoadDetail>("cap:history-load", { bubbles: true, cancelable: true, detail: { entry: entryOf(row) } }))) e.preventDefault();
        return;
      }
      const compare = t.closest<HTMLElement>("[data-cap-part='compare']");
      if (compare && compare.getAttribute("aria-disabled") === "true") {
        e.preventDefault();
        const status = el.querySelector<HTMLElement>("[data-cap-part='picked']");
        if (status) status.textContent = PICK_NONE;
        return;
      }
      const older = t.closest<HTMLAnchorElement>("[data-cap-part='older']");
      if (older) {
        // The app may fetch the page itself: cancel the event and call appendEntries. Without
        // a listener the link is followed, so the page works as delivered.
        const last = lineRows(el).at(-1)?.dataset.id ?? "";
        const handled = !el.dispatchEvent(new CustomEvent("cap:history-older", { bubbles: true, cancelable: true, detail: { before: last } }));
        if (handled) {
          e.preventDefault();
          older.setAttribute("aria-busy", "true");
        }
      }
    };
    const onChange = (e: Event) => {
      if ((e.target as Element).matches("[data-cap-part='pick']")) syncPicks(el);
    };
    // A space on the aria-disabled compare link is a press, as on a button.
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === " " && t.matches("[data-cap-part='compare']")) {
        e.preventDefault();
        t.click();
      }
    };
    el.addEventListener("click", onClick);
    el.addEventListener("change", onChange);
    el.addEventListener("keydown", onKey);
    syncPicks(el);
    undo.push(() => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("change", onChange);
      el.removeEventListener("keydown", onKey);
      el.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
