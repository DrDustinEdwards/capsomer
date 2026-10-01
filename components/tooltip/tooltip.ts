// A tooltip: extra detail about a control, never the only place its label appears. Built
// on the Popover API (popover="manual"), shown on hover after a short delay and at once on
// keyboard focus, hidden on Esc and on blur, and the pointer can move onto it without it
// closing (WCAG 1.4.13). Positioned by CSS anchor positioning where the browser has it,
// otherwise below the trigger by the numbers here, set through the CSSOM.

export const SHOW_DELAY_MS = 300;
export const HIDE_GRACE_MS = 150;
const GAP = 6;
const EDGE = 8;

export function supportsAnchor(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("anchor-name: --x");
}

// The fallback position: below the trigger, flipped above when there is no room below,
// and kept inside the window.
export function place(trigger: HTMLElement, tip: HTMLElement): void {
  const r = trigger.getBoundingClientRect();
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  let top = r.bottom + GAP;
  if (top + h > window.innerHeight - EDGE && r.top - GAP - h >= EDGE) top = r.top - GAP - h;
  const left = Math.max(EDGE, Math.min(r.left, window.innerWidth - w - EDGE));
  tip.style.setProperty("--cap-tip-top", `${Math.round(top)}px`);
  tip.style.setProperty("--cap-tip-left", `${Math.round(left)}px`);
}

interface Controller {
  show: () => void;
  hide: () => void;
}

const controllers = new WeakMap<HTMLElement, Controller>();
let current: Controller | null = null;
let anchors = 0;

function isOpen(tip: HTMLElement): boolean {
  try {
    return tip.matches(":popover-open");
  } catch {
    return false;
  }
}

// Wires one trigger to its tip. Returns a function that unwires it.
export function attach(trigger: HTMLElement, tip: HTMLElement): () => void {
  if (!tip.hasAttribute("popover")) tip.setAttribute("popover", "manual");
  if (!tip.getAttribute("role")) tip.setAttribute("role", "tooltip");
  const described = (trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  if (tip.id && !described.includes(tip.id)) trigger.setAttribute("aria-describedby", [...described, tip.id].join(" "));

  const anchored = supportsAnchor();
  if (anchored) {
    const name = `--cap-tip-${++anchors}`;
    trigger.style.setProperty("anchor-name", name);
    tip.style.setProperty("position-anchor", name);
  }

  let showTimer: number | undefined;
  let hideTimer: number | undefined;
  // After Esc the tip stays hidden until the pointer leaves or focus moves on.
  let held = false;

  const reposition = () => place(trigger, tip);
  const hide = () => {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    if (isOpen(tip)) tip.hidePopover();
    if (!anchored) {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    }
    if (current === me) current = null;
  };
  const show = () => {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    if (held || !tip.isConnected) return;
    if (current && current !== me) current.hide();
    if (!isOpen(tip)) tip.showPopover();
    if (!anchored) {
      place(trigger, tip);
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
    }
    current = me;
  };
  const me: Controller = { show, hide };
  controllers.set(trigger, me);

  const hovered = () => trigger.matches(":hover") || tip.matches(":hover");
  const focused = () => trigger === document.activeElement;
  const later = () => {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!hovered() && !focused()) hide();
    }, HIDE_GRACE_MS);
  };

  const onEnter = () => {
    window.clearTimeout(hideTimer);
    if (isOpen(tip)) return;
    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(show, SHOW_DELAY_MS);
  };
  const onLeave = () => {
    window.clearTimeout(showTimer);
    held = false;
    later();
  };
  const onTipEnter = () => window.clearTimeout(hideTimer);
  const onFocus = () => show();
  const onBlur = () => {
    held = false;
    if (!hovered()) hide();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !isOpen(tip)) return;
    // Esc closes the tip, and only the tip: a dialog around it stays open.
    e.preventDefault();
    held = true;
    hide();
  };

  trigger.addEventListener("pointerenter", onEnter);
  trigger.addEventListener("pointerleave", onLeave);
  tip.addEventListener("pointerenter", onTipEnter);
  tip.addEventListener("pointerleave", onLeave);
  trigger.addEventListener("focus", onFocus);
  trigger.addEventListener("blur", onBlur);
  document.addEventListener("keydown", onKey);

  return () => {
    hide();
    trigger.removeEventListener("pointerenter", onEnter);
    trigger.removeEventListener("pointerleave", onLeave);
    tip.removeEventListener("pointerenter", onTipEnter);
    tip.removeEventListener("pointerleave", onLeave);
    trigger.removeEventListener("focus", onFocus);
    trigger.removeEventListener("blur", onBlur);
    document.removeEventListener("keydown", onKey);
    controllers.delete(trigger);
  };
}

// Shows or hides the tip of a trigger that is attached.
export function showTip(trigger: HTMLElement): void {
  controllers.get(trigger)?.show();
}
export function hideTip(trigger: HTMLElement): void {
  controllers.get(trigger)?.hide();
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
