// The "On this page" bar: links to a long view's sections, sticky at the top, with the
// current section marked aria-current="location". Only for a view with three or more
// sections that is taller than two screens; otherwise the module hides the bar, unless it has
// data-always. The rule is measured again whenever the window or the content changes size,
// so a view that fills in after it loads (a panel arriving with its data) gets its bar when it
// earns one, and loses it when it stops. Following a link moves focus to the section and
// replaces the address's hash. No framework; the React wrapper uses the same functions.
//
// The measuring and the "bar's own height does not count" rule are the Portal's
// (dashboard/src/ui/anchors.tsx), which learned that mounting the bar could otherwise tip the
// rule it was mounted by.

// The nearest ancestor that scrolls, or null for the window.
export function scrollParent(el: Element | null | undefined): HTMLElement | null {
  for (let n = el?.parentElement ?? null; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if (o === "auto" || o === "scroll") return n;
  }
  return null;
}

// What the bar links to: the blocks of the page marked data-section with an id (a panel: its
// data-section is the link's name), or, when there are none, its h2 headings that have one.
export function sectionsIn(scope: ParentNode): HTMLElement[] {
  const blocks = Array.from(scope.querySelectorAll<HTMLElement>("[data-section][id]"));
  return blocks.length ? blocks : Array.from(scope.querySelectorAll<HTMLElement>("h2[id]"));
}

export function sectionLabel(section: HTMLElement): string {
  return section.dataset.section ?? section.textContent?.trim() ?? section.id;
}

// The rule: three or more sections, and a view taller than two screens. The bar's own height
// does not count (`barHeight`), or showing it could tip the rule it was shown by.
export function meetsRule(headings: Element[], scroller: HTMLElement | null, barHeight = 0): boolean {
  if (headings.length < 3) return false;
  const total = (scroller ? scroller.scrollHeight : document.documentElement.scrollHeight) - barHeight;
  const screen = scroller ? scroller.clientHeight : window.innerHeight;
  return total > 2 * screen;
}

// The current section: the last heading above a line 35% down the view, or the last
// heading once the view is scrolled to its end.
export function currentSection(headings: HTMLElement[], scroller: HTMLElement | null, line = 0.35): HTMLElement | null {
  const top = scroller ? scroller.getBoundingClientRect().top : 0;
  const height = scroller ? scroller.clientHeight : window.innerHeight;
  const y = top + height * line;
  let cur: HTMLElement | null = null;
  for (const h of headings) if (h.getBoundingClientRect().top <= y) cur = h;
  const atEnd = scroller
    ? scroller.scrollTop > 0 && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
    : window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  if (atEnd) cur = headings.at(-1) ?? cur;
  return cur;
}

// Calls onChange with the current section's id whenever it changes. Returns a function
// that stops watching.
export function watchSections(headings: HTMLElement[], onChange: (id: string | null) => void, scroller: HTMLElement | null = scrollParent(headings[0])): () => void {
  let last: string | null | undefined;
  const update = () => {
    const id = currentSection(headings, scroller)?.id ?? null;
    if (id !== last) {
      last = id;
      onChange(id);
    }
  };
  // A heading crossing the 35% line is what changes the answer.
  const io = new IntersectionObserver(update, { root: scroller, rootMargin: "0px 0px -65% 0px", threshold: [0, 1] });
  for (const h of headings) io.observe(h);
  // The end of the view, where the last heading may never reach the line.
  const target: EventTarget = scroller ?? window;
  target.addEventListener("scrollend", update);
  update();
  return () => {
    io.disconnect();
    target.removeEventListener("scrollend", update);
  };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scrolls a section to the top, under the bar, moves focus to it, and replaces the address's
// hash (a click on an in-page link is not a place to go Back to). `push: true` adds an entry.
export function goToSection(heading: HTMLElement, opts: { push?: boolean } = {}): void {
  if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
  heading.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
  heading.focus({ preventScroll: true });
  if (heading.id) {
    if (opts.push) history.pushState(null, "", `#${heading.id}`);
    else history.replaceState(history.state, "", `#${heading.id}`);
  }
}

// Tells the page how tall the bar is, so a section scrolled to sits below it.
export function measureBar(nav: HTMLElement, scroller: HTMLElement | null): void {
  (scroller ?? document.documentElement).style.setProperty("--cap-anchors-h", `${Math.ceil(nav.getBoundingClientRect().height)}px`);
}

// Marks the sections the bar links to, so each stops below the bar when scrolled to.
export function markSections(headings: HTMLElement[]): void {
  for (const h of headings) {
    if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
    h.dataset.capAnchor = "";
  }
}

// Attaches to every [data-cap="anchor-bar"] under root. A bar with an empty list is filled
// from the sections in its scope (data-cap-scope, or its main) and kept in step with them.
// Returns a function that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const nav of root.querySelectorAll<HTMLElement>("[data-cap='anchor-bar']:not([data-cap-ready])")) {
    nav.dataset.capReady = "";
    const scope = (nav.dataset.capScope ? document.querySelector(nav.dataset.capScope) : nav.closest("main")) ?? document.body;
    const scroller = scrollParent(nav);
    const always = nav.hasAttribute("data-always");
    let list = nav.querySelector("ul");
    const auto = !list?.querySelector("a");
    if (!list) {
      list = document.createElement("ul");
      list.className = "cap-anchors-list";
      nav.append(list);
    }
    const ul = list;

    // An empty list is rebuilt from the sections whenever they change. True when it changed.
    let filled = "";
    const fill = (): boolean => {
      const sections = sectionsIn(scope);
      const key = sections.map((s) => `${s.id}\u0000${sectionLabel(s)}`).join("\u0001");
      if (key === filled) return false;
      filled = key;
      ul.replaceChildren(
        ...sections.map((s) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = `#${s.id}`;
          a.textContent = sectionLabel(s);
          li.append(a);
          return li;
        }),
      );
      return true;
    };
    let pairs: Array<{ a: HTMLAnchorElement; h: HTMLElement }> = [];
    const resolve = () => {
      pairs = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']"))
        .map((a) => ({ a, h: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
        .filter((p): p is { a: HTMLAnchorElement; h: HTMLElement } => p.h !== null);
    };
    if (auto) fill();
    resolve();

    let stop: (() => void) | null = null;
    const halt = () => {
      stop?.();
      stop = null;
      for (const p of pairs) p.a.removeAttribute("aria-current");
    };
    const apply = () => {
      if (auto && fill()) {
        halt();
        resolve();
      }
      const headings = pairs.map((p) => p.h);
      const ok = always || meetsRule(headings, scroller, nav.offsetHeight);
      // Only on a change: setting the attribute again would be a mutation, and the mutation
      // observer below would measure again, without end.
      if (nav.hidden === ok) nav.hidden = !ok;
      if (ok) {
        markSections(headings);
        measureBar(nav, scroller);
        stop ??= watchSections(
          headings,
          (id) => {
            for (const p of pairs) {
              if (p.h.id === id) p.a.setAttribute("aria-current", "location");
              else p.a.removeAttribute("aria-current");
            }
          },
          scroller,
        );
      } else halt();
    };

    const ro = new ResizeObserver(apply);
    ro.observe(scroller ?? document.documentElement);
    ro.observe(nav);
    const mo = new MutationObserver(apply);
    mo.observe(scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-section", "id", "hidden"] });
    apply();

    const onClick = (e: MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      const a = (e.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
      const pair = pairs.find((p) => p.a === a);
      if (!pair) return;
      e.preventDefault();
      goToSection(pair.h);
    };
    nav.addEventListener("click", onClick);
    undo.push(() => {
      halt();
      ro.disconnect();
      mo.disconnect();
      nav.removeEventListener("click", onClick);
      nav.hidden = false;
      delete nav.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
