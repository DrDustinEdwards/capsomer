// The history list's behaviour and its pure helpers. One line per change; autosaves fold
// into one line that opens in place; any two lines can be picked to compare; restoring a
// line makes a NEW version on top and offers Undo, so nothing is ever overwritten.
//
// The page is delivered with every line in the HTML. This module adds what only a person's
// action creates: the picks, the restore, the group that opens, a page of older lines.
// No framework; the React wrapper uses the same helpers.
import { toggleGroup } from "../disclosure/disclosure.ts";
import { GLYPHS, enhance as enhanceMessage, say } from "../message/message.ts";
import { isTypingKey, listOwnsKeys, moveRowFocus, singleKeysOff } from "../row-list/row-list.ts";
import { enhance as enhanceTime, parse } from "../time/time.ts";
import { type HistoryEntry, type HistoryKind, PICK_BLOCKED, PICK_NONE, compareHref, condense, deltaOf, orderPair, pickedText, restoredEntry, restoredMessage, stamp } from "./history-list-model.ts";
import { actionFor, buildRow, buildRun, h, statusEl } from "./history-list-rows.ts";

export { countWords, wordDelta, deltaSign, deltaText, deltaOf, condense, stamp, dayOf, rangeText, runTitle, pickTwo, orderPair, compareHref, PICK_NONE, PICK_BLOCKED, pickedText, restoredEntry, restoredMessage, destinationWord } from "./history-list-model.ts";
export type { HistoryKind, Destination, HistoryEntry, Run, Single, Line, Sign, Picks } from "./history-list-model.ts";
export { SIGN_GLYPH, destinationGlyph, destinationTone, buildRow, buildRun } from "./history-list-rows.ts";
export type { BuildOptions } from "./history-list-rows.ts";

export { isTypingKey };

// ---------------------------------------------------------------------------------------
// The behaviour.

const READY = "data-cap-ready";

function nowOf(root: Element): number {
  const fixed = root.closest<HTMLElement>("[data-cap-now]")?.dataset.capNow;
  return fixed ? parse(fixed) : Date.now();
}

const rowsOf = (root: HTMLElement) => root.querySelector<HTMLElement>(":scope > .cap-hist-list");

// j and k between the lines' titles, row-list's movement (moveRowFocus) with its isTypingKey check.
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
  return { id: row.dataset.id ?? "", kind: (row.dataset.kind ?? "edit") as HistoryKind, who: row.dataset.who ?? "", at: row.dataset.at ?? "", ...(row.dataset.words !== undefined ? { words: Number(row.dataset.words) } : {}), summary: row.querySelector(".cap-row-title a")?.textContent ?? "" };
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
    actions.replaceChildren(...[actionFor(entry, now, { prefix: "", loadHref: root.dataset.loadHref, readOnly: root.dataset.readonly !== undefined })].filter((a): a is HTMLElement => a !== null));
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
  const row = buildRow(entry, entry.delta, { prefix, current: true, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref, readOnly: root.dataset.readonly !== undefined });
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
      list.append(buildRow(line.entry, deltaOf(entries, index), { prefix, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref, readOnly: root.dataset.readonly !== undefined }));
      index += 1;
    } else {
      const deltas = line.entries.map((_e, k) => deltaOf(entries, index + k));
      list.append(...buildRun(line, deltas, { prefix, now, versionHref: root.dataset.versionHref, loadHref: root.dataset.loadHref, readOnly: root.dataset.readonly !== undefined }));
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
