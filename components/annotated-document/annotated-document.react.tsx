import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { bring } from "./annotated-document.ts";

export interface AnnotatedNote {
  // Matches `data-note` on the passages it is about.
  id: string;
  kind: string;
  text: ReactNode;
  tone?: "info" | "ok" | "warn" | "crit";
  // A letter for the kind ("E"). Decoration: the kind is said in words.
  icon?: string;
}

export interface AnnotatedDocumentProps {
  // The document: prose with ins, del and <mark data-note="…" data-tone="…"> passages.
  children: ReactNode;
  notes: AnnotatedNote[];
  // The radios' name. Default: one made up, so two documents on a page do not share a group.
  name?: string;
  label?: string;
  views?: { original: string; edited: string; all: string };
  // The view shown first.
  view?: "original" | "edited" | "all";
  docLabel?: string;
  notesLabel?: string;
}

const VIEWS = { original: "Original", edited: "Simple markup", all: "All markup" };

// The HTML contract in annotated-document.md. The view and the lit note are React state, and the
// linking is done here with the behavior module's `bring`, so `enhance()` is not needed (or used).
export function AnnotatedDocument({
  children,
  notes,
  name,
  label = "Markup view",
  views = VIEWS,
  view = "edited",
  docLabel = "Document",
  notesLabel = "Notes",
}: AnnotatedDocumentProps) {
  const own = useId();
  const [shown, setShown] = useState(view);
  // The note that is lit, and where it was chosen from (its passages or the rail).
  const [lit, setLit] = useState<{ id: string; from: "note" | "passage" } | null>(null);
  const doc = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLUListElement>(null);

  // The passages are the app's children, not elements this component renders, so they are marked
  // through the DOM after the render.
  useEffect(() => {
    const box = doc.current;
    if (!box) return;
    const marks = [...box.querySelectorAll<HTMLElement>("mark[data-note]")];
    for (const m of marks) m.toggleAttribute("data-lit", m.dataset.note === lit?.id);
    if (!lit) return;
    const first = marks.find((m) => m.dataset.note === lit.id);
    const note = rail.current?.querySelector<HTMLElement>(
      `.cap-annotated-note[data-note="${CSS.escape(lit.id)}"]`,
    );
    if (lit.from === "note" && first) bring(box, first, 40);
    if (lit.from === "passage" && note && rail.current) bring(rail.current, note, 12);
  }, [lit, children]);

  const toggle = (id: string, from: "note" | "passage") =>
    setLit((cur) => (cur?.id === id ? null : { id, from }));

  // A passage clicked lights its note: a pointer shortcut only, every passage is reached from the
  // keyboard through its note.
  useEffect(() => {
    const box = doc.current;
    if (!box) return;
    const onClick = (e: MouseEvent) => {
      const id = (e.target as Element).closest<HTMLElement>("mark[data-note]")?.dataset.note;
      if (id && notes.some((n) => n.id === id))
        setLit((cur) => (cur?.id === id ? null : { id, from: "passage" }));
    };
    box.addEventListener("click", onClick);
    return () => box.removeEventListener("click", onClick);
  }, [notes]);

  return (
    <div className="cap-annotated">
      <fieldset className="cap-seg cap-annotated-view">
        <legend className="cap-sr-only">{label}</legend>
        <div className="cap-seg-options">
          {(["original", "edited", "all"] as const).map((v) => (
            <label key={v}>
              <input
                type="radio"
                name={name ?? own}
                value={v}
                checked={v === shown}
                onChange={() => {
                  setShown(v);
                  setLit(null);
                }}
              />{" "}
              {views[v]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="cap-annotated-layout">
        {/* A scroll box is a Tab stop and a named region, so a keyboard can scroll it (WCAG 2.1.1). */}
        <div
          ref={doc}
          className="cap-annotated-doc"
          role="region"
          aria-label={docLabel}
          tabIndex={0}
        >
          {children}
        </div>
        <ul ref={rail} className="cap-annotated-notes" aria-label={notesLabel}>
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="cap-annotated-note"
                data-note={n.id}
                data-tone={n.tone}
                aria-pressed={lit?.id === n.id}
                onClick={() => toggle(n.id, "note")}
              >
                {n.icon ? (
                  <span className="cap-annotated-note-icon" aria-hidden="true">
                    {n.icon}
                  </span>
                ) : null}
                <span className="cap-annotated-note-kind">{n.kind}</span>
                <span className="cap-annotated-note-text">{n.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
