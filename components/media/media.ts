// The media library's behavior: a grid of tiles with roving focus and two-dimensional arrow keys,
// selection by real checkboxes, an inspector that sits beside the grid (a pane) or over it (a
// side sheet) and SAVES BY ITSELF, the copy button, the filters, search, Trash and Restore.
// The arrow keys read the rendered boxes, not a column count; alt text has three states; an
// unattached file is not an unused one. The inspector saves after typing stops, with a live
// status that never loses typed text. No framework; the React wrapper uses the same pure
// functions. The inspector is media-panel.ts, the view of the tiles media-filter.ts and the
// bulk actions media-bulk.ts.

import { enhance as enhanceMeters } from "../meter/meter.ts";
import { isImeEnter, singleKeysOff } from "../shortcuts/shortcuts.ts";
import { type BulkHandler } from "../bulk-bar/bulk-bar.ts";
import { type MediaRecord } from "./media-record.ts";
import { bands, nextTile, type Direction } from "./media-grid.ts";
import { createBulk, type MediaOptions } from "./media-bulk.ts";
import { applySort, applyView, boxOf, chipsGroup, tilesOf, updateCounts } from "./media-filter.ts";
import { createPanel } from "./media-panel.ts";
import { buildTile, recordOf, showProgress, syncTile, writeRecord } from "./media-tile.ts";

export * from "./media-record.ts";
export * from "./media-grid.ts";
export * from "./media-autosave.ts";
export * from "./media-actions.ts";
export * from "./media-crop.ts";
export type { MediaOptions } from "./media-bulk.ts";
export { buildTile, recordOf, syncTile, writeRecord } from "./media-tile.ts";

const READY = "data-cap-ready";
const TILE_CONTROLS =
  ".cap-media-open, .cap-media-check > input, [data-cap-part='retry'], [data-cap-part='restore']";

// The controller.

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

export function attachMedia(root: HTMLElement, options: MediaOptions = {}): MediaController {
  const existing = controllers.get(root);
  if (existing) return existing;
  root.setAttribute(READY, "");
  const layout = root.querySelector<HTMLElement>(".cap-media-layout") ?? root;
  const inspector = root.querySelector<HTMLDialogElement>("dialog.cap-media-inspector");
  const tiles = () => tilesOf(root);
  const shown = () => tiles().filter((t) => !t.hidden && !t.closest("[hidden]"));
  const cleanups: Array<() => void> = [];
  const listen = (
    el: HTMLElement | Document | Window,
    type: string,
    fn: (e: never) => void,
    opts?: AddEventListenerOptions,
  ) => {
    el.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener, opts));
  };

  let active: HTMLElement | null =
    root.querySelector<HTMLElement>(".cap-media-tile[data-active]") ?? shown()[0] ?? null;
  let anchor: HTMLElement | null = null;
  const tileOf = (el: Element | null) => el?.closest<HTMLElement>(".cap-media-tile") ?? null;
  const byKey = (key: string) => tiles().find((t) => t.dataset.key === key) ?? null;
  const modeOf = () =>
    getComputedStyle(layout).getPropertyValue("--cap-media-mode").trim() === "pane"
      ? "pane"
      : "sheet";
  const openLink = (t: HTMLElement | null) =>
    t?.querySelector<HTMLElement>(".cap-media-open") ?? null;

  const controlsOf = (t: HTMLElement) => Array.from(t.querySelectorAll<HTMLElement>(TILE_CONTROLS));
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

  const syncSelected = (t: HTMLElement) => {
    if (boxOf(t)?.checked) t.setAttribute("data-selected", "");
    else t.removeAttribute("data-selected");
  };
  const selectedKeys = () =>
    tiles()
      .filter((t) => boxOf(t)?.checked)
      .map((t) => t.dataset.key ?? "");
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

  const counts = () => updateCounts(root);
  const refresh = () => {
    applyFilters();
    counts();
  };
  const bulk = createBulk({
    options,
    byKey,
    refresh,
    counts,
    returnTo: () => openLink(active),
  });
  const panel = inspector
    ? createPanel({
        root,
        inspector,
        options,
        listen,
        modeOf,
        active: () => active,
        setActive,
        focusTile,
        move,
        openLink,
        syncRoving,
        saved: () => {
          applyFilters(false);
          counts();
        },
        bin: bulk.bin,
        restore: bulk.restore,
      })
    : null;

  // Where the active tile goes when it leaves the view (binned, filtered out): the next file that can be
  // opened, else the one before it. An upload in progress is not a file to look at yet.
  const settled = (t: HTMLElement) => t.dataset.state === "ready" || t.dataset.state === "binned";
  const successor = (from: HTMLElement): HTMLElement | null => {
    const list = shown();
    const after = list.find(
      (t) => settled(t) && from.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    if (after) return after;
    const before = [...list]
      .reverse()
      .find(
        (t) => settled(t) && from.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING,
      );
    return before ?? list.find(settled) ?? list[0] ?? null;
  };

  function applyFilters(announce = true) {
    applyView(root, announce);
    if (active && (active.hidden || active.closest("[hidden]"))) {
      const first = successor(active);
      setActive(first);
      if (inspector?.open) {
        if (first) panel?.show(first);
        else panel?.close({ focus: false });
      }
    } else if (!active) setActive(shown()[0] ?? null);
    syncRoving();
  }

  listen(root, "change", (e: Event) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || inspector?.contains(t)) return;
    const tile = tileOf(t);
    if (tile && t.closest(".cap-media-check")) {
      syncSelected(tile);
      anchor = tile;
    } else if (t.closest("[data-cap-part='view']")) applyFilters();
    else if (t.closest("[data-cap-part='size']")) root.dataset.size = t.value;
    else if (t.closest("[data-cap-part='layout']")) root.dataset.view = t.value;
    else if (t.closest("[data-cap-part='sort']")) {
      applySort(root);
      syncRoving();
    }
  });

  listen(root, "input", (e: Event) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.dataset.capPart === "search") applyFilters();
  });

  listen(root, "cap:filter-change", () => applyFilters());

  listen(root, "focusin", (e: FocusEvent) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const tile = tileOf(t);
    if (!tile || inspector?.contains(t)) return;
    if (tile !== active) setActive(tile);
    panel?.follow(tile);
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
      return panel?.open(tile, { focus: true });
    }
    const key = tile?.dataset.key ?? "";
    if (tile && target.closest("[data-cap-part='retry']")) {
      tile.dispatchEvent(new CustomEvent("cap-media-retry", { bubbles: true, detail: { key } }));
      void options.retry?.(key);
    } else if (tile && target.closest("[data-cap-part='restore']")) void bulk.restore([key]);
    else if (target.closest("[data-cap-part='clear-search']")) {
      const search = root.querySelector<HTMLInputElement>("[data-cap-part='search']");
      if (search) {
        search.value = "";
        applyFilters();
        search.focus();
      }
    } else if (target.closest("[data-cap-part='clear-filters']"))
      chipsGroup(root)?.querySelector<HTMLElement>("[data-cap-part='clear']")?.click();
  });

  // Keys on a tile's own controls: the arrows, Home and End move between tiles; Space and x select.
  listen(root, "keydown", (e: KeyboardEvent) => {
    const t = e.target instanceof HTMLElement ? e.target : null;
    if (!t || e.defaultPrevented || e.isComposing || isImeEnter(e) || inspector?.contains(t))
      return;
    const tile = tileOf(t);
    if (!tile || e.ctrlKey || e.metaKey || e.altKey || !t.matches(TILE_CONTROLS)) return;
    const dirs: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      Home: "first",
      End: "last",
    };
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

  for (const t of tiles()) syncSelected(t);
  applySort(root);
  if (inspector?.open) {
    if (modeOf() === "sheet") inspector.close();
    else if (active) panel?.adopt(active);
  }
  syncRoving();
  enhanceMeters(root);
  applyFilters(false);
  counts();

  const controller: MediaController = {
    open: (key) => {
      const t = byKey(key);
      if (t) panel?.open(t, { focus: false });
    },
    close: () => panel?.close(),
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
        (root.querySelector(".cap-media-empty") ?? root.querySelector(".cap-media-main"))?.before(
          grid,
        );
      }
      grid.prepend(t);
      applySort(root);
      refresh();
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
        applySort(root);
        refresh();
        return;
      }
      if (wasKey !== t.dataset.key) t.dataset.key = patch.key ?? wasKey ?? "";
      if (patch.progress !== undefined && t.dataset.state === "uploading") {
        if (showProgress(t, patch.progress)) return;
      }
      syncTile(t);
      refresh();
    },
    bin: bulk.bin,
    restore: bulk.restore,
    bulkHandlers: bulk.handlers,
    refresh: () => {
      refresh();
      syncRoving();
    },
    detach: () => {
      cleanups.forEach((f) => f());
      panel?.detach();
      controllers.delete(root);
      root.removeAttribute(READY);
    },
  };

  controllers.set(root, controller);
  return controller;
}

// Attaches to every [data-cap="media"] under root not yet attached (with the default save, a POST
// of the inspector's form). Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(
    root.querySelectorAll<HTMLElement>("[data-cap='media']:not([data-cap-ready])"),
  ).map((el) => attachMedia(el).detach);
  return () => undo.forEach((f) => f());
}
