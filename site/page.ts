// The script of every page (the pages read whole without it; site/chrome.ts and the section modules write them). The
// header, its search and its theme button are Capsomer's own site header. A Themes page's controls and its live token
// values; a component page's example frames and their code; the section list's filter and the page's sections marked
// as you read; the icons' search, size and copy; the colors' chips and copy; the front page's network board.
import { staticSearch, type StaticSearchIndex } from "@drdustinedwards/site-helpers/search";
import { copyText } from "../components/copy/copy.ts";
import { enhance as enhanceHeader } from "../components/site-header/site-header.ts";
import { enhance as enhanceTabs } from "../components/tabs/tabs.ts";
import {
  effectiveTheme,
  enhance as enhanceTheme,
} from "../components/theme-switch/theme-switch.ts";
import { relight, type NetworkStates } from "./network-board.ts";

// The header's search answers from the same index the search page reads (site/search.ts), loaded
// once, on the first word typed.
let index: Promise<StaticSearchIndex> | undefined;
enhanceHeader(document, {
  suggest: async (query) => {
    index ??= fetch("/search.json").then((r) =>
      r.ok ? (r.json() as Promise<StaticSearchIndex>) : Promise.reject(new Error(String(r.status))),
    );
    index.catch(() => (index = undefined));
    return staticSearch(await index, query).map((r) => ({
      url: r.url,
      title: r.heading ? `${r.title}: ${r.heading}` : r.title,
      detail: r.snippet,
    }));
  },
});
enhanceTheme();
enhanceTabs();

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
  // Before the example has marked itself shown there is nothing to measure, so the reserved height stands (a 360 px
  // fallback here made the frame jump open and back on a slow load).
  if (frame.dataset.kind !== "only" && !shown) return;
  const tall =
    frame.dataset.kind === "only" || !shown
      ? Number(frame.dataset.height) || 360
      : Math.max(140, Math.ceil(shown.getBoundingClientRect().height) + 48);
  // The CSS reserves the height measured for this page width (site/frame-heights.css), so the script only grows a
  // frame past it: shrinking and growing again as the example settles would shift the page (CLS).
  frame.style.removeProperty("block-size");
  const reserved = parseFloat(getComputedStyle(frame).blockSize) || 0;
  frame.style.setProperty("block-size", `${Math.max(tall, reserved)}px`);
};
// An example can paint taller than it settles (a dialog before its script closes it), so a size is read once the
// example has been still for a moment, and a frame never grows for a state that is gone.
const timers = new WeakMap<HTMLIFrameElement, number>();
const settled = (frame: HTMLIFrameElement) => {
  clearTimeout(timers.get(frame));
  timers.set(
    frame,
    window.setTimeout(() => syncFrame(frame), 250),
  );
};
for (const frame of frames) {
  frame.addEventListener("load", () => {
    settled(frame);
    const shown = frame.contentDocument?.querySelector(".cap-specimen-shown");
    if (shown && frame.dataset.kind !== "only")
      new ResizeObserver(() => settled(frame)).observe(shown);
  });
  syncFrame(frame);
}
const resync = () => frames.forEach(syncFrame);
new MutationObserver(resync).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", resync);

// An example's code starts closed to its first lines, with View code over it; install code stays open.
const copyCode = async (button: HTMLButtonElement, text: string) => {
  const was = button.textContent;
  button.textContent = (await copyText(text)) ? "Copied" : "Copy failed";
  setTimeout(() => (button.textContent = was), 2000);
};
for (const box of document.querySelectorAll<HTMLElement>(".comp-ex-code")) {
  const show = box.querySelector<HTMLButtonElement>("[data-cap-part='show-code']");
  const copyButton = box.querySelector<HTMLButtonElement>("[data-cap-part='copy-code']");
  const code = box.querySelector("code")?.textContent ?? "";
  if (copyButton && navigator.clipboard) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", () => void copyCode(copyButton, code));
  }
  if (!show) continue;
  // Closed, the code cannot scroll and View code is the way in, so the box leaves the tab order until it opens. The
  // server wrote it closed (home.ts), so nothing here changes its size.
  const pre = box.querySelector("pre");
  pre?.setAttribute("tabindex", "-1");
  show.addEventListener("click", () => {
    const closed = box.toggleAttribute("data-closed");
    pre?.setAttribute("tabindex", closed ? "-1" : "0");
    show.textContent = closed ? "View code" : "Hide code";
    show.setAttribute("aria-expanded", String(!closed));
  });
}

// The section list's filter.
const sideFind = document.querySelector<HTMLElement>("[data-cap-part='side-find']");
if (sideFind) {
  sideFind.hidden = false;
  const input = sideFind.querySelector("input");
  const items = [...document.querySelectorAll<HTMLLIElement>(".comp-side li")];
  input?.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    for (const li of items)
      li.hidden = Boolean(q) && !(li.textContent ?? "").toLowerCase().includes(q);
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
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target.id);
        else seen.delete(e.target.id);
      }
      const first = [...byId.keys()].find((id) => seen.has(id));
      if (!first) return;
      for (const [id, a] of byId) {
        if (id === first) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      }
    },
    { rootMargin: "-10% 0px -70% 0px" },
  );
  for (const id of byId.keys()) {
    const target = document.getElementById(id);
    if (target) io.observe(target);
  }
}

// The network board: built with every site normal, then drawn again from each site's /health as the Worker reads it
// (/network.json, held a minute at the edge). With no answer the board stays as built.
const net = document.querySelector<HTMLElement>("[data-cap-part='network']");
if (net) {
  fetch("/network.json")
    .then((r) =>
      r.ok
        ? (r.json() as Promise<{ sites?: NetworkStates }>)
        : Promise.reject(new Error(String(r.status))),
    )
    .then((body) => {
      if (body.sites) relight(net, body.sites);
    })
    .catch(() => {});
}

// ---- a Themes page -------------------------------------------------------------------------

// The controls set the board's family, theme and density, as a site does with data-family, data-cap-theme and
// data-density; each token's sample and value are then read back from the board, so the table says what it shows.
const controls = document.querySelector<HTMLElement>("[data-cap-part='controls']");
const boards = [...document.querySelectorAll<HTMLElement>("[data-cap-part='board']")];
const paintTokens = () => {
  const from = (scheme?: string) =>
    boards.find((b) => !scheme || b.dataset.scheme === scheme) ?? document.documentElement;
  for (const val of document.querySelectorAll<HTMLElement>(".th-val[data-token]")) {
    const value = getComputedStyle(from(val.dataset.scheme))
      .getPropertyValue(`--${val.dataset.token}`)
      .trim();
    const code = val.querySelector("code");
    if (code && value) code.textContent = value;
  }
  for (const demo of document.querySelectorAll<HTMLElement>(".th-demo")) {
    const token = demo.dataset.token ?? demo.closest<HTMLElement>(".th-val")?.dataset.token;
    const scheme = demo.closest<HTMLElement>(".th-val")?.dataset.scheme;
    if (!token) continue;
    const css = `var(--${token})`;
    const prop: Record<string, string> = {
      color: "background",
      radius: "border-radius",
      shadow: "box-shadow",
      space: "inline-size",
      type: "font-size",
    };
    const name = prop[demo.dataset.kind ?? ""];
    if (!name) continue;
    // A sample sits in the table, outside the board, so it takes the board's family and theme to read the same.
    const board = from(scheme);
    if (board !== document.documentElement) {
      for (const a of ["family", "capTheme", "density"] as const) {
        const v = board.dataset[a];
        if (v) demo.dataset[a] = v;
        else delete demo.dataset[a];
      }
    }
    demo.style.setProperty(name, css);
  }
};
if (controls && boards.length) {
  controls.hidden = false;
  const set = (attr: "family" | "capTheme" | "density", value: string | null) => {
    for (const b of boards) {
      if (value === null) delete b.dataset[attr];
      else b.dataset[attr] = value;
    }
    paintTokens();
  };
  controls
    .querySelector<HTMLSelectElement>("#th-family")
    ?.addEventListener("change", (e) => set("family", (e.target as HTMLSelectElement).value));
  for (const input of controls.querySelectorAll<HTMLInputElement>("input[name='th-scheme']"))
    input.addEventListener("change", () =>
      set("capTheme", input.value === "page" ? null : input.value),
    );
  for (const input of controls.querySelectorAll<HTMLInputElement>("input[name='th-density']"))
    input.addEventListener("change", () =>
      set("density", input.value === "default" ? null : input.value),
    );
  // The board's own chips and switch respond, so it behaves like the components it shows.
  for (const chip of document.querySelectorAll<HTMLButtonElement>(".th-board .cap-chip"))
    chip.addEventListener("click", () =>
      chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true")),
    );
  for (const sw of document.querySelectorAll<HTMLInputElement>(".th-board .cap-switch input"))
    sw.addEventListener("change", () => {
      const state = sw.parentElement?.querySelector(".cap-switch-state");
      if (state) state.textContent = sw.checked ? "On" : "Off";
    });
}
if (document.querySelector(".th-val, .th-demo")) {
  paintTokens();
  // The page's own theme moves the values too.
  new MutationObserver(paintTokens).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintTokens);
}

// ---- Icons and Colors ----------------------------------------------------------------------

// A click copies the icon's name or the step's value, said in the page's status line.
const copied = document.querySelector<HTMLElement>("#icon-n, #copy-n");
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  button.addEventListener("click", () => {
    const text = button.dataset.copy ?? "";
    void copyText(text).then((ok) => {
      if (copied) copied.textContent = ok ? `Copied ${text}` : "Copy failed";
      button.dataset.copied = ok ? "" : "failed";
      setTimeout(() => delete button.dataset.copied, 1500);
    });
  });
}
for (const chip of document.querySelectorAll<HTMLElement>(".sw-step[data-hex]"))
  chip
    .querySelector<HTMLElement>(".sw-chip")
    ?.style.setProperty("background", chip.dataset.hex ?? "");

const iconTools = document.querySelector<HTMLElement>("[data-cap-part='icon-tools']");
const iconGrid = document.querySelector<HTMLElement>("[data-cap-part='icons']");
if (iconTools && iconGrid) {
  iconTools.hidden = false;
  const tiles = [...iconGrid.querySelectorAll<HTMLLIElement>("li[data-name]")];
  const find = iconTools.querySelector<HTMLInputElement>("#icon-find");
  find?.addEventListener("input", () => {
    const q = find.value.trim().toLowerCase();
    let shown = 0;
    for (const li of tiles) {
      li.hidden = Boolean(q) && !(li.dataset.name ?? "").includes(q);
      if (!li.hidden) shown++;
    }
    if (copied) copied.textContent = q ? `${shown} of ${tiles.length} icons` : "";
  });
  for (const input of iconTools.querySelectorAll<HTMLInputElement>("input[name='icon-size']"))
    input.addEventListener("change", () =>
      iconGrid.style.setProperty("--icon-size", `${input.value}px`),
    );
}
