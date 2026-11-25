// The media library's view of its tiles: which are shown (Library or Trash, search, filter chips),
// the empty state and the count, the chip and tab counts, and the sort. Each reads and writes the
// DOM under one library root; the controller decides what the active tile does afterwards.

import { countText } from "../content/content.ts";
import { moveNode } from "../sortable-list/sortable-list.ts";
import { LARGE_BYTES, unattached } from "./media-record.ts";
import { recordOf } from "./media-tile.ts";

export const tilesOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(".cap-media-tile"));
export const boxOf = (t: HTMLElement) =>
  t.querySelector<HTMLInputElement>(".cap-media-check > input");
export const chipsGroup = (root: HTMLElement) =>
  root.querySelector<HTMLElement>("[data-cap-part='filters']");

const view = (root: HTMLElement) =>
  root.querySelector<HTMLInputElement>("[data-cap-part='view'] input:checked")?.value ?? "library";
const query = (root: HTMLElement) =>
  (root.querySelector<HTMLInputElement>("[data-cap-part='search']")?.value ?? "")
    .trim()
    .toLowerCase();
const pressed = (root: HTMLElement) => {
  const g = chipsGroup(root);
  return g
    ? Array.from(g.querySelectorAll<HTMLElement>(".cap-chip[aria-pressed='true']")).map(
        (c) => c.dataset.value ?? "",
      )
    : [];
};
const matchesFilter = (t: HTMLElement, name: string): boolean => {
  const r = recordOf(t);
  if (name === "unattached") return unattached(r);
  if (name === "no-alt") return r.kind === "image" && r.altState === "missing";
  if (name === "large") return r.bytes > LARGE_BYTES;
  return true;
};
const haystack = (t: HTMLElement) =>
  [
    t.dataset.label,
    t.dataset.altText,
    t.dataset.title,
    t.dataset.caption,
    t.dataset.tags,
    t.dataset.key,
  ]
    .join(" ")
    .toLowerCase();

// Shows the tiles the view, the search and the chips let through, and says how many. An upload in
// progress or a failed one stays in view: it is not a search result, it is news.
export function applyView(root: HTMLElement, announce: boolean): void {
  const v = view(root);
  const q = query(root);
  const names = pressed(root);
  const tiles = tilesOf(root);
  let visible = 0;
  let matchable = 0;
  for (const t of tiles) {
    const state = t.dataset.state ?? "ready";
    const inView = v === "bin" ? state === "binned" : state !== "binned";
    let show = inView;
    const settled = state === "ready" || state === "binned";
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
  for (const g of root.querySelectorAll<HTMLElement>(".cap-media-group"))
    g.hidden = !g.querySelector(".cap-media-tile:not([hidden])");
  const empty = root.querySelector<HTMLElement>(".cap-media-empty");
  if (empty) {
    const narrowed = !!q || names.length > 0;
    const none = visible === 0 || (matchable === 0 && narrowed && v === "library");
    const cause = !none
      ? ""
      : v === "bin"
        ? "bin"
        : q
          ? "search"
          : names.length
            ? "filter"
            : "library";
    empty.hidden = !none;
    for (const child of empty.querySelectorAll<HTMLElement>("[data-cap-empty]"))
      child.hidden = child.dataset.capEmpty !== cause;
  }
  const count = root.querySelector<HTMLElement>(".cap-media-count");
  if (count && announce) {
    const total = tiles.filter((t) =>
      v === "bin" ? t.dataset.state === "binned" : t.dataset.state === "ready",
    ).length;
    count.textContent =
      v === "bin"
        ? `${matchable} in Trash`
        : countText(matchable, total, { noun: "file", plural: "files" });
  }
}

// The counts on the filter chips and on the Library and Trash tabs.
export function updateCounts(root: HTMLElement): void {
  const g = chipsGroup(root);
  const tiles = tilesOf(root);
  const lib = tiles.filter((t) => t.dataset.state === "ready");
  if (g) {
    for (const chip of g.querySelectorAll<HTMLElement>(".cap-chip")) {
      const n = lib.filter((t) => matchesFilter(t, chip.dataset.value ?? "")).length;
      const el = chip.querySelector<HTMLElement>(".cap-chip-count");
      if (el) el.textContent = String(n);
    }
  }
  const nBin = tiles.filter((t) => t.dataset.state === "binned").length;
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap-count='library']"))
    el.textContent = String(lib.length);
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap-count='bin']"))
    el.textContent = String(nBin);
}

// Orders each group by the chosen sort, uploads and failures first, moving each tile whole
// (moveNode) so focus and state stay, and puts focus back if a move dropped it.
export function sortTiles(root: HTMLElement): void {
  const by =
    root.querySelector<HTMLInputElement>("[data-cap-part='sort'] input:checked")?.value ?? "";
  if (!by) return;
  const focused = document.activeElement;
  const settledFirst = (t: HTMLElement) =>
    t.dataset.state === "uploading" || t.dataset.state === "failed" ? 0 : 1;
  const cmp = (a: HTMLElement, b: HTMLElement): number => {
    const pending = settledFirst(a) - settledFirst(b);
    if (pending !== 0) return pending;
    if (by === "name")
      return (a.dataset.label ?? "").localeCompare(b.dataset.label ?? "", undefined, {
        numeric: true,
        sensitivity: "base",
      });
    if (by === "size") return Number(b.dataset.bytes ?? 0) - Number(a.dataset.bytes ?? 0);
    return (b.dataset.uploaded ?? "").localeCompare(a.dataset.uploaded ?? "");
  };
  for (const grid of root.querySelectorAll<HTMLElement>(".cap-media-grid")) {
    const list = Array.from(grid.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c.classList.contains("cap-media-tile"),
    );
    const sorted = list.slice().sort(cmp);
    if (sorted.every((t, i) => t === list[i])) continue;
    for (const t of sorted) moveNode(grid, t, null);
  }
  if (focused instanceof HTMLElement && focused.isConnected && document.activeElement !== focused)
    focused.focus({ preventScroll: true });
}
