// The public pages' script (site/home.ts writes them; they read whole without it). The header, its
// search and its theme button are Capsomer's own site header. The front page's: the family preview, the type sample,
// the component filter, the copy button and the live test count. A component page's: its examples'
// frames, their code, the component list's filter, the page's sections marked as you read, Copy page.
import { staticSearch, type StaticSearchIndex } from "@drdustinedwards/site-helpers/search";
import { enhance as enhanceHeader } from "../components/site-header/site-header.ts";
import { enhance as enhanceTabs } from "../components/tabs/tabs.ts";
import { effectiveTheme, enhance as enhanceTheme } from "../components/theme-switch/theme-switch.ts";

// The header's search answers from the same index the search page reads (site/search.ts), loaded
// once, on the first word typed.
let index: Promise<StaticSearchIndex> | undefined;
enhanceHeader(document, {
  suggest: async (query) => {
    index ??= fetch("/search.json").then((r) => (r.ok ? (r.json() as Promise<StaticSearchIndex>) : Promise.reject(new Error(String(r.status)))));
    index.catch(() => (index = undefined));
    return staticSearch(await index, query).map((r) => ({ url: r.url, title: r.heading ? `${r.title}: ${r.heading}` : r.title, detail: r.snippet }));
  },
});
enhanceTheme();
enhanceTabs();

// The preview takes the chosen family as a site would, with data-family, crossfading where the browser has view transitions and motion is allowed (site/home.css).
const stage = document.querySelector<HTMLElement>("[data-cap-part='stage']");
const still = matchMedia("(prefers-reduced-motion: reduce)");
for (const input of document.querySelectorAll<HTMLInputElement>("input[name='home-family']")) {
  input.addEventListener("change", () => {
    if (!stage) return;
    const apply = () => {
      stage.dataset.family = input.value;
    };
    if (document.startViewTransition && !still.matches) document.startViewTransition(apply);
    else apply();
  });
}
// The preview's chips and switch respond, so the panel behaves like the components it shows.
for (const chip of document.querySelectorAll<HTMLButtonElement>(".home-try .cap-chip")) {
  chip.addEventListener("click", () => chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")));
}
for (const sw of document.querySelectorAll<HTMLInputElement>(".home-try .cap-switch input")) {
  sw.addEventListener("change", () => {
    const state = sw.parentElement?.querySelector(".cap-switch-state");
    if (state) state.textContent = sw.checked ? "On" : "Off";
  });
}

// Your own words in every size of the type scale.
const sample = document.querySelector<HTMLElement>("[data-cap-part='sample']");
if (sample) {
  sample.hidden = false;
  const input = sample.querySelector("input");
  const specimens = document.querySelectorAll<HTMLElement>(".home-scale-sample");
  input?.addEventListener("input", () => {
    for (const el of specimens) el.textContent = input.value.trim() || "Field notes";
  });
}

// The component filter: by name and summary, with the count said aloud.
const find = document.querySelector<HTMLElement>("[data-cap-part='find']");
const parts = [...document.querySelectorAll<HTMLLIElement>(".home-parts > li")];
if (find) {
  find.hidden = false;
  const input = find.querySelector("input");
  const count = find.querySelector("[role='status']");
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const li of parts) {
      const hit = !q || (li.textContent ?? "").toLowerCase().includes(q);
      li.hidden = !hit;
      if (hit) shown++;
    }
    if (count) count.textContent = q ? `${shown} of ${parts.length} components` : `${parts.length} components`;
  });
}

// Copy the install lines; the button says it worked.
const copy = document.querySelector<HTMLButtonElement>("[data-cap-part='copy']");
if (copy && navigator.clipboard) {
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("home-install")?.textContent ?? "");
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Copy failed";
    }
    setTimeout(() => (copy.textContent = "Copy"), 2000);
  });
}

// The last run on main, from the results branch CI writes (the admin reads the same file).
const live = document.querySelector<HTMLElement>("[data-live='tests']");
if (live) {
  fetch("https://raw.githubusercontent.com/DrDustinEdwards/capsomer/results/results.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { totals?: { passed: number; failed: number } } | null) => {
      if (!j?.totals) return;
      const { passed, failed } = j.totals;
      const [n, , note] = live.children;
      if (n) n.textContent = (passed + failed).toLocaleString("en-US");
      if (note) note.textContent = failed ? `${failed} failing on the last run` : "all passed on the last run";
      live.hidden = false;
    })
    .catch(() => {});
}

// ---- a component's page --------------------------------------------------------------------

// Each example's frame takes the page's theme and grows to its content (same origin, so the page
// can read it; sizes go through the CSSOM, as the CSP asks).
const frames = [...document.querySelectorAll<HTMLIFrameElement>(".comp-ex-frame")];
const syncFrame = (frame: HTMLIFrameElement) => {
  const doc = frame.contentDocument;
  if (!doc?.body || doc.URL === "about:blank") return;
  doc.documentElement.dataset.theme = effectiveTheme();
  // An example's own height: its section plus the page's padding (scrollHeight never drops below the frame).
  const shown = doc.querySelector(".cap-specimen-shown");
  const tall = frame.dataset.kind === "only" || !shown ? Number(frame.dataset.height) || 360 : Math.max(140, Math.ceil(shown.getBoundingClientRect().height) + 48);
  frame.style.setProperty("block-size", `${tall}px`);
};
for (const frame of frames) {
  frame.addEventListener("load", () => {
    syncFrame(frame);
    const shown = frame.contentDocument?.querySelector(".cap-specimen-shown");
    if (shown && frame.dataset.kind !== "only") new ResizeObserver(() => syncFrame(frame)).observe(shown);
  });
  syncFrame(frame);
}
const resync = () => frames.forEach(syncFrame);
new MutationObserver(resync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", resync);

// An example's code starts closed to its first lines, with View code over it; install code stays open.
const copyText = async (button: HTMLButtonElement, text: string) => {
  const was = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  }
  setTimeout(() => (button.textContent = was), 2000);
};
for (const box of document.querySelectorAll<HTMLElement>(".comp-ex-code")) {
  const show = box.querySelector<HTMLButtonElement>("[data-cap-part='show-code']");
  const copyButton = box.querySelector<HTMLButtonElement>("[data-cap-part='copy-code']");
  const code = box.querySelector("code")?.textContent ?? "";
  if (copyButton && navigator.clipboard) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", () => copyText(copyButton, code));
  }
  if (!show || code.split("\n").length <= 4) continue;
  box.toggleAttribute("data-closed", true);
  show.hidden = false;
  show.addEventListener("click", () => {
    const closed = box.toggleAttribute("data-closed");
    show.textContent = closed ? "View code" : "Hide code";
    show.setAttribute("aria-expanded", String(!closed));
  });
}

// Copy page: the component's doc as Markdown, for a note or an assistant.
const copyPage = document.querySelector<HTMLButtonElement>("[data-cap-part='copy-page']");
const md = document.querySelector<HTMLTemplateElement>("template[data-cap-part='md']");
if (copyPage && md && navigator.clipboard) {
  copyPage.hidden = false;
  copyPage.addEventListener("click", () => copyText(copyPage, md.content.textContent ?? ""));
}

// The component list's filter.
const sideFind = document.querySelector<HTMLElement>("[data-cap-part='side-find']");
if (sideFind) {
  sideFind.hidden = false;
  const input = sideFind.querySelector("input");
  const items = [...document.querySelectorAll<HTMLLIElement>(".comp-side li")];
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    for (const li of items) li.hidden = Boolean(q) && !(li.textContent ?? "").toLowerCase().includes(q);
  });
  // The current component in view in the list.
  const side = document.querySelector<HTMLElement>(".comp-side");
  const here = side?.querySelector<HTMLElement>("[aria-current]");
  if (side && here) side.scrollTop = here.offsetTop - side.clientHeight / 2;
}

// On this page: the section being read is marked.
const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>(".comp-toc a")];
if (tocLinks.length && "IntersectionObserver" in window) {
  const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id);
      const first = [...byId.keys()].find((id) => seen.has(id));
      if (!first) return;
      for (const [id, a] of byId) id === first ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
    },
    { rootMargin: "-10% 0px -70% 0px" },
  );
  for (const id of byId.keys()) {
    const target = document.getElementById(id);
    if (target) io.observe(target);
  }
}

// The front page's header links go to its own sections, so the underline follows the section being
// read (Home above the first), and moves at once on a click. The section counts as read once its
// top passes a third of the way down the window.
const headerLinks = [...document.querySelectorAll<HTMLAnchorElement>(".cap-site-header-sections a")];
const sectionLinks = headerLinks.filter((a) => a.pathname === location.pathname && a.hash);
const homeLink = headerLinks.find((a) => a.getAttribute("aria-current") === "page");
if (sectionLinks.length && homeLink) {
  const mark = (on: HTMLAnchorElement) => {
    for (const a of [homeLink, ...sectionLinks]) {
      if (a === on) {
        a.setAttribute("aria-current", a === homeLink ? "page" : "location");
        if (a !== homeLink) a.dataset.current = "";
      } else {
        a.removeAttribute("aria-current");
        delete a.dataset.current;
      }
    }
  };
  let queued = false;
  const spy = () => {
    queued = false;
    const line = innerHeight / 3;
    let on = homeLink;
    for (const a of sectionLinks) {
      const top = document.getElementById(a.hash.slice(1))?.getBoundingClientRect().top;
      if (top !== undefined && top <= line) on = a;
    }
    mark(on);
  };
  addEventListener("scroll", () => {
    if (!queued) requestAnimationFrame(spy);
    queued = true;
  }, { passive: true });
  for (const a of sectionLinks) a.addEventListener("click", () => mark(a));
  spy();
}
