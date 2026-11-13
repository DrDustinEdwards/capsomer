// Drag to dismiss a sheet, in its own module: wireDialog (dialog.ts) loads it when a sheet first
// takes focus, so a page whose sheets stay shut never downloads it.
import { reducedMotion } from "../count-up/count-up.ts";
import { isLocked } from "./dialog.ts";

// Drag to dismiss a sheet (Vaul). The header of a bottom, right or left sheet is its handle:
// it follows the pointer toward the sheet's edge, and on release the sheet closes, as Close
// would, when it went past a third of its size or was flung (faster than 0.5 px a ms);
// otherwise it springs back. Not while the dialog is locked or busy, nor under reduced motion;
// Esc, Close and focus return are unchanged.

// Whether a released drag dismisses: past a third of the sheet, or flung toward its edge.
function dragDismisses(moved: number, size: number, velocity: number): boolean {
  return moved > size / 3 || (moved > 16 && velocity > 0.5);
}

export function wireDrag(dialog: HTMLDialogElement): () => void {
  let drag: {
    id: number;
    head: HTMLElement;
    x: number;
    y: number;
    dir: [number, number];
    size: number;
    moved: number;
    t: number;
    v: number;
    on: boolean;
  } | null = null;
  const place = (px: number, dir: [number, number]) => {
    dialog.style.translate = `${px * dir[0]}px ${px * dir[1]}px`;
    dialog.style.setProperty("--cap-drag", String(drag ? Math.min(1, px / drag.size) : 0));
  };
  const onDown = (e: PointerEvent) => {
    const placement = dialog.dataset.placement;
    const head = (e.target as Element).closest?.<HTMLElement>(".cap-dialog-header");
    if (e.button !== 0 || !head || head.closest("dialog") !== dialog || !dialog.open) return;
    if (
      !["bottom", "right", "left"].includes(placement ?? "") ||
      isLocked(dialog) ||
      reducedMotion()
    )
      return;
    if ((e.target as Element).closest("a, button, input, select, textarea, [contenteditable]"))
      return;
    const r = dialog.getBoundingClientRect();
    // Toward the edge it sits on, whatever the writing direction.
    const dir: [number, number] =
      placement === "bottom" ? [0, 1] : r.left < innerWidth - r.right ? [-1, 0] : [1, 0];
    drag = {
      id: e.pointerId,
      head,
      x: e.clientX,
      y: e.clientY,
      dir,
      size: placement === "bottom" ? r.height : r.width,
      moved: 0,
      t: e.timeStamp,
      v: 0,
      on: false,
    };
    head.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const along = (e.clientX - drag.x) * drag.dir[0] + (e.clientY - drag.y) * drag.dir[1];
    // A press that has not moved 4 px is still a click.
    if (!drag.on && Math.abs(along) < 4) return;
    drag.on = true;
    dialog.dataset.capDragging = "";
    const moved = Math.max(0, along);
    const dt = e.timeStamp - drag.t;
    if (dt > 0) drag.v = (moved - drag.moved) / dt;
    drag.moved = moved;
    drag.t = e.timeStamp;
    place(moved, drag.dir);
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.head.hasPointerCapture(e.pointerId)) d.head.releasePointerCapture(e.pointerId);
    if (!d.on) return;
    delete dialog.dataset.capDragging;
    const css = getComputedStyle(dialog);
    const ease = (name: string) => css.getPropertyValue(name).trim() || "ease-out";
    const from = `${d.moved * d.dir[0]}px ${d.moved * d.dir[1]}px`;
    dialog.style.removeProperty("translate");
    dialog.style.removeProperty("--cap-drag");
    // A pointer that stopped before letting go was not flung.
    const v = e.timeStamp - d.t > 100 ? 0 : d.v;
    if (e.type === "pointerup" && dragDismisses(d.moved, d.size, v)) {
      // On out of the edge while it fades, then gone; the close is Close's, so focus returns.
      const off = dialog.animate(
        { translate: [from, `${d.size * d.dir[0]}px ${d.size * d.dir[1]}px`] },
        {
          duration: parseFloat(css.getPropertyValue("--dur-fast")) || 100,
          easing: ease("--ease-out"),
          fill: "forwards",
        },
      );
      off.onfinish = () => off.cancel();
      dialog.close("drag");
    } else {
      dialog.animate(
        { translate: [from, "0px 0px"] },
        {
          duration: parseFloat(css.getPropertyValue("--dur-slow")) || 400,
          easing: ease("--ease-spring"),
        },
      );
    }
  };
  dialog.addEventListener("pointerdown", onDown);
  dialog.addEventListener("pointermove", onMove);
  dialog.addEventListener("pointerup", onUp);
  dialog.addEventListener("pointercancel", onUp);
  return () => {
    dialog.removeEventListener("pointerdown", onDown);
    dialog.removeEventListener("pointermove", onMove);
    dialog.removeEventListener("pointerup", onUp);
    dialog.removeEventListener("pointercancel", onUp);
  };
}
