// A tooltip: extra detail about a control, never the only place its label appears. It is the
// shared popover's tooltip variant (components/popover): the Popover API (popover="manual",
// role="tooltip"), shown on hover after 300 ms (at once when another tip is open or has just
// closed) and on keyboard focus, hidden on Esc, on blur and when the pointer leaves, and the
// pointer can move onto it without it closing (WCAG 1.4.13: dismissible, hoverable,
// persistent). This module keeps the 0.1 contract on top of it: a trigger names its tip with
// data-cap-tip="<id>", and attach(trigger, tip) wires one pair.
import { attach as attachPopover, close, open } from "../popover/popover.ts";

export { HIDE_GRACE_MS, SHOW_DELAY_MS, place, supportsAnchor } from "../popover/popover.ts";

const tips = new WeakMap<HTMLElement, HTMLElement>();

// Wires one trigger to its tip: the tip gets the popover surface (cap-popover, the tooltip
// variant), popover="manual" and role="tooltip", and the trigger aria-describedby. Returns a
// function that unwires it.
export function attach(trigger: HTMLElement, tip: HTMLElement): () => void {
  tip.classList.add("cap-popover");
  tip.dataset.variant ??= "tooltip";
  if (!tip.hasAttribute("popover")) tip.setAttribute("popover", "manual");
  if (!tip.getAttribute("role")) tip.setAttribute("role", "tooltip");
  tips.set(trigger, tip);
  const detach = attachPopover(trigger, tip);
  return () => {
    detach();
    tips.delete(trigger);
  };
}

// Shows or hides the tip of a trigger that is attached.
export function showTip(trigger: HTMLElement): void {
  const tip = tips.get(trigger);
  if (tip) open(tip);
}
export function hideTip(trigger: HTMLElement): void {
  const tip = tips.get(trigger);
  if (tip) close(tip);
}

// Attaches to every [data-cap-tip] trigger under root not yet attached; the attribute's
// value is the id of its tip. Returns a function that detaches.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const trigger of root.querySelectorAll<HTMLElement>("[data-cap-tip]:not([data-cap-ready])")) {
    const tip = document.getElementById(trigger.dataset.capTip ?? "");
    if (!tip) continue;
    trigger.dataset.capReady = "";
    const detach = attach(trigger, tip);
    undo.push(() => {
      detach();
      delete trigger.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
