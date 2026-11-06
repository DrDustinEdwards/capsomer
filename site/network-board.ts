// The network board on the front page: the six network sites as one checkerboard after Bridget Riley's Movement in
// Squares (1961), each site a stretch of seven columns in its family color, with a bar under it carrying its name.
// A site whose /health says "warn" or "fail" lights its stretch amber (--warn) or red (--crit) and squeezes its
// columns toward the middle, as Riley's squares compress. The page is built with every site normal; site/home-main.ts
// asks /network.json (worker/index.ts) and sets each stretch's state from the answer. The board is decoration, not a
// chart: it plots no quantity, and the bar says each site's name and any state in words. So it is drawn in CSS
// (site/home.css), seven columns of alternating squares per stretch, and hidden from assistive technology; the state
// only sets data-state, and the CSS colors and squeezes the columns.
import { FAMILY_SITES, type FamilySite } from "../components/family-footer/family-footer.ts";

export type NetworkState = "normal" | "caution" | "warning";
export type NetworkStates = Partial<Record<string, NetworkState>>;

const COLUMNS = 7;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A /health body's status as a lamp: pass is normal, warn caution, and fail, or no answer, warning. */
export function lampOf(status: unknown): NetworkState {
  return status === "pass" ? "normal" : status === "warn" ? "caution" : "warning";
}

/** One stretch per site; a column whose top square is filled is data-lead, so the parity runs on across stretches. */
function board(sites: readonly FamilySite[], offset: number, states: NetworkStates): string {
  const stretches = sites.map((site, k) => {
    const place = offset + k;
    const columns = Array.from({ length: COLUMNS }, (_, c) =>
      (c + place * COLUMNS) % 2 === 0 ? "<i data-lead></i>" : "<i></i>",
    ).join("");
    return `<span data-family="${site.family}" data-site="${site.id}" data-state="${states[site.id] ?? "normal"}">${columns}</span>`;
  });
  return `<div class="home-net-board" aria-hidden="true">${stretches.join("")}</div>`;
}

function bar(sites: readonly FamilySite[], states: NetworkStates): string {
  return `<ul class="home-net-bar" aria-label="Network sites">${sites
    .map((site) => {
      const state = states[site.id] ?? "normal";
      const word =
        state === "normal"
          ? ""
          : `<span class="home-net-state">${state === "caution" ? "Caution" : "Warning"}</span>`;
      return `<li data-family="${site.family}" data-site="${site.id}" data-state="${state}"><a href="${esc(site.href)}">${esc(site.name)}</a>${word}</li>`;
    })
    .join("")}</ul>`;
}

/** The board's inside: the whole row, and the same sites as two rows of three that the CSS shows on a narrow page. */
export function networkBoard(
  states: NetworkStates = {},
  sites: readonly FamilySite[] = FAMILY_SITES,
): string {
  const half = Math.ceil(sites.length / 2);
  const rows = [sites.slice(0, half), sites.slice(half)];
  return `<div class="home-net-wide">${board(sites, 0, states)}${bar(sites, states)}</div><div class="home-net-narrow">${rows
    .map((row, i) => `<div>${board(row, i * half, states)}${bar(row, states)}</div>`)
    .join("")}</div>`;
}

/** Sets the built board's states in place: the CSS redraws each stretch, and the bar says the state in words. */
export function relight(root: ParentNode, states: NetworkStates): void {
  for (const stretch of root.querySelectorAll<HTMLElement>(".home-net-board [data-site]"))
    stretch.dataset.state = states[stretch.dataset.site ?? ""] ?? "normal";
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
