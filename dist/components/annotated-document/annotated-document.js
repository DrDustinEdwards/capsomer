// The annotated document's linking: a note lights the passages it is about and brings the first into view in the
// document; a passage clicked lights its note and brings it into view in the rail. Changing the view clears it. The
// views themselves are CSS over the segmented control's radios and need no script.
// Extracted from BioScience Writers' editing demo island (app/islands/editing-demo.ts) in 0.132.0.
import { reducedMotion } from "../hooks/hooks.js";
// Scrolls `box` (a scroll container) so `target` sits near its top, without moving the page.
export function bring(box, target, margin) {
    const top = target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - margin;
    box.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
}
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll('[data-cap="annotated"]:not([data-cap-ready])')) {
        const doc = el.querySelector(".cap-annotated-doc");
        const rail = el.querySelector(".cap-annotated-notes");
        if (!doc || !rail)
            continue;
        el.dataset.capReady = "";
        const notes = () => [...rail.querySelectorAll(".cap-annotated-note")];
        for (const n of notes())
            n.setAttribute("aria-pressed", "false");
        const clear = () => {
            for (const m of doc.querySelectorAll("mark[data-lit]"))
                m.removeAttribute("data-lit");
            for (const n of notes())
                n.setAttribute("aria-pressed", "false");
        };
        const light = (note, from) => {
            const on = note.getAttribute("aria-pressed") !== "true";
            clear();
            if (!on)
                return;
            note.setAttribute("aria-pressed", "true");
            const marks = [...doc.querySelectorAll("mark[data-note]")].filter((m) => m.dataset.note === note.dataset.note);
            for (const m of marks)
                m.dataset.lit = "";
            if (from === "note" && marks[0])
                bring(doc, marks[0], 40);
            if (from === "passage")
                bring(rail, note, 12);
        };
        const onRail = (e) => {
            const note = e.target.closest(".cap-annotated-note");
            if (note)
                light(note, "note");
        };
        // A pointer shortcut only: every passage is reached from the keyboard through its note.
        const onDoc = (e) => {
            const mark = e.target.closest("mark[data-note]");
            const note = mark && notes().find((n) => n.dataset.note === mark.dataset.note);
            if (note)
                light(note, "passage");
        };
        const onView = (e) => {
            if (e.target.closest(".cap-annotated-view"))
                clear();
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
        for (const u of undo)
            u();
    };
}
