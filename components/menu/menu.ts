// The form menu's behaviour: a <details> of submit buttons that already works with no script.
// With script it also closes on Esc (focus back on the summary), closes on a press or focus
// outside it, and moves between the buttons with the arrow keys; ArrowDown on the summary opens
// it and lands on the first button. The Base UI menu needs none of this; it is React only.

const READY = "data-cap-ready";

const buttonsOf = (d: HTMLElement) => Array.from(d.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));

// Moves to the next or previous button, wrapping; `from` is the focused one, or -1.
export function stepIndex(count: number, from: number, dir: 1 | -1): number {
  if (count === 0) return -1;
  if (from < 0) return dir === 1 ? 0 : count - 1;
  return (from + dir + count) % count;
}

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const d of Array.from(root.querySelectorAll<HTMLDetailsElement>("details[data-cap='menu-form']:not([data-cap-ready])"))) {
    d.setAttribute(READY, "");
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
        const at = items.indexOf(document.activeElement as HTMLButtonElement);
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
    undo.push(() => {
      d.removeEventListener("keydown", onKey);
      d.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onOutside);
      d.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
