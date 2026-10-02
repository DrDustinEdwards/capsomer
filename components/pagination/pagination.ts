// Pagination's behaviour. A server-rendered pager made of links needs no script at all: the
// links are the markup. This module is for the client-side form, a nav of buttons that
// carries its state as data attributes (data-page, data-page-count, data-total,
// data-per-page, data-noun): a click chooses a page, the list is drawn again, the "Showing
// 21 to 40 of 312" line (a polite live region) says where the person is, and the app is told
// with a `cap:page-change` event so it can load that page. The React wrapper uses the same
// pure functions.

const READY = "data-cap-ready";

export type PageItem = number | "gap-start" | "gap-end";

// The numbers to show for `page` of `count`: always seven slots when there are more than
// seven pages, so the list never changes width as a person moves. The first and last page
// are always there; a gap stands for the pages between.
export function pageItems(page: number, count: number): PageItem[] {
  const n = Math.max(0, Math.floor(count));
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
  const p = Math.min(Math.max(1, Math.floor(page)), n);
  if (p <= 4) return [1, 2, 3, 4, 5, "gap-end", n];
  if (p >= n - 3) return [1, "gap-start", n - 4, n - 3, n - 2, n - 1, n];
  return [1, "gap-start", p - 1, p, p + 1, "gap-end", n];
}

// The first and last item on `page`, counted from 1.
export function showingRange(page: number, perPage: number, total: number): { from: number; to: number } {
  if (total <= 0 || perPage <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * perPage + 1;
  return { from: Math.min(from, total), to: Math.min(page * perPage, total) };
}

// "Showing 21 to 40 of 312 posts". A page with one item says "Showing 41 of 41 posts".
export function statusText(page: number, perPage: number, total: number, noun = "items"): string {
  const { from, to } = showingRange(page, perPage, total);
  if (total <= 0) return `No ${noun}`;
  return from === to ? `Showing ${from} of ${total} ${noun}` : `Showing ${from} to ${to} of ${total} ${noun}`;
}

export function pageCountOf(total: number, perPage: number): number {
  return perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function numberOf(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// Draws the nav's list and status from its data attributes: the markup in pagination.md,
// with buttons for links.
export function render(nav: HTMLElement): void {
  const count = numberOf(nav.dataset.pageCount, 1);
  const page = Math.min(numberOf(nav.dataset.page, 1), count);
  const perPage = numberOf(nav.dataset.perPage, 0);
  const total = Number(nav.dataset.total);
  const noun = nav.dataset.noun || "items";
  nav.dataset.page = String(page);

  // The status line is a live region, so it is updated in place: a new node would not be announced.
  let status = nav.querySelector<HTMLElement>(":scope > .cap-pagination-status");
  if (perPage > 0 && Number.isFinite(total)) {
    if (!status) {
      status = el("p", "cap-pagination-status");
      status.setAttribute("role", "status");
      nav.prepend(status);
    }
    status.textContent = statusText(page, perPage, total, noun);
  }
  const list = el("ul", "cap-pagination-list");
  const end = (kind: "prev" | "next", label: string, to: number) => {
    const item = el("li");
    const b = el("button", "cap-page", label);
    b.type = "button";
    b.dataset.kind = kind;
    if (to < 1 || to > count) b.setAttribute("aria-disabled", "true");
    else b.dataset.page = String(to);
    item.append(b);
    return item;
  };
  list.append(end("prev", nav.dataset.prevLabel || "Previous", page - 1));
  for (const it of pageItems(page, count)) {
    const item = el("li", "cap-pagination-num");
    if (typeof it === "number") {
      const b = el("button", "cap-page", String(it));
      b.type = "button";
      b.dataset.page = String(it);
      b.setAttribute("aria-label", `Page ${it}`);
      if (it === page) b.setAttribute("aria-current", "page");
      item.append(b);
    } else {
      const gap = el("span", "cap-page-gap");
      const dots = el("span", undefined, "…");
      dots.setAttribute("aria-hidden", "true");
      gap.append(dots, el("span", "cap-sr-only", "More pages"));
      item.append(gap);
    }
    list.append(item);
  }
  list.append(el("li", "cap-pagination-where", `Page ${page} of ${count}`));
  list.append(end("next", nav.dataset.nextLabel || "Next", page + 1));
  const old = nav.querySelector(":scope > .cap-pagination-list");
  if (old) old.replaceWith(list);
  else nav.append(list);
}

// Goes to a page from script. Draws again, keeps focus on the control that had it (or on the
// current page when that control is gone), and tells the page. Returns whether the page changed.
export function setPage(nav: HTMLElement, page: number, options: { silent?: boolean } = {}): boolean {
  const count = numberOf(nav.dataset.pageCount, 1);
  const to = Math.min(Math.max(1, Math.floor(page)), count);
  if (to === numberOf(nav.dataset.page, 1)) return false;
  const had = nav.contains(document.activeElement);
  const kind = (document.activeElement as HTMLElement | null)?.dataset?.kind;
  nav.dataset.page = String(to);
  render(nav);
  if (had) {
    const again = kind ? nav.querySelector<HTMLElement>(`.cap-page[data-kind="${kind}"]:not([aria-disabled="true"])`) : null;
    (again ?? nav.querySelector<HTMLElement>('.cap-page[aria-current="page"]'))?.focus();
  }
  if (!options.silent) nav.dispatchEvent(new CustomEvent("cap:page-change", { bubbles: true, detail: { page: to } }));
  return true;
}

// Attaches every [data-cap="pagination"] under root not yet attached. Returns a function
// that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const nav of root.querySelectorAll<HTMLElement>("[data-cap='pagination']")) {
    if (nav.hasAttribute(READY)) continue;
    nav.setAttribute(READY, "");
    const click = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(".cap-page");
      if (!b || !nav.contains(b)) return;
      if (b.getAttribute("aria-disabled") === "true" || b.hasAttribute("aria-current")) {
        e.preventDefault();
        return;
      }
      if (b.tagName === "A" || !b.dataset.page) return; // links go where they go
      setPage(nav, Number(b.dataset.page));
    };
    nav.addEventListener("click", click);
    undo.push(() => {
      nav.removeEventListener("click", click);
      nav.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
