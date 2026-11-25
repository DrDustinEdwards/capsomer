// The popover and the tooltip, on the Popover API. One module, two behaviors picked by the
// popup's role:
//   - a click popover (role="dialog", popover="auto"): the trigger toggles it, light dismiss
//     and Esc close it, focus moves in on open and returns to the trigger on close;
//   - a tooltip (role="tooltip", popover="manual"): shown on hover after a delay (at once when
//     another tip is open or just closed) and on keyboard focus, hidden on Esc, blur and
//     leave, and hoverable (WCAG 1.4.13: dismissible, hoverable, persistent).
// Placement is CSS anchor positioning where the browser has it (popover.css), checked against
// the viewport after opening; where it is missing, or the popup would leave the window, `place`
// computes it from getBoundingClientRect with a flip and a shift. Every dynamic value goes
// through the CSSOM (apps keep style-src 'self').

import { listenInto } from "../hooks/hooks.ts";
import {
  type PlaceOptions,
  supportsAnchor,
  offsetOf,
  type VirtualAnchor,
  place,
  settle,
} from "./popover-place.ts";
export { supportsAnchor, place } from "./popover-place.ts";
export type { Side, Align, PlaceOptions, Placement, VirtualAnchor } from "./popover-place.ts";

export const SHOW_DELAY_MS = 300;
export const HIDE_GRACE_MS = 150;
// A tooltip opens at once when another is open or closed less than this long ago.
export const GROUP_MS = 400;

let anchors = 0;

function isOpen(popup: HTMLElement): boolean {
  try {
    return popup.matches(":popover-open");
  } catch {
    return false;
  }
}

interface Instance {
  trigger: HTMLElement;
  popup: HTMLElement;
  show: () => void;
  hide: () => void;
  // Esc: close, and (for a tooltip) stay closed until the pointer leaves or focus moves on.
  dismiss: () => void;
}

const instances = new WeakMap<HTMLElement, Instance>();
let openTip: Instance | null = null;
let closedAt = -Infinity;
const openManual = new Set<Instance>();

function onGlobalKey(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  // Esc closes the topmost thing this module opened, and only that: a dialog around it
  // stays open. A tooltip goes first (it is the most recent, smallest layer).
  // A popup removed from the page is hidden without a toggle event (the Popover API's "hide
  // popover" runs with events off), so a tip whose row disappeared would stay recorded as open
  // and swallow the next Esc meant for a dialog. Forget any that are no longer open.
  if (openTip && !isOpen(openTip.popup)) openTip = null;
  for (const inst of openManual) if (!isOpen(inst.popup)) openManual.delete(inst);
  const target = openTip ?? [...openManual].pop();
  if (!target) return;
  e.preventDefault();
  e.stopPropagation();
  target.dismiss();
}

let keyBound = false;
function bindKey(): void {
  if (keyBound) return;
  keyBound = true;
  document.addEventListener("keydown", onGlobalKey, true);
}

function focusables(root: HTMLElement): HTMLElement[] {
  const sel =
    'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]';
  return [...root.querySelectorAll<HTMLElement>(sel)].filter(
    (el) => !el.matches(":disabled, [inert] *, [hidden]") && el.getClientRects().length > 0,
  );
}

// Moves focus into a click popover: [autofocus], else the first focusable, else the popup.
function focusInto(popup: HTMLElement): void {
  const target = popup.querySelector<HTMLElement>("[autofocus]") ?? focusables(popup)[0];
  if (target) target.focus({ preventScroll: true });
  else {
    if (!popup.hasAttribute("tabindex")) popup.setAttribute("tabindex", "-1");
    popup.focus({ preventScroll: true });
  }
}

// Wires a trigger to its popup. The popup's role picks the behavior. Returns a function that
// unwires it.
export function attach(trigger: HTMLElement, popup: HTMLElement): () => void {
  if (instances.has(popup)) return () => undefined;
  const tooltip =
    popup.getAttribute("role") === "tooltip" ||
    (popup.dataset.variant === "tooltip" && !trigger.hasAttribute("popovertarget"));
  if (!popup.hasAttribute("popover")) popup.setAttribute("popover", tooltip ? "manual" : "auto");
  if (!popup.id) popup.id = `cap-popover-${++anchors}`;
  const undo: Array<() => void> = [];
  const on = listenInto(undo);

  // Anchor positioning needs names; the engine can be forced to the JS fallback with
  // data-engine="js" (used by the tests and by apps that must match old browsers exactly).
  const css = supportsAnchor() && popup.dataset.engine !== "js";
  if (css) {
    const name = `--cap-anchor-${++anchors}`;
    trigger.style.setProperty("anchor-name", name);
    popup.style.setProperty("position-anchor", name);
    popup.style.setProperty("--cap-offset", `${offsetOf(popup)}px`);
    undo.push(() => {
      trigger.style.removeProperty("anchor-name");
      popup.style.removeProperty("position-anchor");
      popup.style.removeProperty("--cap-offset");
    });
  }

  let frame = 0;
  const reposition = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!isOpen(popup)) return;
      if (popup.dataset.placedBy === "js") place(trigger, popup);
      else settle(trigger, popup);
    });
  };
  const watch = (on_: boolean) => {
    const f = on_ ? window.addEventListener : window.removeEventListener;
    f.call(window, "scroll", reposition, true);
    f.call(window, "resize", reposition);
  };
  // Runs once the popup is showing: choose the engine, place, and follow scrolling.
  const placeNow = () => {
    if (css) {
      delete popup.dataset.placedBy;
      if (!settle(trigger, popup)) place(trigger, popup);
    } else place(trigger, popup);
    watch(true);
  };

  let me: Instance;
  if (tooltip) {
    if (!popup.getAttribute("role")) popup.setAttribute("role", "tooltip");
    const described = (trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if (!described.includes(popup.id))
      trigger.setAttribute("aria-describedby", [...described, popup.id].join(" "));
    popup.dataset.variant ??= "tooltip";
    const delay = Number(popup.dataset.delay ?? trigger.dataset.delay ?? SHOW_DELAY_MS);

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    // After Esc or a press the tip stays hidden until the pointer leaves or focus moves on.
    let held = false;
    const hide = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      if (isOpen(popup)) popup.hidePopover();
    };
    const show = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      // A trigger whose own menu is open needs no tip over that menu.
      if (held || !popup.isConnected || trigger.getAttribute("aria-expanded") === "true") return;
      if (openTip && openTip !== me) openTip.hide();
      if (!isOpen(popup)) {
        popup.showPopover();
        placeNow();
      }
      openTip = me;
      bindKey();
    };
    me = {
      trigger,
      popup,
      show,
      hide,
      dismiss: () => {
        held = true;
        hide();
      },
    };
    on(popup, "toggle", (e: Event) => {
      if ((e as ToggleEvent).newState !== "closed") return;
      watch(false);
      if (openTip === me) {
        openTip = null;
        closedAt = performance.now();
      }
    });

    const hovered = () => trigger.matches(":hover") || popup.matches(":hover");
    const focused = () => trigger === document.activeElement && trigger.matches(":focus-visible");
    const later = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!hovered() && !focused()) hide();
      }, HIDE_GRACE_MS);
    };
    on(trigger, "pointerenter", (e: PointerEvent) => {
      // Touch has no hover: a tip is never needed there, and a press must not open one.
      if (e.pointerType === "touch") return;
      window.clearTimeout(hideTimer);
      if (isOpen(popup)) return;
      window.clearTimeout(showTimer);
      if (openTip || performance.now() - closedAt < GROUP_MS) show();
      else showTimer = window.setTimeout(show, delay);
    });
    on(trigger, "pointerleave", () => {
      window.clearTimeout(showTimer);
      held = false;
      later();
    });
    on(popup, "pointerenter", () => window.clearTimeout(hideTimer));
    on(popup, "pointerleave", () => {
      held = false;
      later();
    });
    // A press on the trigger is an action, not a hover: hide the tip.
    on(trigger, "pointerdown", () => {
      held = true;
      hide();
    });
    on(trigger, "focus", () => {
      if (trigger.matches(":focus-visible")) show();
    });
    on(trigger, "blur", () => {
      held = false;
      if (!hovered()) hide();
    });
  } else {
    popup.setAttribute("role", popup.getAttribute("role") ?? "dialog");
    if (
      popup.getAttribute("role") === "dialog" &&
      !popup.hasAttribute("aria-label") &&
      !popup.hasAttribute("aria-labelledby")
    ) {
      const title = popup.querySelector<HTMLElement>(".cap-popover-title");
      if (title) {
        if (!title.id) title.id = `${popup.id}-title`;
        popup.setAttribute("aria-labelledby", title.id);
      } else if (trigger.textContent?.trim())
        popup.setAttribute("aria-label", trigger.textContent.trim());
    }
    trigger.setAttribute(
      "aria-haspopup",
      popup.getAttribute("role") === "dialog" ? "dialog" : "true",
    );
    trigger.setAttribute("aria-expanded", String(isOpen(popup)));
    const native = trigger instanceof HTMLButtonElement || trigger instanceof HTMLInputElement;
    if (native) {
      if (!trigger.hasAttribute("popovertarget")) trigger.setAttribute("popovertarget", popup.id);
    } else {
      on(trigger, "click", () => (isOpen(popup) ? hide() : show()));
    }
    const manual = popup.getAttribute("popover") === "manual";
    const hide = () => {
      if (isOpen(popup)) popup.hidePopover();
    };
    const show = () => {
      if (!isOpen(popup)) popup.showPopover();
    };
    me = { trigger, popup, show, hide, dismiss: hide };

    on(popup, "beforetoggle", (e: Event) => {
      if ((e as ToggleEvent).newState === "open" && css === false)
        popup.dataset.placedBy = "pending";
    });
    on(popup, "toggle", (e: Event) => {
      const opened = (e as ToggleEvent).newState === "open";
      trigger.setAttribute("aria-expanded", String(opened));
      if (opened) {
        placeNow();
        if (manual) openManual.add(me);
        bindKey();
        focusInto(popup);
      } else {
        watch(false);
        openManual.delete(me);
        // Focus goes back to the trigger when it was inside the popup (or lost to the page),
        // never taken from a control the person moved on to.
        const active = document.activeElement;
        if (!active || active === document.body || popup.contains(active))
          trigger.focus({ preventScroll: true });
      }
    });
    // Moving focus out of the popup (Tab past its last control) closes it, without stealing focus.
    on(popup, "focusout", (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (
        to &&
        !popup.contains(to) &&
        to !== trigger &&
        !(to as Element).closest?.("[popover]:popover-open")
      )
        hide();
    });
    on(popup, "click", (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-popover-close]")) hide();
    });
    if (manual) {
      // Outside press for a manual popover; popover="auto" has it natively.
      on(document, "pointerdown", (e: PointerEvent) => {
        const t = e.target as Node;
        if (isOpen(popup) && !popup.contains(t) && !trigger.contains(t)) hide();
      });
    }
  }
  instances.set(popup, me);
  return () => {
    me.hide();
    undo.forEach((f) => f());
    instances.delete(popup);
  };
}

// Opens a popup at a virtual anchor (a text selection, a point in a canvas): shown, placed by
// script beside the anchor's box, kept beside it as the page scrolls or resizes. Esc and a press
// outside close it (a popover="auto" popup's own light dismiss), and focus goes back to
// `returnFocus` (the editor the selection is in). Returns a function that closes it.
export function openAt(
  popup: HTMLElement,
  anchor: VirtualAnchor,
  options: PlaceOptions & { returnFocus?: HTMLElement | null } = {},
): () => void {
  const { returnFocus, ...placing } = options;
  if (!isOpen(popup)) popup.showPopover();
  const again = () => {
    if (isOpen(popup)) place(anchor, popup, placing);
  };
  again();
  const onToggle = (e: Event) => {
    if ((e as ToggleEvent).newState !== "closed") return;
    done();
    returnFocus?.focus({ preventScroll: true });
  };
  const done = () => {
    popup.removeEventListener("toggle", onToggle);
    window.removeEventListener("scroll", again, true);
    window.removeEventListener("resize", again);
  };
  popup.addEventListener("toggle", onToggle);
  window.addEventListener("scroll", again, true);
  window.addEventListener("resize", again);
  return () => {
    if (isOpen(popup)) popup.hidePopover();
    else done();
  };
}

// Opens a popup (placing it) whether or not it was attached.
export function open(popup: HTMLElement): void {
  const inst = instances.get(popup);
  if (inst) inst.show();
  else if (!isOpen(popup)) popup.showPopover();
}

export function close(popup: HTMLElement): void {
  const inst = instances.get(popup);
  if (inst) inst.hide();
  else if (isOpen(popup)) popup.hidePopover();
}

export function toggle(popup: HTMLElement): void {
  if (isOpen(popup)) close(popup);
  else open(popup);
}

// The trigger of a [data-cap="popover"] root: [data-popover-trigger], else the first
// child that is not the popup.
function triggerOf(root: HTMLElement, popup: HTMLElement): HTMLElement | null {
  return (
    root.querySelector<HTMLElement>("[data-popover-trigger]") ??
    [...root.children].find((c): c is HTMLElement => c instanceof HTMLElement && c !== popup) ??
    null
  );
}

// Attaches every [data-cap="popover"] under root not yet attached. Returns a function that
// detaches them.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='popover']:not([data-cap-ready])",
  )) {
    const popup = el.querySelector<HTMLElement>(":scope > .cap-popover");
    const trigger = popup && triggerOf(el, popup);
    if (!popup || !trigger) continue;
    el.dataset.capReady = "";
    const detach = attach(trigger, popup);
    undo.push(() => {
      detach();
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
