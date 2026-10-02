// The breadcrumb's behaviour: a long trail folds its middle levels into a popover of links.
// The server sends the whole trail (every level a real link in the HTML); on a trail with
// data-max-items this module keeps the first level and the last (max - 1) and moves the rest
// into the popover behind a three-dot button. A trail that already carries the folded item
// (the markup the React wrapper renders) only needs its popover attached. Nothing else in a
// breadcrumb needs script.

import { enhance as enhancePopover } from "../popover/popover.ts";

const READY = "data-cap-ready";
let uid = 0;

const DOTS =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="13" cy="8" r="1.4" fill="currentColor"/></svg>';

// Which levels fold: none unless the trail is longer than `max` and at least two levels
// would go (one level is no shorter than the button that replaces it). The first level and
// the last `max - 1` stay. Returns the positions that fold, a run in the middle.
export function foldedLevels(count: number, max: number): number[] {
  const keepEnd = Math.max(1, max - 1);
  const from = 1;
  const to = count - keepEnd; // exclusive
  if (count <= max || to - from < 2) return [];
  return Array.from({ length: to - from }, (_, i) => from + i);
}

// The folded item's markup, the contract in breadcrumb.md. `links` are the levels' anchors.
function foldedItem(links: HTMLAnchorElement[]): HTMLLIElement {
  const id = `cap-breadcrumb-more-${++uid}`;
  const li = document.createElement("li");
  li.className = "cap-breadcrumb-item";
  li.dataset.collapsed = "";
  const wrap = document.createElement("span");
  wrap.dataset.cap = "popover";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cap-breadcrumb-ellipsis";
  button.setAttribute("popovertarget", id);
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", `Show ${links.length} more levels`);
  button.innerHTML = DOTS;
  const pop = document.createElement("div");
  pop.className = "cap-popover";
  pop.id = id;
  pop.setAttribute("popover", "auto");
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "More levels");
  pop.dataset.side = "bottom";
  pop.dataset.align = "start";
  pop.dataset.size = "auto";
  pop.dataset.flush = "";
  const ul = document.createElement("ul");
  ul.className = "cap-breadcrumb-more";
  for (const a of links) {
    const item = document.createElement("li");
    const link = a.cloneNode(true) as HTMLAnchorElement;
    link.className = "cap-breadcrumb-more-link";
    item.append(link);
    ul.append(item);
  }
  pop.append(ul);
  wrap.append(button, pop);
  li.append(wrap);
  return li;
}

// Folds a trail now. Returns a function that puts the levels back, or null when nothing folds.
export function collapse(nav: HTMLElement, max: number): (() => void) | null {
  const list = nav.querySelector<HTMLElement>(".cap-breadcrumb-list");
  if (!list) return null;
  const items = [...list.querySelectorAll<HTMLLIElement>(":scope > .cap-breadcrumb-item")];
  const folded = foldedLevels(items.length, max).map((i) => items[i]).filter((li): li is HTMLLIElement => !!li);
  const links = folded.map((li) => li.querySelector<HTMLAnchorElement>("a")).filter((a): a is HTMLAnchorElement => !!a);
  if (folded.length === 0 || links.length !== folded.length) return null;
  const item = foldedItem(links);
  folded[0]?.before(item);
  for (const li of folded) li.remove();
  const off = enhancePopover(item);
  return () => {
    off();
    item.replaceWith(...folded);
  };
}

// Attaches every [data-cap="breadcrumb"] under root not yet attached: folds a trail that has
// data-max-items, and attaches the popover of a folded item. Returns a function that
// detaches them (a folded trail is put back).
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const nav of root.querySelectorAll<HTMLElement>("[data-cap='breadcrumb']")) {
    if (nav.hasAttribute(READY)) continue;
    nav.setAttribute(READY, "");
    const max = Number(nav.dataset.maxItems);
    const restore = Number.isFinite(max) && max >= 2 ? collapse(nav, Math.floor(max)) : null;
    const off = enhancePopover(nav);
    undo.push(() => {
      off();
      restore?.();
      nav.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
