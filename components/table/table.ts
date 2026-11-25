// The table's behavior: a sort button in a column header sorts the body rows and moves aria-sort to its header
// cell. Screen readers announce aria-sort themselves, so nothing else is announced.

export type SortDirection = "ascending" | "descending";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

// The value a cell sorts by: its data-sort attribute when it has one (a timestamp, a raw
// count), else its text. A plain number, with or without thousands separators, sorts as a
// number.
export function sortValue(cell: Element | undefined): string | number {
  const raw = (cell?.getAttribute("data-sort") ?? cell?.textContent ?? "").trim();
  if (/^-?\d[\d,]*(\.\d+)?$/.test(raw)) return Number(raw.replaceAll(",", ""));
  return raw;
}

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  // Text, and a number against text, compare as text with digits read as numbers. An
  // empty cell sorts first ascending; give it a data-sort to place it elsewhere.
  return collator.compare(String(a), String(b));
}

export function sortRows(table: HTMLTableElement, index: number, direction: SortDirection): void {
  const sign = direction === "ascending" ? 1 : -1;
  for (const body of Array.from(table.tBodies)) {
    const rows = Array.from(body.rows);
    const keyed = rows.map((row) => ({ row, key: sortValue(row.cells[index]) }));
    keyed.sort((x, y) => sign * compareValues(x.key, y.key));
    body.append(...keyed.map((k) => k.row));
  }
}

export function columnIndex(th: HTMLTableCellElement): number {
  let i = 0;
  for (let c = th.previousElementSibling; c; c = c.previousElementSibling)
    i += (c as HTMLTableCellElement).colSpan || 1;
  return i;
}

// Sorts by the column of `th`: ascending first, then toggling. Only one header carries
// aria-sort at a time (APG sortable table). Returns the new direction.
export function sortByHeader(th: HTMLTableCellElement, direction?: SortDirection): SortDirection {
  const table = th.closest("table");
  const next: SortDirection =
    direction ?? (th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending");
  if (!table) return next;
  for (const other of Array.from(table.querySelectorAll("thead th[aria-sort]")))
    if (other !== th) other.removeAttribute("aria-sort");
  th.setAttribute("aria-sort", next);
  sortRows(table, columnIndex(th), next);
  return next;
}

// A row that leaves (removed, or hidden by a filter) while focus is in it would drop focus to the
// body: it goes to the next row, else the previous, else the region, which is focusable.
function keepFocus(wrap: HTMLElement): () => void {
  let held: { row: HTMLElement; next: Element | null; prev: Element | null } | null = null;
  const live = (el: Element | null): el is HTMLElement =>
    el instanceof HTMLElement && wrap.contains(el) && !el.closest("[hidden]");
  const onFocusIn = (e: FocusEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("tbody tr");
    held = row && { row, next: row.nextElementSibling, prev: row.previousElementSibling };
  };
  const check = () => {
    const h = held;
    const a = document.activeElement;
    if (!h || live(h.row) || (a && a !== document.body)) return;
    held = null;
    const row = [h.next, h.prev].find(live);
    const target =
      row?.querySelector<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled)") ??
      row ??
      wrap;
    if (target === row) row.tabIndex = -1;
    target.focus();
  };
  const observer = new MutationObserver(check);
  observer.observe(wrap, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"],
  });
  wrap.addEventListener("focusin", onFocusIn);
  return () => {
    observer.disconnect();
    wrap.removeEventListener("focusin", onFocusIn);
  };
}

// Attaches to every [data-cap="table"] under root. A table already marked sorted (aria-sort in its markup)
// is expected to arrive in that order; it is not re-sorted on attach.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const wrap of Array.from(
    root.querySelectorAll<HTMLElement>("[data-cap='table']:not([data-cap-ready])"),
  )) {
    wrap.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest<HTMLButtonElement>(".cap-table-sort");
      const th = button?.closest<HTMLTableCellElement>("th");
      if (button && th && wrap.contains(th)) sortByHeader(th);
    };
    wrap.addEventListener("click", onClick);
    const unKeep = keepFocus(wrap);
    undo.push(() => {
      unKeep();
      wrap.removeEventListener("click", onClick);
      delete wrap.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
