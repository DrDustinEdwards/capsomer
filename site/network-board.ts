// The network board on the front page: the six network sites as one checkerboard after Bridget Riley's Movement in
// Squares (1961), each site a stretch of seven columns in its family color, with a bar under it carrying its name.
// A site whose /health says "warn" or "fail" lights its stretch amber (--warn) or red (--crit) and squeezes its
// columns toward the middle, as Riley's squares compress. The page is built with every site normal; site/home-main.ts
// asks /network.json (worker/index.ts) and draws the board again from the answer. The board itself is decoration
// (aria-hidden); the bar says each site's name and any state in words.
import { FAMILY_SITES, type FamilySite } from "../components/family-footer/family-footer.ts";

export type NetworkState = "normal" | "caution" | "warning";
export type NetworkStates = Partial<Record<string, NetworkState>>;

const COLUMNS = 7;
const ROWS = 8;
const COLUMN = 24;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A /health body's status as a lamp: pass is normal, warn caution, and fail, or no answer, warning. */
export function lampOf(status: unknown): NetworkState {
  return status === "pass" ? "normal" : status === "warn" ? "caution" : "warning";
}

/** The columns' widths for one stretch: even at rest; in trouble, narrowest in the middle, the stretch's width kept. */
function widths(state: NetworkState): number[] {
  const mid = (COLUMNS - 1) / 2;
  const raw = Array.from({ length: COLUMNS }, (_, c) => (state === "normal" ? 1 : 0.15 + Math.abs(c - mid) / mid));
  const sum = raw.reduce((a, v) => a + v, 0);
  return raw.map((v) => (COLUMN * COLUMNS * v) / sum);
}

/** One site's squares, from the stretch's left edge: x, y, width, height. Its parity follows its place in the row. */
export function squares(state: NetworkState, place: number): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  let x = 0;
  widths(state).forEach((w, c) => {
    for (let r = 0; r < ROWS; r++) if ((r + c + place * COLUMNS) % 2 === 0) out.push([x, r * COLUMN, w, COLUMN]);
    x += w;
  });
  return out;
}

const STRETCH = COLUMN * COLUMNS;

function board(sites: readonly FamilySite[], offset: number, states: NetworkStates): string {
  const groups = sites.map((site, k) => {
    const state = states[site.id] ?? "normal";
    const rects = squares(state, offset + k).map(([x, y, w, h]) => `<rect x="${x.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${h}"/>`).join("");
    return `<g data-family="${site.family}" data-site="${site.id}" data-place="${offset + k}" data-state="${state}" transform="translate(${k * STRETCH} 0)">${rects}</g>`;
  });
  return `<svg class="home-net-board" viewBox="0 0 ${STRETCH * sites.length} ${COLUMN * ROWS}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${groups.join("")}</svg>`;
}

function bar(sites: readonly FamilySite[], states: NetworkStates): string {
  return `<ul class="home-net-bar" aria-label="Network sites">${sites
    .map((site) => {
      const state = states[site.id] ?? "normal";
      const word = state === "normal" ? "" : `<span class="home-net-state">${state === "caution" ? "Caution" : "Warning"}</span>`;
      return `<li data-family="${site.family}" data-site="${site.id}" data-state="${state}"><a href="${esc(site.href)}">${esc(site.name)}</a>${word}</li>`;
    })
    .join("")}</ul>`;
}

/** The board's inside: the whole row, and the same sites as two rows of three that the CSS shows on a narrow page. */
export function networkBoard(states: NetworkStates = {}, sites: readonly FamilySite[] = FAMILY_SITES): string {
  const half = Math.ceil(sites.length / 2);
  const rows = [sites.slice(0, half), sites.slice(half)];
  return `<div class="home-net-wide">${board(sites, 0, states)}${bar(sites, states)}</div><div class="home-net-narrow">${rows
    .map((row, i) => `<div>${board(row, i * half, states)}${bar(row, states)}</div>`)
    .join("")}</div>`;
}

/** Draws the built board again for new states, in place: no HTML parsing, so the page's Trusted Types policy holds. */
export function relight(root: ParentNode, states: NetworkStates): void {
  const ns = "http://www.w3.org/2000/svg";
  for (const g of root.querySelectorAll<SVGGElement>("g[data-site]")) {
    const state = states[g.dataset.site ?? ""] ?? "normal";
    if (g.dataset.state === state) continue;
    g.dataset.state = state;
    g.replaceChildren(
      ...squares(state, Number(g.dataset.place)).map(([x, y, w, h]) => {
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", x.toFixed(2));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", w.toFixed(2));
        rect.setAttribute("height", String(h));
        return rect;
      }),
    );
  }
  for (const li of root.querySelectorAll<HTMLLIElement>(".home-net-bar li[data-site]")) {
    const state = states[li.dataset.site ?? ""] ?? "normal";
    li.dataset.state = state;
    li.querySelector(".home-net-state")?.remove();
    if (state === "normal") continue;
    const word = document.createElement("span");
    word.className = "home-net-state";
    word.textContent = state === "caution" ? "Caution" : "Warning";
    li.append(word);
  }
}
