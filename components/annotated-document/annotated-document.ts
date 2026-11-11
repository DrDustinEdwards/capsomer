// The annotated document's linking: a note lights the passages it is about and brings the first into view in the
// document; a passage clicked lights its note and brings it into view in the rail. Changing the view clears it. The
// views themselves are CSS over the segmented control's radios and need no script.
// Extracted from BioScience Writers' editing demo island (app/islands/editing-demo.ts) in 0.92.0.

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scrolls `box` (a scroll container) so `target` sits near its top, without moving the page.
function bring(box: HTMLElement, target: HTMLElement, margin: number) {
  const top =
    target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - margin;
  box.scrollTo({ top, behavior: reduced() ? "auto" : "smooth" });
}

export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    '[data-cap="annotated"]:not([data-cap-ready])',
  )) {
    const doc = el.querySelector<HTMLElement>(".cap-annotated-doc");
    const rail = el.querySelector<HTMLElement>(".cap-annotated-notes");
    if (!doc || !rail) continue;
    el.dataset.capReady = "";
    const notes = () => [...rail.querySelectorAll<HTMLButtonElement>(".cap-annotated-note")];
    for (const n of notes()) n.setAttribute("aria-pressed", "false");

    const clear = () => {
      for (const m of doc.querySelectorAll("mark[data-lit]")) m.removeAttribute("data-lit");
      for (const n of notes()) n.setAttribute("aria-pressed", "false");
    };
    const light = (note: HTMLButtonElement, from: "note" | "passage") => {
      const on = note.getAttribute("aria-pressed") !== "true";
      clear();
      if (!on) return;
      note.setAttribute("aria-pressed", "true");
      const marks = [...doc.querySelectorAll<HTMLElement>("mark[data-note]")].filter(
        (m) => m.dataset.note === note.dataset.note,
      );
      for (const m of marks) m.dataset.lit = "";
      if (from === "note" && marks[0]) bring(doc, marks[0], 40);
      if (from === "passage") bring(rail, note, 12);
    };

    const onRail = (e: Event) => {
      const note = (e.target as Element).closest<HTMLButtonElement>(".cap-annotated-note");
      if (note) light(note, "note");
    };
    // A pointer shortcut only: every passage is reached from the keyboard through its note.
    const onDoc = (e: Event) => {
      const mark = (e.target as Element).closest<HTMLElement>("mark[data-note]");
      const note = mark && notes().find((n) => n.dataset.note === mark.dataset.note);
      if (note) light(note, "passage");
    };
    const onView = (e: Event) => {
      if ((e.target as Element).closest(".cap-annotated-view")) clear();
    };
    rail.addEventListener("click", onRail);
    doc.addEventListener("click", onDoc);
    el.addEventListener("change", onView);
    undo.push(() => {
      rail.removeEventListener("click", onRail);
      doc.removeEventListener("click", onDoc);
      el.removeEventListener("change", onView);
    });
  }
  return () => {
    for (const u of undo) u();
  };
}
