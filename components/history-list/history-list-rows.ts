// The history list's rows, built as the server would render them (history-list.ts).

import { initials } from "../avatar/avatar.ts";
import { GLYPHS, glyphSvg } from "../message/message.ts";
import { parse, relative } from "../time/time.ts";
import { type Destination, type HistoryEntry, type Run, type Sign, deltaSign, deltaText, destinationWord, rangeText, runTitle, stamp } from "./history-list-model.ts";

// ---------------------------------------------------------------------------------------
// DOM.

type Attrs = Record<string, string | boolean | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: Array<Node | string | null>): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids.filter((k): k is Node | string => k !== null));
  return el;
}

const QUEUED_GLYPH = '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/>';

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

export function statusEl(tone: string, glyph: string, word: string): HTMLElement {
  return h("span", { class: "cap-status", "data-tone": tone }, glyphSvg(glyph), word);
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

function deltaEl(id: string, n: number | undefined): HTMLElement {
  // No word count: an empty cell keeps the columns in place and says nothing.
  if (n === undefined) return h("span", { class: "cap-hist-delta", "data-sign": "none", "aria-hidden": "true" });
  const sign = deltaSign(n);
  return h("span", { class: "cap-hist-delta", id, "data-sign": sign }, glyphSvg(SIGN_GLYPH[sign], 12), h("span", {}, deltaText(n)));
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
  // A read-only history: an earlier line has no action at all, neither Restore nor Load.
  readOnly?: boolean;
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

export function actionFor(e: HistoryEntry, now: number, o: BuildOptions): HTMLElement | null {
  if (o.readOnly) return null;
  return o.loadHref ? loadLink(e, o.loadHref, now) : restoreButton(e, now);
}

// One line, exactly the markup the doc page shows (and the page is delivered with).
export function buildRow(e: HistoryEntry, delta: number | undefined, o: BuildOptions): HTMLLIElement {
  const now = o.now ?? Date.now();
  const p = `${o.prefix}-${e.id}`;
  const detail = detailFor(e, `${p}-d`, now);
  const described = [detail ? `${p}-d` : "", delta === undefined ? "" : `${p}-w`, `${p}-t`].filter(Boolean).join(" ");
  const li = h("li", { class: "cap-row cap-hist-row", "data-kind": e.kind, "data-id": e.id, "data-at": e.at, "data-words": e.words === undefined ? undefined : String(e.words), "data-who": e.who, "data-current": o.current ? "" : undefined });
  const title = h("div", { class: "cap-row-title" }, h("a", { href: `${o.versionHref ?? "?version="}${encodeURIComponent(e.id)}`, "aria-describedby": described, title: e.summary }, e.summary));
  const actions = h("div", { class: "cap-row-actions" }, o.current ? statusEl("ok", GLYPHS.ok, "Current") : actionFor(e, now, o));
  li.append(pickEl(e, now), whoEl(`${p}-who`, [e.who], e.ai), title);
  if (detail) li.append(detail);
  li.append(deltaEl(`${p}-w`, delta), whenEl(`${p}-t`, e.at, now), actions);
  return li;
}

// The group line of a run of autosaves, and the region that holds its lines.
export function buildRun(run: Run, deltas: (number | undefined)[], o: BuildOptions): HTMLLIElement[] {
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
  run.entries.forEach((e, k) => list.append(buildRow(e, deltas[k], o)));
  const region = h("li", { class: "cap-hist-region", id: `${p}-rows`, hidden: true }, list);
  return [li, region];
}
