// The sortable list: rows or cards a person puts in order, by dragging a handle, by the
// keyboard (pick up, move, drop) or by the Move up and Move down buttons, which are also the
// one-pointer way that WCAG 2.5.7 asks for and, as submit buttons, the way with no script.
// The list owns no storage: every finished move is a `cap:sortable-change` event with the
// new order, and the host saves it. No framework; the React wrapper uses the same functions.

// ---------------------------------------------------------------------------------------
// Pure functions.

export interface SortMove {
  id: string;
  // Zero-based positions, before and after.
  from: number;
  to: number;
}

// The order with `id` moved to position `to` (clamped to the list).
export function moveId(order: readonly string[], id: string, to: number): string[] {
  const from = order.indexOf(id);
  if (from < 0) return [...order];
  const out = order.filter((x) => x !== id);
  out.splice(Math.max(0, Math.min(out.length, to)), 0, id);
  return out;
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Where an item dragged to (x, y) belongs, from the boxes of the other items in their
// current order. Rows: how many other rows have their middle above the pointer. Cards (a
// wrapping grid): how many other cards come before the pointer in reading order, that is
// above its line, or on its line and left of it. Counting the others, never the dragged
// item, keeps the answer steady as the list rearranges under the pointer.
export function indexAtPoint(
  others: readonly Box[],
  x: number,
  y: number,
  layout: Layout = "rows",
): number {
  let n = 0;
  for (const b of others) {
    const midY = b.top + b.height / 2;
    if (layout !== "cards") {
      if (midY < y) n += 1;
    } else if (b.top + b.height <= y) n += 1;
    else if (b.top <= y && b.left + b.width / 2 < x) n += 1;
  }
  return n;
}

// "rows": one per line. "cards": a wrapping grid. "stack": one per line, each a card with its handle and
// buttons on a head line over its content (a form row, a step with its own fields).
export type Layout = "rows" | "cards" | "stack";

// A set of lists whose items can move between them: list id to the item ids in order.
export type Lists = Record<string, string[]>;

// Where an id is: its list and its zero-based place in it, or null.
export function locate(lists: Lists, id: string): { list: string; index: number } | null {
  for (const [list, ids] of Object.entries(lists)) {
    const index = ids.indexOf(id);
    if (index >= 0) return { list, index };
  }
  return null;
}

// The lists with `id` taken out of wherever it is and put in `toList` at `to` (clamped). Neither
// the input nor an unknown id's lists are changed.
export function moveBetween(lists: Lists, id: string, toList: string, to: number): Lists {
  if (!locate(lists, id) || !(toList in lists)) return lists;
  const out: Lists = {};
  for (const [list, ids] of Object.entries(lists)) out[list] = ids.filter((x) => x !== id);
  const target = out[toList] ?? [];
  target.splice(Math.max(0, Math.min(target.length, to)), 0, id);
  return out;
}

// The place a key moves an item that is up to, across lists: the position in its own list as
// keyTarget gives it, and at either end of the list the same arrow goes on into the end of the
// list before it or the start of the one after. `sizes` are the lengths of the lists in order,
// `list` the position of the item's list among them. Null for a key that does not move it.
export function keyMove(
  key: string,
  at: { list: number; index: number },
  sizes: readonly number[],
): { list: number; index: number } | null {
  const count = sizes[at.list] ?? 0;
  const to = keyTarget(key, at.index, count);
  if (to === null) return null;
  if (to !== at.index) return { list: at.list, index: to };
  const back = key === "ArrowUp" || key === "ArrowLeft";
  const forward = key === "ArrowDown" || key === "ArrowRight";
  if (back && at.index === 0 && at.list > 0)
    return { list: at.list - 1, index: sizes[at.list - 1] ?? 0 };
  if (forward && at.index === count - 1 && at.list < sizes.length - 1)
    return { list: at.list + 1, index: 0 };
  return at;
}

// What a polite live region says. Positions are one-based here, as people count.
export const sortText = {
  help: "To move an item with the keyboard, press Space or Enter on its handle, move it with the arrow keys, and press Space or Enter to drop it. Escape puts it back.",
  lift: (label: string, pos: number, count: number) =>
    `Picked up ${label}. Position ${pos} of ${count}. Arrow keys move it, Space drops it, Escape puts it back.`,
  over: (label: string, pos: number, count: number) => `${label}: position ${pos} of ${count}.`,
  drop: (label: string, pos: number, count: number, moved: boolean) =>
    moved
      ? `Dropped ${label} at position ${pos} of ${count}.`
      : `Dropped ${label}. It stays at position ${pos} of ${count}.`,
  cancel: (label: string, pos: number, count: number) =>
    `Put ${label} back at position ${pos} of ${count}.`,
  step: (label: string, pos: number, count: number) =>
    `Moved ${label} to position ${pos} of ${count}.`,
  // Into another list of the same group: "Moved Abstract 4 to Posters: position 2 of 5."
  moveTo: (label: string, list: string, pos: number, count: number) =>
    `Moved ${label} to ${list}: position ${pos} of ${count}.`,
  removed: (label: string, left: number) =>
    left === 0 ? `Removed ${label}. The list is empty.` : `Removed ${label}. ${left} left.`,
  added: (label: string, count: number) => `Added ${label}. ${count} in the list.`,
};

// What a host may say in its own words: any of the sentences above.
export type SortMessages = typeof sortText;

// The position a key moves a lifted item to, or null for a key that does not move it.
// In cards every arrow is "previous" or "next" in reading order.
export function keyTarget(key: string, index: number, count: number): number | null {
  if (key === "ArrowUp" || key === "ArrowLeft") return Math.max(0, index - 1);
  if (key === "ArrowDown" || key === "ArrowRight") return Math.min(count - 1, index + 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// ---------------------------------------------------------------------------------------
// A pointer drag, shared with the tree. It starts once the pointer has moved a few pixels
// (so a click stays a click), follows the pointer, and ends on release (drop), or on
// Escape or a canceled pointer (cancel). After a drag, the click the release makes is
// swallowed, so a dragged link is not followed.

export interface DragHandlers {
  onStart(): void;
  onMove(x: number, y: number): void;
  onDrop(x: number, y: number): void;
  onCancel(): void;
}

export const DRAG_THRESHOLD = 4;

// Puts `node` into `parent` before `ref` (null: at the end). Where the browser has moveBefore (Chrome 133, Firefox
// 144; not Safari) the node keeps its state while it moves: focus, a running transition, an open popover. Elsewhere
// it is the usual remove and insert, after which the caller puts focus back (Modern Web Guidance,
// move-dom-element-without-losing-state).
export function moveNode(parent: Element, node: Element, ref: Node | null): void {
  const p = parent as Element & { moveBefore?: (node: Node, child: Node | null) => void };
  if (typeof p.moveBefore === "function" && node.isConnected && parent.isConnected) {
    try {
      p.moveBefore(node, ref);
      return;
    } catch {
      /* a move across documents or shadow roots throws: fall back */
    }
  }
  parent.insertBefore(node, ref);
}

export function startPointerDrag(
  down: PointerEvent,
  h: DragHandlers,
  threshold = DRAG_THRESHOLD,
): void {
  if (down.button !== 0) return;
  const x0 = down.clientX;
  const y0 = down.clientY;
  let started = false;
  const off = () => {
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", cancel, true);
    window.removeEventListener("keydown", key, true);
  };
  const swallowClick = () => {
    const stop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", stop, true), 0);
  };
  // Only the pointer that started the drag moves it: a second finger or a pen is ignored. Capturing it keeps the
  // drag's events coming when the pointer leaves the window (Modern Web Guidance, drag-and-drop).
  const id = down.pointerId;
  const holder = down.target instanceof Element ? down.target : null;
  try {
    holder?.setPointerCapture(id);
  } catch {
    /* a pointer already released cannot be captured */
  }
  const move = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    if (!started) {
      if (Math.hypot(e.clientX - x0, e.clientY - y0) < threshold) return;
      started = true;
      h.onStart();
    }
    e.preventDefault();
    h.onMove(e.clientX, e.clientY);
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    off();
    if (!started) return;
    swallowClick();
    h.onDrop(e.clientX, e.clientY);
  };
  const cancel = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    off();
    if (started) h.onCancel();
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !started) return;
    e.preventDefault();
    e.stopPropagation();
    off();
    swallowClick();
    h.onCancel();
  };
  window.addEventListener("pointermove", move, true);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", cancel, true);
  window.addEventListener("keydown", key, true);
}

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

// The polite live region for a list: `[data-cap-part="announce"]` beside it, made when missing.
export function announcer(el: HTMLElement): { region: HTMLElement; made: boolean } {
  const near = el.parentElement?.querySelector<HTMLElement>(":scope > [data-cap-part='announce']");
  if (near) return { region: near, made: false };
  const region = document.createElement("div");
  region.className = "cap-sr-only";
  region.dataset.capPart = "announce";
  region.setAttribute("role", "status");
  region.setAttribute("aria-atomic", "true");
  el.after(region);
  return { region, made: true };
}

// ---------------------------------------------------------------------------------------
// The controller, over the HTML contract: `[data-cap="sortable-list"]`.
//
// Lists that share a `data-group` are one set: an item can be dragged, or moved by the keyboard,
// from one to another (a book's sections), and a `select` with `data-cap-part="move-to"` in an
// item's steps is the one-pointer way to do it (WCAG 2.5.7). A list is named by `data-list` (or
// its id) and its words by `aria-label`.

export interface SortChangeDetail extends SortMove {
  // The item ids of the list the item is now in.
  order: string[];
  // How it moved: "keyboard", "pointer", "button" or "select" (the move-to select).
  by: "keyboard" | "pointer" | "button" | "select";
  // The list the item is now in, and the one it left; the same for a move within a list.
  list: string;
  fromList: string;
  // Every list of the group, id to item ids.
  lists: Lists;
}

export interface SortRemoveDetail {
  id: string;
  list: string;
  index: number;
}

export interface SortableList {
  readonly el: HTMLElement;
  order(): string[];
  // Moves an item as a finished move: emits cap:sortable-change and announces it.
  move(id: string, to: number): void;
  detach(): void;
}

const SELECTOR = "[data-cap='sortable-list']";
const itemsOf = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>(":scope > .cap-sortable-item"));
const idOf = (item: HTMLElement) => item.dataset.value ?? "";
const labelOf = (item: HTMLElement) =>
  (
    item.dataset.label ??
    item.querySelector(".cap-sortable-label")?.textContent ??
    item.textContent ??
    ""
  )
    .trim()
    .replace(/\s+/g, " ");
const listId = (list: HTMLElement) => list.dataset.list ?? list.id;
const listWords = (list: HTMLElement) => list.getAttribute("aria-label") ?? listId(list);

// The lists an item may move between: the ones that share this list's `data-group`, in document
// order; the list alone with none.
export function groupOf(el: HTMLElement): HTMLElement[] {
  const g = el.dataset.group;
  if (!g) return [el];
  const root = el.getRootNode() as ParentNode;
  return Array.from(root.querySelectorAll<HTMLElement>(`${SELECTOR}[data-group]`)).filter(
    (l) => l.dataset.group === g,
  );
}

const listsOf = (group: HTMLElement[]): Lists =>
  Object.fromEntries(group.map((l) => [listId(l), itemsOf(l).map(idOf)]));

// Puts `item` at position `to` of its own list by moving its neighbors around it, never the item
// itself, so the handle or button that has focus keeps it.
export function placeItem(item: HTMLElement, to: number): void {
  const list = item.parentElement;
  if (!list) return;
  const index = () => itemsOf(list).indexOf(item);
  for (let guard = 0; index() > to && guard < 1000; guard++) {
    const prev = item.previousElementSibling;
    if (!prev) break;
    item.after(prev);
  }
  for (let guard = 0; index() < to && guard < 1000; guard++) {
    const next = item.nextElementSibling;
    if (!next) break;
    item.before(next);
  }
}

// Puts `item` at position `to` of `list`, which may be another list of its group. Across lists the
// item itself moves (moveNode keeps its focus where the browser has moveBefore, and the caller puts
// focus back elsewhere); within one the neighbors move around it.
export function placeIn(item: HTMLElement, list: HTMLElement, to: number): void {
  if (item.parentElement === list) return placeItem(item, to);
  const others = itemsOf(list);
  const ref = others[to] ?? list.querySelector(":scope > .cap-sortable-empty");
  moveNode(list, item, ref);
}

// The step buttons at the ends cannot move further: disabled, and focus moves to the other button
// when the one it was on stops working.
function syncSteps(list: HTMLElement): void {
  // Read before disabling: a browser drops focus from a button the moment it is disabled.
  const had = document.activeElement;
  const items = itemsOf(list);
  items.forEach((item, i) => {
    const up = item.querySelector<HTMLButtonElement>("[data-cap-part='up']");
    const down = item.querySelector<HTMLButtonElement>("[data-cap-part='down']");
    if (up) up.disabled = i === 0;
    if (down) down.disabled = i === items.length - 1;
    if (had && had === up && up.disabled) down?.focus();
    if (had && had === down && down.disabled) up?.focus();
  });
}

// What is up by keyboard, in the whole document: one item at a time, whichever list of its group it
// has moved into since.
let lifted: { item: HTMLElement; from: number; fromList: HTMLElement } | null = null;

export function createSortableList(el: HTMLElement): SortableList {
  const layout: Layout =
    el.dataset.layout === "cards" ? "cards" : el.dataset.layout === "stack" ? "stack" : "rows";
  const regions = new Map<HTMLElement, { region: HTMLElement; made: boolean }>();
  const regionOf = (list: HTMLElement) => {
    let r = regions.get(list);
    if (!r) regions.set(list, (r = announcer(list)));
    return r.region;
  };
  const say = (list: HTMLElement, text: string) => {
    const region = regionOf(list);
    // Cleared first, so the same words twice are still read.
    region.textContent = "";
    requestAnimationFrame(() => (region.textContent = text));
  };
  // The live region exists before it speaks.
  regionOf(el);
  const order = () => itemsOf(el).map(idOf);
  const posOf = (item: HTMLElement) => itemsOf(item.parentElement as HTMLElement).indexOf(item);
  // The list an item is in now: its parent, when that is a list of this one's group.
  const listOf = (item: HTMLElement) => item.parentElement as HTMLElement;

  const emit = (
    item: HTMLElement,
    from: number,
    fromList: HTMLElement,
    by: SortChangeDetail["by"],
  ) => {
    const list = listOf(item);
    const to = posOf(item);
    if (to === from && list === fromList) return;
    const detail: SortChangeDetail = {
      id: idOf(item),
      from,
      to,
      order: itemsOf(list).map(idOf),
      by,
      list: listId(list),
      fromList: listId(fromList),
      lists: listsOf(groupOf(list)),
    };
    const ok = list.dispatchEvent(
      new CustomEvent("cap:sortable-change", { bubbles: true, cancelable: true, detail }),
    );
    // The host refused it: back where it was.
    if (!ok) placeIn(item, fromList, from);
    syncSteps(list);
    syncSteps(fromList);
    syncMoveTo(item);
  };

  // The move-to select shows the list the item is in.
  const syncMoveTo = (item: HTMLElement) => {
    const select = item.querySelector<HTMLSelectElement>("[data-cap-part='move-to']");
    if (select) select.value = listId(listOf(item));
  };

  // Words for where an item landed: its position, and its list when it changed.
  const landed = (item: HTMLElement, fromList: HTMLElement, said: "over" | "step" | "moveTo") => {
    const list = listOf(item);
    const count = itemsOf(list).length;
    if (list !== fromList || said === "moveTo")
      return sortText.moveTo(labelOf(item), listWords(list), posOf(item) + 1, count);
    return sortText[said === "over" ? "over" : "step"](labelOf(item), posOf(item) + 1, count);
  };

  // ---- keyboard: pick up, move, drop
  const handleOf = (item: HTMLElement) => item.querySelector<HTMLElement>(".cap-sortable-handle");
  const setLifted = (item: HTMLElement | null) => {
    for (const list of groupOf(el))
      for (const i of itemsOf(list)) {
        const on = i === item;
        i.toggleAttribute("data-lifted", on);
        handleOf(i)?.setAttribute("aria-pressed", String(on));
      }
  };
  // After an item crosses into another list a browser without moveBefore drops its focus: put it back.
  const keepFocus = (run: () => void) => {
    const had = document.activeElement as HTMLElement | null;
    run();
    if (had && had.isConnected && document.activeElement !== had)
      had.focus({ preventScroll: true });
  };
  const lift = (item: HTMLElement) => {
    lifted = { item, from: posOf(item), fromList: listOf(item) };
    setLifted(item);
    say(listOf(item), sortText.lift(labelOf(item), lifted.from + 1, itemsOf(listOf(item)).length));
  };
  const drop = () => {
    if (!lifted) return;
    const { item, from, fromList } = lifted;
    lifted = null;
    setLifted(null);
    const to = posOf(item);
    const list = listOf(item);
    say(
      list,
      list === fromList
        ? sortText.drop(labelOf(item), to + 1, itemsOf(list).length, to !== from)
        : sortText.moveTo(labelOf(item), listWords(list), to + 1, itemsOf(list).length),
    );
    emit(item, from, fromList, "keyboard");
  };
  const cancel = () => {
    if (!lifted) return;
    const { item, from, fromList } = lifted;
    lifted = null;
    setLifted(null);
    keepFocus(() => placeIn(item, fromList, from));
    syncSteps(fromList);
    say(fromList, sortText.cancel(labelOf(item), from + 1, itemsOf(fromList).length));
  };

  const onKey = (e: KeyboardEvent) => {
    const target = e.target as Element | null;
    const item = target?.closest<HTMLElement>(".cap-sortable-item");
    if (!item || item.parentElement !== el || e.ctrlKey || e.metaKey) return;
    // Alt and an arrow anywhere in an item moves it one place, as the buttons do (WCAG 2.5.7): the
    // keyboard twin of a drag for an item whose body is fields. Not from a select, where Alt+Down opens it.
    if (
      e.altKey &&
      !e.shiftKey &&
      el.hasAttribute("data-alt-keys") &&
      (e.key === "ArrowUp" || e.key === "ArrowDown") &&
      !(target instanceof HTMLSelectElement)
    ) {
      e.preventDefault();
      cancel();
      const from = posOf(item);
      const to = from + (e.key === "ArrowUp" ? -1 : 1);
      if (to < 0 || to >= itemsOf(el).length) return;
      placeItem(item, to);
      say(el, landed(item, el, "step"));
      emit(item, from, el, "keyboard");
      return;
    }
    const handle = target?.closest<HTMLElement>(".cap-sortable-handle");
    if (!handle || e.altKey) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted?.item === item) drop();
      else {
        cancel();
        lift(item);
      }
      return;
    }
    if (lifted?.item !== item) return;
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    const group = groupOf(el);
    const sizes = group.map((l) => itemsOf(l).length);
    const at = { list: group.indexOf(el), index: posOf(item) };
    const to = keyMove(e.key, at, sizes);
    if (to === null) return;
    e.preventDefault();
    if (to.list === at.list && to.index === at.index) return;
    const target_ = group[to.list];
    if (!target_) return;
    keepFocus(() => placeIn(item, target_, to.index));
    syncSteps(el);
    syncSteps(target_);
    say(target_, landed(item, el, "over"));
  };
  // Leaving the lists while an item is up puts it back.
  const onFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (lifted && to && !groupOf(el).some((l) => l.contains(to))) cancel();
  };

  // ---- the step buttons, the move-to select and Remove
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    const part = target?.closest<HTMLButtonElement>(
      "[data-cap-part='up'], [data-cap-part='down'], [data-cap-part='remove']",
    );
    const item = part?.closest<HTMLElement>(".cap-sortable-item");
    if (!part || !item || item.parentElement !== el) return;
    // With script the move happens here; with none the button posts the form.
    e.preventDefault();
    if (part.disabled) return;
    cancel();
    if (part.dataset.capPart === "remove") return remove(item);
    const from = posOf(item);
    placeItem(item, from + (part.dataset.capPart === "up" ? -1 : 1));
    say(el, landed(item, el, "step"));
    emit(item, from, el, "button");
  };
  const onChange = (e: Event) => {
    const select = (e.target as Element | null)?.closest<HTMLSelectElement>(
      "[data-cap-part='move-to']",
    );
    const item = select?.closest<HTMLElement>(".cap-sortable-item");
    if (!select || !item || item.parentElement !== el) return;
    const to = groupOf(el).find((l) => listId(l) === select.value);
    if (!to || to === el) return;
    cancel();
    const from = posOf(item);
    keepFocus(() => placeIn(item, to, itemsOf(to).length));
    say(to, landed(item, el, "moveTo"));
    emit(item, from, el, "select");
  };
  // Remove: the host hears cap:sortable-remove and may refuse it; otherwise the item goes, the
  // list says so, and focus moves to the next item's handle, or the one before it.
  const remove = (item: HTMLElement) => {
    const list = listOf(item);
    const index = posOf(item);
    const detail: SortRemoveDetail = { id: idOf(item), list: listId(list), index };
    const ok = list.dispatchEvent(
      new CustomEvent("cap:sortable-remove", { bubbles: true, cancelable: true, detail }),
    );
    if (!ok) return;
    const text = labelOf(item);
    item.remove();
    const left = itemsOf(list);
    say(list, sortText.removed(text, left.length));
    syncSteps(list);
    (left[Math.min(index, left.length - 1)]
      ? handleOf(left[Math.min(index, left.length - 1)] as HTMLElement)
      : null
    )?.focus();
  };

  // ---- the pointer
  const onDown = (e: PointerEvent) => {
    const handle = (e.target as Element | null)?.closest<HTMLElement>(".cap-sortable-handle");
    const item = handle?.closest<HTMLElement>(".cap-sortable-item");
    if (!handle || !item || item.parentElement !== el) return;
    const from = posOf(item);
    const group = groupOf(el);
    const clear = () => {
      item.removeAttribute("data-dragging");
      for (const l of group) l.removeAttribute("data-sorting");
    };
    startPointerDrag(e, {
      onStart() {
        cancel();
        item.setAttribute("data-dragging", "");
        for (const l of group) l.setAttribute("data-sorting", "");
      },
      onMove(x, y) {
        // The list under the pointer, else the one the item is in.
        const over =
          group.find((l) => {
            const r =
              l.closest<HTMLElement>("[data-sortable-lane]")?.getBoundingClientRect() ??
              l.getBoundingClientRect();
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
          }) ?? listOf(item);
        const others = itemsOf(over).filter((i) => i !== item);
        keepFocus(() => placeIn(item, over, indexAtPoint(others.map(boxOf), x, y, layout)));
      },
      onDrop() {
        clear();
        const list = listOf(item);
        const to = posOf(item);
        say(
          list,
          list === el
            ? sortText.drop(labelOf(item), to + 1, itemsOf(list).length, to !== from)
            : sortText.moveTo(labelOf(item), listWords(list), to + 1, itemsOf(list).length),
        );
        emit(item, from, el, "pointer");
      },
      onCancel() {
        clear();
        keepFocus(() => placeIn(item, el, from));
        for (const l of group) syncSteps(l);
        say(el, sortText.cancel(labelOf(item), from + 1, itemsOf(el).length));
      },
    });
  };

  el.addEventListener("keydown", onKey);
  el.addEventListener("focusout", onFocusOut);
  el.addEventListener("click", onClick);
  el.addEventListener("change", onChange);
  el.addEventListener("pointerdown", onDown);
  for (const item of itemsOf(el)) {
    const h = handleOf(item);
    h?.setAttribute("aria-pressed", "false");
    // A native drag of the handle (an image, a link in the card) would fight the pointer drag.
    item.querySelectorAll("a, img").forEach((n) => n.setAttribute("draggable", "false"));
  }
  syncSteps(el);

  return {
    el,
    order,
    move(id, to) {
      const item = itemsOf(el).find((i) => idOf(i) === id);
      if (!item) return;
      const from = posOf(item);
      placeItem(item, to);
      say(el, landed(item, el, "step"));
      emit(item, from, el, "button");
    },
    detach() {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("click", onClick);
      el.removeEventListener("change", onChange);
      el.removeEventListener("pointerdown", onDown);
      for (const { region, made } of regions.values()) if (made) region.remove();
      delete el.dataset.capReady;
    },
  };
}

// Attaches to every `[data-cap="sortable-list"]` under root not yet marked `data-cap-ready`.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(`${SELECTOR}:not([data-cap-ready])`)) {
    el.dataset.capReady = "";
    undo.push(createSortableList(el).detach);
  }
  return () => undo.forEach((f) => f());
}
