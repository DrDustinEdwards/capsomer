// The catalog's behaviour: it makes a form that already works (a GET to the page's own address) update in place.
// Typing in the search box, ticking a filter, choosing a sort, removing a chip, following a sort header or a page
// link fetches the same address a person would have navigated to and swaps the regions of the page that changed.
// The address is written with `history.replaceState`, so a filter change is not a step in the history, and what
// is in the address is what a person shares. If the fetch fails for any reason the browser simply navigates there:
// an error is never swallowed, and the page is never left showing a state its address does not describe.
//
// The core (field declarations, the address, the counts) is in catalog-core.ts and is re-exported here, so
// `capsomer/behaviour/catalog` is the one import for a site that renders its own markup.
export * from "./catalog-core.ts";

const REGIONS = ["count", "chips", "results", "pages"] as const;
const SEARCH_DELAY_MS = 250;
const NARROW = "(max-width: 56rem)";

// The form's state as an address: every named control with a value, in the order the form lists them. The
// server reads it with parseCatalogParams, so a control that is not in the address is at its default.
export function formHref(form: HTMLFormElement): string {
  const params = new URLSearchParams();
  for (const [name, value] of new FormData(form)) {
    if (typeof value === "string" && value.trim() !== "") params.append(name, value.trim());
  }
  const query = params.toString();
  return query ? `${form.getAttribute("action") ?? ""}?${query}` : (form.getAttribute("action") ?? "");
}

function region(root: ParentNode, name: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-catalog-region="${name}"]`);
}

// Updates the filters in place when focus is inside them (the person is mid-choice, and replacing the controls
// would drop their place), and replaces them otherwise. Counts follow either way.
function swapFilters(current: HTMLElement, next: HTMLElement): void {
  if (!current.contains(document.activeElement)) {
    current.innerHTML = next.innerHTML;
    return;
  }
  for (const input of Array.from(next.querySelectorAll<HTMLInputElement>("input[name]"))) {
    const mine = Array.from(current.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(input.name)}"]`)).find((i) => i.value === input.value);
    const count = input.closest("label")?.querySelector(".cap-catalog-n")?.textContent;
    const where = mine?.closest("label")?.querySelector(".cap-catalog-n");
    if (where && count !== undefined && count !== null) where.textContent = count;
  }
}

export function attachCatalog(form: HTMLFormElement): () => void {
  if (form.dataset.capReady !== undefined) return () => {};
  form.dataset.capReady = "";
  form.dataset.enhanced = "";

  let timer: number | undefined;
  let pending: AbortController | undefined;

  const setTray = (open: boolean) => {
    if (open) form.dataset.tray = "open";
    else delete form.dataset.tray;
  };

  // Fetches an address and swaps the changed regions. `focusCount` moves focus to the count line when the control
  // the person used is one the swap removes (a chip, a page link), so keyboard and screen reader users land
  // somewhere that says what changed.
  const go = async (href: string, focusCount = false): Promise<void> => {
    pending?.abort();
    const mine = new AbortController();
    pending = mine;
    const results = region(form, "results");
    results?.setAttribute("aria-busy", "true");
    try {
      const res = await fetch(href, { headers: { Accept: "text/html" }, signal: mine.signal, credentials: "same-origin" });
      if (!res.ok) throw new Error(`catalog: ${href} answered ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const next = doc.querySelector<HTMLFormElement>(`form[data-catalog="${CSS.escape(form.dataset.catalog ?? "")}"]`);
      if (!next) throw new Error(`catalog: ${href} has no catalog "${form.dataset.catalog}"`);
      for (const name of REGIONS) {
        const mineRegion = region(form, name);
        const nextRegion = region(next, name);
        if (mineRegion && nextRegion) mineRegion.innerHTML = nextRegion.innerHTML;
      }
      const filters = region(form, "filters");
      const nextFilters = region(next, "filters");
      if (filters && nextFilters) swapFilters(filters, nextFilters);
      const opener = form.querySelector('[data-catalog-tray="open"]');
      const nextOpener = next.querySelector('[data-catalog-tray="open"]');
      if (opener && nextOpener) opener.textContent = nextOpener.textContent;
      // The search and sort controls follow the address when it was changed by a link, not by them.
      const q = form.querySelector<HTMLInputElement>('input[name="q"]');
      const nq = next.querySelector<HTMLInputElement>('input[name="q"]');
      if (q && nq && document.activeElement !== q) q.value = nq.defaultValue;
      const sort = form.querySelector<HTMLSelectElement>('select[name="sort"]');
      const nextSort = next.querySelector<HTMLSelectElement>('select[name="sort"]');
      if (sort && nextSort) {
        sort.innerHTML = nextSort.innerHTML;
        sort.value = Array.from(nextSort.options).find((o) => o.defaultSelected)?.value ?? "";
      }
      // The address the server says this state has (the form can send defaults a link would not).
      history.replaceState(history.state, "", next.dataset.catalogHref ?? href);
      if (focusCount) {
        const count = region(form, "count");
        count?.setAttribute("tabindex", "-1");
        count?.focus({ preventScroll: true });
        count?.scrollIntoView({ block: "nearest" });
      }
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      // Not swallowed: the browser goes to the address, which is what a link would have done.
      console.error(error);
      location.assign(href);
    } finally {
      if (pending === mine) {
        region(form, "results")?.setAttribute("aria-busy", "false");
        pending = undefined;
      }
    }
  };

  const onInput = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.matches('input[type="search"], input[type="text"]')) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void go(formHref(form)), SEARCH_DELAY_MS);
  };
  const onChange = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.matches('input[type="checkbox"], input[type="radio"], select')) return;
    void go(formHref(form));
  };
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    window.clearTimeout(timer);
    void go(formHref(form), true);
  };
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = e.target as Element | null;
    const tray = target?.closest<HTMLElement>("[data-catalog-tray]");
    if (tray && form.contains(tray)) {
      e.preventDefault();
      const open = tray.dataset.catalogTray === "open";
      setTray(open);
      if (open) form.querySelector<HTMLElement>(".cap-catalog-filters input")?.focus();
      else tray.closest("form")?.querySelector<HTMLElement>('[data-catalog-tray="open"]')?.focus();
      return;
    }
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (!link || !form.contains(link) || !link.matches(".cap-catalog-chip, .cap-catalog-clear, .cap-page, .cap-table-sort, [data-catalog-link]")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== new URL(form.action, location.href).pathname) return;
    e.preventDefault();
    void go(`${url.pathname}${url.search}`, true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && form.dataset.tray === "open") {
      setTray(false);
      form.querySelector<HTMLElement>('[data-catalog-tray="open"]')?.focus();
    }
  };

  form.addEventListener("input", onInput);
  form.addEventListener("change", onChange);
  form.addEventListener("submit", onSubmit);
  form.addEventListener("click", onClick);
  form.addEventListener("keydown", onKey);
  const media = window.matchMedia(NARROW);
  const onMedia = () => {
    if (!media.matches) setTray(false);
  };
  media.addEventListener("change", onMedia);

  return () => {
    window.clearTimeout(timer);
    pending?.abort();
    form.removeEventListener("input", onInput);
    form.removeEventListener("change", onChange);
    form.removeEventListener("submit", onSubmit);
    form.removeEventListener("click", onClick);
    form.removeEventListener("keydown", onKey);
    media.removeEventListener("change", onMedia);
    delete form.dataset.capReady;
    delete form.dataset.enhanced;
    setTray(false);
  };
}

// Attaches to every catalog under root that is not attached yet. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(root.querySelectorAll<HTMLFormElement>("form[data-cap='catalog']:not([data-cap-ready])")).map(attachCatalog);
  return () => undo.forEach((f) => f());
}
