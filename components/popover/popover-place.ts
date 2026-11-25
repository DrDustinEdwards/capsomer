// The popover's fallback placement, for a browser without CSS anchor positioning (popover.ts attaches it). Pure
// geometry: the popup must already be showing, because it is measured.
import { clamp } from "../hooks/hooks.ts";

export type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type Align = "start" | "center" | "end";

export interface PlaceOptions {
  side?: Side;
  align?: Align;
  // Gap between trigger and popup in px (the arrow's own space is added). Default 4.
  offset?: number;
}

export interface Placement {
  // The side the popup really ended up on, after any flip.
  side: "top" | "bottom" | "left" | "right";
  align: Align;
  x: number;
  y: number;
}

const EDGE = 8;
const ARROW = 4;
const ARROW_INSET = 12;

export function supportsAnchor(): boolean {
  return (
    typeof CSS !== "undefined" &&
    CSS.supports("position-area: bottom") &&
    CSS.supports("anchor-name: --x")
  );
}

const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;

function physical(side: Side, rtl: boolean): "top" | "bottom" | "left" | "right" {
  if (side === "inline-start") return rtl ? "right" : "left";
  if (side === "inline-end") return rtl ? "left" : "right";
  return side;
}

function sideOf(popup: HTMLElement): Side {
  const s = popup.dataset.side as Side | undefined;
  if (s) return s;
  return popup.dataset.variant === "tooltip" ? "top" : "bottom";
}

function alignOf(popup: HTMLElement): Align {
  const a = popup.dataset.align;
  return a === "start" || a === "end" ? a : "center";
}

export function offsetOf(popup: HTMLElement): number {
  const n = Number(popup.dataset.offset);
  return popup.dataset.offset !== undefined && Number.isFinite(n) ? n : 4;
}

function setArrow(popup: HTMLElement, side: Placement["side"], along: number): void {
  const prop = side === "top" || side === "bottom" ? "--cap-arrow-x" : "--cap-arrow-y";
  const size = side === "top" || side === "bottom" ? popup.offsetWidth : popup.offsetHeight;
  popup.style.setProperty(prop, `${Math.round(clamp(along, ARROW_INSET, size - ARROW_INSET))}px`);
}

// The fallback placement. The popup must already be showing (it is measured). Writes
// --cap-popover-x / --cap-popover-y (and the arrow's --cap-arrow-x / --cap-arrow-y) on the
// popup, sets data-placed to the side it landed on, and returns where it went.
// Anything with a box: an element, or a virtual anchor such as a text selection's range.
export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect;
}

export function place(
  anchor: Element | VirtualAnchor,
  popup: HTMLElement,
  options: PlaceOptions = {},
): Placement {
  const rtl = getComputedStyle(popup).direction === "rtl";
  const want = physical(options.side ?? sideOf(popup), rtl);
  const align = options.align ?? alignOf(popup);
  const arrow = popup.querySelector(":scope > .cap-popover-arrow") ? ARROW : 0;
  const gap = (options.offset ?? offsetOf(popup)) + arrow;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const r = anchor.getBoundingClientRect();
  const w = popup.offsetWidth;
  const h = popup.offsetHeight;

  const room = {
    top: r.top - EDGE,
    bottom: vh - r.bottom - EDGE,
    left: r.left - EDGE,
    right: vw - r.right - EDGE,
  };
  const need = want === "top" || want === "bottom" ? h + gap : w + gap;
  const opp = OPPOSITE[want];
  const side = room[want] < need && room[opp] > room[want] ? opp : want;

  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    y = side === "bottom" ? r.bottom + gap : r.top - gap - h;
    // "start" is the leading edge of the trigger in the reading direction.
    const lead = align === "start" ? !rtl : align === "end" ? rtl : null;
    x = lead === null ? r.left + (r.width - w) / 2 : lead ? r.left : r.right - w;
    x = clamp(x, EDGE, vw - w - EDGE);
    y = clamp(y, EDGE, vh - h - EDGE);
    setArrow(popup, side, r.left + r.width / 2 - x);
  } else {
    x = side === "right" ? r.right + gap : r.left - gap - w;
    y = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + (r.height - h) / 2;
    y = clamp(y, EDGE, vh - h - EDGE);
    x = clamp(x, EDGE, vw - w - EDGE);
    setArrow(popup, side, r.top + r.height / 2 - y);
  }
  x = Math.round(x);
  y = Math.round(y);
  popup.dataset.placedBy = "js";
  popup.dataset.placed = side;
  popup.style.setProperty("--cap-popover-x", `${x}px`);
  popup.style.setProperty("--cap-popover-y", `${y}px`);
  return { side, align, x, y };
}

// After CSS anchor positioning has placed the popup: read which side it is on (the CSS may
// have flipped it), point the arrow at the trigger, and say whether it is inside the window.
export function settle(anchor: Element, popup: HTMLElement): boolean {
  const a = anchor.getBoundingClientRect();
  const p = popup.getBoundingClientRect();
  const rtl = getComputedStyle(popup).direction === "rtl";
  const want = physical(sideOf(popup), rtl);
  const side =
    want === "top" || want === "bottom"
      ? p.top + p.height / 2 < a.top + a.height / 2
        ? "top"
        : "bottom"
      : p.left + p.width / 2 < a.left + a.width / 2
        ? "left"
        : "right";
  popup.dataset.placed = side;
  if (side === "top" || side === "bottom") setArrow(popup, side, a.left + a.width / 2 - p.left);
  else setArrow(popup, side, a.top + a.height / 2 - p.top);
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  return p.left >= -1 && p.top >= -1 && p.right <= vw + 1 && p.bottom <= vh + 1;
}
