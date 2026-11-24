// The form menu's behavior: a <details> of submit buttons (and links) that already works with no script.
// With script it also closes on Esc (focus back on the summary), closes on a press or focus
// outside it, and moves between the buttons with the arrow keys; ArrowDown on the summary opens
// it and lands on the first button. The Base UI menu needs none of this; it is React only.

import { enhanceEach } from "../hooks/hooks.ts";

// The items the arrow keys move through: the submit buttons that are not disabled, and link items.
const buttonsOf = (d: HTMLElement) =>
  Array.from(d.querySelectorAll<HTMLElement>(".cap-menu > :is(button:not(:disabled), a[href])"));

// Moves to the next or previous button, wrapping; `from` is the focused one, or -1.
export function stepIndex(count: number, from: number, dir: 1 | -1): number {
  if (count === 0) return -1;
  if (from < 0) return dir === 1 ? 0 : count - 1;
  return (from + dir + count) % count;
}

export function enhance(root: ParentNode | Element = document): () => void {
  return enhanceEach(root, "menu-form", (el) => {
    const d = el as HTMLDetailsElement;
    const summary = d.querySelector<HTMLElement>(":scope > summary");
    const close = (focus: boolean) => {
      d.open = false;
      if (focus) summary?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      const items = buttonsOf(d);
      if (e.key === "Escape" && d.open) {
        e.preventDefault();
        close(true);
      } else if (e.key === "ArrowDown" && e.target === summary && !d.open) {
        e.preventDefault();
        d.open = true;
        items[0]?.focus();
      } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && d.open) {
        const at = items.indexOf(document.activeElement as HTMLElement);
        const next = items[stepIndex(items.length, at, e.key === "ArrowDown" ? 1 : -1)];
        if (next) {
          e.preventDefault();
          next.focus();
        }
      }
    };
    const onOutside = (e: Event) => {
      if (d.open && e.target instanceof Node && !d.contains(e.target)) close(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (d.open && e.relatedTarget instanceof Node && !d.contains(e.relatedTarget)) close(false);
    };
    d.addEventListener("keydown", onKey);
    d.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      d.removeEventListener("keydown", onKey);
      d.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onOutside);
    };
  });
}
