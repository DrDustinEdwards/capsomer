// The media library's behavior: a grid of tiles with roving focus and two-dimensional arrow keys,
// selection by real checkboxes, an inspector that sits beside the grid (a pane) or over it (a
// side sheet) and SAVES BY ITSELF, the copy button, the filters, search, Trash and Restore.
// The arrow keys read the rendered boxes, not a column count; alt text has three states; an
// unattached file is not an unused one. The inspector saves after typing stops, with a live
// status that never loses typed text. No framework; the React wrapper uses the same pure
// functions.

import { enhance as enhanceMeters } from "../meter/meter.ts";
import { openDialog, wireDialog } from "../dialog/dialog.ts";
import { fail } from "../message/message.ts";
import { singleKeysOff } from "../shortcuts/shortcuts.ts";
import { performBulk, type BulkHandler, type BulkItem } from "../bulk-bar/bulk-bar.ts";
import { altStateOf, describeRecord, LARGE_BYTES, parseTags, type MediaFields, type MediaRecord } from "./media-record.ts";
import { bands, nextTile, type Direction } from "./media-grid.ts";
import { createAutosave, type Autosave, type SaveState } from "./media-autosave.ts";
import { applyBulkTag, COPIED_MS, COPY_FAILED_MS, copyText } from "./media-actions.ts";
import { buildTile, glyph, part, recordOf, syncTile, writeRecord } from "./media-tile.ts";
import { fillInspector, readFields, renderSave as renderSaveState, renderTags } from "./media-inspector.ts";

export * from "./media-record.ts";
export * from "./media-grid.ts";
export * from "./media-autosave.ts";
export * from "./media-actions.ts";
export * from "./media-crop.ts";
export { buildTile, glyph, recordOf, syncTile, writeRecord } from "./media-tile.ts";

const READY = "data-cap-ready";

// ---------------------------------------------------------------------------------------
// The controller.

export interface MediaOptions {
  // Sends the inspector's fields. Reject with an Error that says why. Default: a POST of the
  // inspector's form to its action.
  save?: (key: string, fields: MediaFields) => Promise<void>;
  // Persist a move to Trash, a restore, a retry. Each rejects with an Error that says why.
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
  let session = 0;
  const drafts = new Map<string, MediaFields>();
  let autosave: Autosave | null = null;
  const ins = <T extends HTMLElement = HTMLElement>(name: string) => (inspector ? part<T>(inspector, name) : null);

  const renderSave = (state: SaveState, error?: string) => renderSaveState(inspector, state, error);

  // Writes a record into the inspector's fields and lists. Idempotent: the server's own markup
  // for the first file is what this would write.
  const fill = (tile: HTMLElement) => {
    if (!inspector) return;
    const r = recordOf(tile);
    const draft = drafts.get(r.key);
    startSession(tile);
    fillInspector(inspector, r, draft);
    syncRoving();
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
            const fields = readFields(inspector);
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

  const setTags = (tags: string[]) => {
    const r = current ? recordOf(current) : null;
    renderTags(inspector, tags, r?.suggestedTags ?? []);
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

  // Where the active tile goes when it leaves the view (binned, filtered out): the next file that can be
  // opened, else the one before it. An upload in progress is not a file to look at yet.
  const settled = (t: HTMLElement) => t.dataset.state === "ready" || t.dataset.state === "binned";
  const successor = (from: HTMLElement): HTMLElement | null => {
    const list = shown();
    const after = list.find((t) => settled(t) && from.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (after) return after;
    const before = [...list].reverse().find((t) => settled(t) && from.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING);
    return before ?? list.find(settled) ?? list[0] ?? null;
  };

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
      count.textContent = v === "bin" ? `${matchable} in Trash` : matchable === total ? `${matchable} ${matchable === 1 ? "file" : "files"}` : `${matchable} of ${total} files`;
    }
    if (active && (active.hidden || active.closest("[hidden]"))) {
      const first = successor(active);
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

  // ---- order: within each group, as the sort says. An upload in progress or a failed one stays first.
  const sortBy = () => root.querySelector<HTMLInputElement>("[data-cap-part='sort'] input:checked")?.value ?? "";
  const applySort = () => {
    const by = sortBy();
    if (!by) return;
    const focused = document.activeElement;
    const settledFirst = (t: HTMLElement) => (t.dataset.state === "uploading" || t.dataset.state === "failed" ? 0 : 1);
    const cmp = (a: HTMLElement, b: HTMLElement): number => {
      const pending = settledFirst(a) - settledFirst(b);
      if (pending !== 0) return pending;
      if (by === "name") return (a.dataset.label ?? "").localeCompare(b.dataset.label ?? "", undefined, { numeric: true, sensitivity: "base" });
      if (by === "size") return Number(b.dataset.bytes ?? 0) - Number(a.dataset.bytes ?? 0);
      return (b.dataset.uploaded ?? "").localeCompare(a.dataset.uploaded ?? "");
    };
    for (const grid of root.querySelectorAll<HTMLElement>(".cap-media-grid")) {
      const list = Array.from(grid.children).filter((c): c is HTMLElement => c instanceof HTMLElement && c.classList.contains("cap-media-tile"));
      const sorted = list.slice().sort(cmp);
      if (sorted.every((t, i) => t === list[i])) continue;
      grid.append(...sorted);
    }
    // Moving a node can drop focus; put it back.
    if (focused instanceof HTMLElement && focused.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
  };

  // ---- Trash.
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
      said: keys.length === 1 ? `Moved ${byKey(keys[0] ?? "")?.dataset.label ?? "the file"} to Trash.` : "Moved {n} files to Trash.",
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
      undone: keys.length === 1 ? "Put it back in Trash." : "Put {n} files back in Trash.",
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
    else if (t.closest("[data-cap-part='layout']")) root.dataset.view = t.value;
    else if (t.closest("[data-cap-part='sort']")) {
      applySort();
      syncRoving();
    }
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
      copiedTimer = setTimeout(() => status.replaceChildren(), ok ? COPIED_MS : COPY_FAILED_MS);
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
  applySort();
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
      applySort();
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
        applySort();
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
      bin: { run: (items) => rawBin(items.map((i) => i.id), "binned"), undo: (items) => rawBin(items.map((i) => i.id), "ready"), said: "Moved {n} file{s} to Trash.", undone: "Put {n} file{s} back in the library." },
      restore: { run: (items) => rawBin(items.map((i) => i.id), "ready"), undo: (items) => rawBin(items.map((i) => i.id), "binned"), said: "Restored {n} file{s} to the library.", undone: "Put {n} file{s} back in Trash." },
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
