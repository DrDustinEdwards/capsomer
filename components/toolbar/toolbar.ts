// The toolbar's behavior (WAI-ARIA Authoring Practices, Toolbar): the bar is one tab stop (a
// roving tabindex), Left and Right move between its controls (swapped right to left; Up and
// Down in a vertical bar), Home and End go to the ends, and the ends wrap. The control last
// focused keeps the stop. No framework; the markdown editor's toolbar uses it too.

// Which item an arrow, Home or End moves to in a roving group (APG toolbar and menu). It wraps.
export function rovingIndex(
  key: string,
  at: number,
  count: number,
  axis: "horizontal" | "vertical" = "horizontal",
  rtl = false,
): number | null {
  if (count <= 0) return null;
  const next = axis === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const prev = axis === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  if (key === next) return (at + 1) % count;
  if (key === prev) return (at - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

// The controls a bar's arrows move between: buttons and links that can take focus. A text field
// keeps its own arrows, so it does not belong in a toolbar (APG).
const TOOLBAR_ITEMS = ":is(button, a[href]):not(:disabled, [hidden])";

export interface ToolbarOptions {
  // An editor's formatting bar: a press with a pointer does not take focus from the editor (its
  // caret and selection stay), and a control used from the keyboard (Enter or Space) hands focus
  // back to the editor once it has run. Returns the editor.
  keepFocus?: () => HTMLElement | null;
}

// Gives one bar its single tab stop and arrow keys. `items` picks its controls. Returns a function
// that detaches. Controls added later join it: the bar is read on every key.
//
// Where the browser has focusgroup (Chrome 150, Edge 150), a plain toolbar takes `focusgroup="toolbar wrap"` and the
// browser gives the single stop, the arrows (reversed right to left), Home, End and the wrap; this script then adds
// no roving of its own, since two roving systems would fight (Modern Web Guidance, toolbar). A bar with its own item
// set (the markdown editor's tools, a tag group's remove buttons) keeps the script, which picks only those items.
// `keepFocus` works either way.
export const NATIVE_FOCUSGROUP =
  typeof HTMLElement !== "undefined" && "focusGroup" in HTMLElement.prototype;

function attachKeepFocus(bar: HTMLElement, items: string, keepFocus: ToolbarOptions["keepFocus"]) {
  if (!keepFocus) return () => {};
  const onDown = (e: PointerEvent) => {
    if ((e.target as Element).closest(items)) e.preventDefault();
  };
  // After the control's own click handler has run (the editor has its command), focus goes back.
  const onUsed = (e: MouseEvent) => {
    if (e.detail !== 0 || !(e.target as Element).closest(items)) return;
    queueMicrotask(() => keepFocus()?.focus({ preventScroll: true }));
  };
  bar.addEventListener("pointerdown", onDown);
  bar.addEventListener("click", onUsed);
  return () => {
    bar.removeEventListener("pointerdown", onDown);
    bar.removeEventListener("click", onUsed);
  };
}

export function attachToolbar(
  bar: HTMLElement,
  items = TOOLBAR_ITEMS,
  options: ToolbarOptions = {},
): () => void {
  const detachKeep = attachKeepFocus(bar, items, options.keepFocus);
  if (NATIVE_FOCUSGROUP && items === TOOLBAR_ITEMS) {
    const had = bar.getAttribute("focusgroup");
    if (had === null) {
      const vertical = bar.getAttribute("aria-orientation") === "vertical";
      bar.setAttribute("focusgroup", vertical ? "toolbar wrap block" : "toolbar wrap");
    }
    return () => {
      detachKeep();
      if (had === null) bar.removeAttribute("focusgroup");
    };
  }
  const all = () => [...bar.querySelectorAll<HTMLElement>(items)];
  const stopOn = (el: HTMLElement | undefined) => {
    for (const item of all()) item.tabIndex = item === el ? 0 : -1;
  };
  const list = all();
  stopOn(list.find((el) => el.getAttribute("tabindex") === "0") ?? list[0]);
  const onFocus = (e: FocusEvent) => {
    const t = e.target as HTMLElement;
    if (all().includes(t)) stopOn(t);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const now = all();
    const at = now.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const axis = bar.getAttribute("aria-orientation") === "vertical" ? "vertical" : "horizontal";
    const next = rovingIndex(
      e.key,
      at,
      now.length,
      axis,
      getComputedStyle(bar).direction === "rtl",
    );
    if (next === null) return;
    e.preventDefault();
    now[next]?.focus();
  };
  bar.addEventListener("focusin", onFocus);
  bar.addEventListener("keydown", onKey);
  return () => {
    bar.removeEventListener("focusin", onFocus);
    bar.removeEventListener("keydown", onKey);
    detachKeep();
  };
}

// Attaches to every [data-cap="toolbar"] under root not yet attached. Returns a function that
// detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const bar of root.querySelectorAll<HTMLElement>(
    "[data-cap='toolbar']:not([data-cap-ready])",
  )) {
    bar.dataset.capReady = "";
    const detach = attachToolbar(bar);
    undo.push(() => {
      detach();
      delete bar.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
