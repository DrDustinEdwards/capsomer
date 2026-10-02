// The avatar's one behaviour: an image that fails to load gives way to the initials already
// in the HTML. Without script the picture simply covers them, so a page delivered as HTML
// still names the person in text.

const READY = "data-cap-ready";

function watch(root: HTMLElement): () => void {
  const img = root.querySelector<HTMLImageElement>(".cap-avatar-image");
  if (!img) return () => {};
  const fail = () => root.setAttribute("data-state", "error");
  const ok = () => root.removeAttribute("data-state");
  img.addEventListener("error", fail);
  img.addEventListener("load", ok);
  // An image that failed before this ran has already finished with no width.
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail();
  return () => {
    img.removeEventListener("error", fail);
    img.removeEventListener("load", ok);
  };
}

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>('[data-cap="avatar"]')) {
    if (el.hasAttribute(READY)) continue;
    el.setAttribute(READY, "");
    undo.push(watch(el));
  }
  return () => {
    for (const fn of undo) fn();
  };
}

// The initials for a name: the first letters of the first and last words.
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  return `${[...first][0] ?? ""}${[...last][0] ?? ""}`;
}
