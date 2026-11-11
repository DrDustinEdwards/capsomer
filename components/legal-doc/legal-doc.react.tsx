import { useId, type ReactNode } from "react";

// A legal or policy page (legal-doc.md): the title, the date it was last changed, a numbered
// contents list and the numbered sections it links to. The numbers and the contents come from the
// one `sections` list, so they cannot drift apart. Section bodies are prose (`.cap-prose` look).

export interface LegalSection {
  // The fragment the contents link to: "data-we-collect".
  id: string;
  title: string;
  body: ReactNode;
}

export interface LegalDocProps {
  title: ReactNode;
  // The day the text last changed, YYYY-MM-DD. The same date belongs in the sitemap's lastmod.
  updated: string;
  sections: readonly LegalSection[];
  // Text before the contents (a summary card, an unnumbered preamble).
  intro?: ReactNode;
  // Text after the last section (contact lines).
  outro?: ReactNode;
  contentsLabel?: string;
  updatedLabel?: string;
  headingLevel?: "h1" | "h2";
  className?: string;
}

const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// "November 11, 2026" for "2026-11-11", the same on the server and in every visitor's zone.
export function updatedWords(updated: string): string {
  const t = Date.parse(`${updated}T00:00:00Z`);
  return Number.isNaN(t) ? updated : longDate.format(t);
}

export function LegalDoc(props: LegalDocProps) {
  const {
    title,
    updated,
    sections,
    intro,
    outro,
    contentsLabel = "Contents",
    updatedLabel = "Last updated",
    headingLevel: H = "h1",
    className,
  } = props;
  const contentsId = useId();
  const S = H === "h1" ? "h2" : "h3";
  return (
    <article className={className ? `cap-legal ${className}` : "cap-legal"}>
      <header className="cap-legal-head">
        <H className="cap-legal-title">{title}</H>
        <p className="cap-legal-updated">
          {updatedLabel} <time dateTime={updated}>{updatedWords(updated)}</time>
        </p>
      </header>
      {intro ? <div className="cap-legal-intro">{intro}</div> : null}
      {sections.length > 1 ? (
        <nav className="cap-legal-contents" aria-labelledby={contentsId}>
          <S id={contentsId} className="cap-legal-contents-title">
            {contentsLabel}
          </S>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <ol className="cap-legal-sections">
        {sections.map((s, i) => (
          <li key={s.id}>
            <section aria-labelledby={s.id}>
              <S id={s.id} className="cap-legal-section-title">
                <span className="cap-legal-num">{i + 1}.</span> {s.title}
              </S>
              <div className="cap-legal-body">{s.body}</div>
            </section>
          </li>
        ))}
      </ol>
      {outro ? <div className="cap-legal-outro">{outro}</div> : null}
    </article>
  );
}
