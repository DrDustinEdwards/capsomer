// The avatar's one behavior: an image that fails to load gives way to the initials already
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

// The initials for a person: the first and last word's first letters ("Alex Rivera": AR), the
// first two letters of a one-word name, else the email's first letter, else "?". Whole letters
// (graphemes), not code units, so an accented or non-Latin name never shows half a letter.
export function initials(name?: string | null, email?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return `${firstGrapheme(words[0]!)}${firstGrapheme(words[words.length - 1]!)}`.toUpperCase();
  if (words.length === 1) return graphemes(words[0]!).slice(0, 2).join("").toUpperCase();
  return (firstGrapheme((email ?? "").trim()) || "?").toUpperCase();
}

const graphemes = (word: string): string[] =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word),
    (g) => g.segment,
  );

/** A word's first user-perceived character (an emoji with its modifiers, a letter with its accents). */
function firstGrapheme(word: string): string {
  return graphemes(word)[0] ?? "";
}
