import type { ReactNode } from "react";

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
  // The control's name, unique on the page.
  name?: string;
  label?: string;
  views?: { original: string; edited: string; all: string };
  // The view shown first.
  view?: "original" | "edited" | "all";
  docLabel?: string;
  notesLabel?: string;
  // The original shows the text alone, with no notes beside it.
  hideNotesInOriginal?: boolean;
  // The view control's place over the document. Omitted: the start.
  viewAlign?: "center" | "end";
  // "tone": each note's kind and icon take its tone's color. Omitted: the kind muted, the icon on a tint.
  kind?: "tone";
}

const VIEWS = { original: "Original", edited: "Simple markup", all: "All markup" };

// The HTML contract in annotated-document.md. `enhance()` from capsomer/behavior/annotated-document adds the linking.
export function AnnotatedDocument({
  children,
  notes,
  name = "annotated-view",
  label = "Markup view",
  views = VIEWS,
  view = "edited",
  docLabel = "Document",
  notesLabel = "Notes",
  hideNotesInOriginal,
  viewAlign,
  kind,
}: AnnotatedDocumentProps) {
  return (
    <div
      className="cap-annotated"
      data-cap="annotated"
      data-hide-notes={hideNotesInOriginal ? "original" : undefined}
      data-view-align={viewAlign}
      data-kind={kind}
    >
      <fieldset className="cap-seg cap-annotated-view">
        <legend className="cap-sr-only">{label}</legend>
        <div className="cap-seg-options">
          {(["original", "edited", "all"] as const).map((v) => (
            <label key={v}>
              <input type="radio" name={name} value={v} defaultChecked={v === view} /> {views[v]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="cap-annotated-layout">
        {/* A scroll box is a Tab stop and a named region, so a keyboard can scroll it (WCAG 2.1.1). */}
        <div className="cap-annotated-doc" role="region" aria-label={docLabel} tabIndex={0}>
          {children}
        </div>
        <ul className="cap-annotated-notes" aria-label={notesLabel}>
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="cap-annotated-note"
                data-note={n.id}
                data-tone={n.tone}
                aria-pressed="false"
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
