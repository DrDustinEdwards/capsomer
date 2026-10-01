// The row list's behaviour: j and k move keyboard focus between the rows' title links.
// Focus itself moves (there is no second selection), so Enter follows the link, the
// browser scrolls the row into view, and a screen reader reads the row it lands on.
// No framework; the React wrapper uses the same functions.

// Every row's one link or button, in order, skipping rows hidden or disabled.
export function rowTargets(list: ParentNode): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>(".cap-row-title :is(a[href], button:not([disabled]))")).filter(
    (el) => el.getClientRects().length > 0,
  );
}

// Moves focus to the next (1) or previous (-1) row's title. From outside the list, j starts
// at the first row and k at the last (the Portal's rule, App.tsx "step"). At either end
// focus stays where it is. Focus moves without the browser's own scroll, then the row is
// scrolled the least distance that shows it ("nearest"), as the Portal does: a row already
// in view does not jump, and the scroller's scroll-padding keeps it clear of a sticky bar.
// Returns the element focused, or null when nothing moved.
export function moveRowFocus(list: ParentNode, step: 1 | -1): HTMLElement | null {
  const targets = rowTargets(list);
  if (targets.length === 0) return null;
  const active = document.activeElement;
  const current = targets.findIndex((el) => el === active || el.closest(".cap-row")?.contains(active));
  const next = current === -1 ? (step === 1 ? 0 : targets.length - 1) : current + step;
  const el = targets[next];
  if (!el || next === current) return null;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest" });
  return el;
}

// A key typed into a field, or with a modifier, is never a list shortcut.
export function isTyping(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']") !== null;
}

// Single-key shortcuts can be switched off (DEFAULTS.md). The shortcuts registry records the
// choice as data-cap-single-keys="off" on <html>.
export function singleKeysOff(): boolean {
  return document.documentElement.dataset.capSingleKeys === "off";
}

// Whether j and k should act on this list now: focus is in it, or it is the page's primary
// list and focus is in no other list and no open dialog.
export function listOwnsKeys(list: HTMLElement): boolean {
  const active = document.activeElement;
  if (active && list.contains(active)) return true;
  if (!list.hasAttribute("data-cap-primary")) return false;
  if (active?.closest("[data-cap='row-list']")) return false;
  if (active?.closest("dialog[open], [role='dialog'], [role='menu'], [role='listbox']")) return false;
  return !list.closest("[inert]");
}

// Attaches j and k to one list. Returns a function that detaches them. A list already
// attached (by enhance or by the React wrapper) is left alone, so keys never act twice.
export function attachRowList(list: HTMLElement): () => void {
  if (list.dataset.capReady !== undefined) return () => {};
  list.dataset.capReady = "";
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.key !== "j" && e.key !== "k")) return;
    if (isTyping(e) || singleKeysOff() || !listOwnsKeys(list)) return;
    if (moveRowFocus(list, e.key === "j" ? 1 : -1) || list.contains(document.activeElement)) e.preventDefault();
  };
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("keydown", onKey);
    delete list.dataset.capReady;
  };
}

// Attaches to every [data-cap="row-list"] under root that is not attached yet. Returns a
// function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo = Array.from(root.querySelectorAll<HTMLElement>("[data-cap='row-list']:not([data-cap-ready])")).map(attachRowList);
  return () => undo.forEach((f) => f());
}
