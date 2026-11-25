// The popover and the tooltip, on the Popover API; the popup's role picks the behavior.
// A tooltip is hoverable and dismissible (WCAG 1.4.13). Placement is CSS anchor positioning where
// available, else `place` (flip and shift). Dynamic values go through the CSSOM (style-src 'self').

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
  dismiss: () => void;
}

const instances = new WeakMap<HTMLElement, Instance>();
let openTip: Instance | null = null;
let closedAt = -Infinity;
const openManual = new Set<Instance>();

function onGlobalKey(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  // Esc closes only the topmost thing this module opened (a tooltip first), not a dialog around it.
  // A popup removed from the page hides without a toggle event, so forget tips no longer open or
  // they would swallow the next Esc meant for a dialog.
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

function focusInto(popup: HTMLElement): void {
  const target = popup.querySelector<HTMLElement>("[autofocus]") ?? focusables(popup)[0];
  if (target) target.focus({ preventScroll: true });
  else {
    if (!popup.hasAttribute("tabindex")) popup.setAttribute("tabindex", "-1");
    popup.focus({ preventScroll: true });
  }
}

export function attach(trigger: HTMLElement, popup: HTMLElement): () => void {
  if (instances.has(popup)) return () => undefined;
  const tooltip =
    popup.getAttribute("role") === "tooltip" ||
    (popup.dataset.variant === "tooltip" && !trigger.hasAttribute("popovertarget"));
  if (!popup.hasAttribute("popover")) popup.setAttribute("popover", tooltip ? "manual" : "auto");
  if (!popup.id) popup.id = `cap-popover-${++anchors}`;
  const undo: Array<() => void> = [];
  const on = listenInto(undo);

  // Anchor positioning needs names; data-engine="js" forces the fallback.
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
    let held = false;
    const hide = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      if (isOpen(popup)) popup.hidePopover();
    };
    const show = () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
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
        // Focus goes back to the trigger only when it was inside the popup or lost, never taken from a control moved on to.
        const active = document.activeElement;
        if (!active || active === document.body || popup.contains(active))
          trigger.focus({ preventScroll: true });
      }
    });
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

// Opens a popup at a virtual anchor (a selection, a point), placed by script and kept beside it;
// focus goes back to `returnFocus`. Returns a function that closes it.
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

function triggerOf(root: HTMLElement, popup: HTMLElement): HTMLElement | null {
  return (
    root.querySelector<HTMLElement>("[data-popover-trigger]") ??
    [...root.children].find((c): c is HTMLElement => c instanceof HTMLElement && c !== popup) ??
    null
  );
}

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
