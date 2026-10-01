// The "On this page" bar: links to a long view's sections, sticky at the top, with the
// current section marked aria-current="location" by an IntersectionObserver. Only for a
// view with three or more sections that is taller than two screens; otherwise the module
// hides the bar, unless it has data-always. Following a link moves focus to the section's
// heading. No framework; the React wrapper uses the same functions.

// The nearest ancestor that scrolls, or null for the window.
export function scrollParent(el: Element | null | undefined): HTMLElement | null {
  for (let n = el?.parentElement ?? null; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if (o === "auto" || o === "scroll") return n;
  }
  return null;
}

// The rule: three or more sections, and a view taller than two screens.
export function meetsRule(headings: Element[], scroller: HTMLElement | null): boolean {
  if (headings.length < 3) return false;
  const total = scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;
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

// Scrolls a section's heading to the top, under the bar, and moves focus to it.
export function goToSection(heading: HTMLElement, opts: { push?: boolean } = {}): void {
  if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
  heading.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
  heading.focus({ preventScroll: true });
  if (opts.push !== false && heading.id) history.pushState(null, "", `#${heading.id}`);
}

// Tells the page how tall the bar is, so a heading scrolled to sits below it.
function measure(nav: HTMLElement, scroller: HTMLElement | null): void {
  (scroller ?? document.documentElement).style.setProperty("--cap-anchors-h", `${Math.ceil(nav.getBoundingClientRect().height)}px`);
}

// Attaches to every [data-cap="anchor-bar"] under root. A bar with an empty list is filled
// from the h2[id] headings in its scope (data-cap-scope, or its main). Returns a function
// that detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const nav of root.querySelectorAll<HTMLElement>("[data-cap='anchor-bar']:not([data-cap-ready])")) {
    nav.dataset.capReady = "";
    let list = nav.querySelector("ul");
    if (!list) {
      list = document.createElement("ul");
      list.className = "cap-anchors-list";
      nav.append(list);
    }
    if (!list.querySelector("a")) {
      const scope = (nav.dataset.capScope ? document.querySelector(nav.dataset.capScope) : nav.closest("main")) ?? document.body;
      for (const h of scope.querySelectorAll<HTMLElement>("h2[id]")) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${h.id}`;
        a.textContent = h.textContent?.trim() ?? h.id;
        li.append(a);
        list.append(li);
      }
    }
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")];
    const pairs = links
      .map((a) => ({ a, h: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
      .filter((p): p is { a: HTMLAnchorElement; h: HTMLElement } => p.h !== null);
    const headings = pairs.map((p) => p.h);
    const scroller = scrollParent(nav);

    if (!nav.hasAttribute("data-always") && !meetsRule(headings, scroller)) {
      nav.hidden = true;
      undo.push(() => {
        nav.hidden = false;
        delete nav.dataset.capReady;
      });
      continue;
    }
    nav.hidden = false;
    for (const h of headings) {
      if (!h.hasAttribute("tabindex")) h.tabIndex = -1;
      h.dataset.capAnchor = "";
    }
    measure(nav, scroller);
    const onResize = () => measure(nav, scroller);
    window.addEventListener("resize", onResize);

    const stop = watchSections(
      headings,
      (id) => {
        for (const p of pairs) {
          if (p.h.id === id) p.a.setAttribute("aria-current", "location");
          else p.a.removeAttribute("aria-current");
        }
      },
      scroller,
    );
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
      stop();
      nav.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      delete nav.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
