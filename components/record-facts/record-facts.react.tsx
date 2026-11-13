import type { ReactNode } from "react";

export interface RecordFact {
  // The fact's name, read first: "Year", "Journal", "DOI".
  label: string;
  // The value. A fact with no value (null, undefined or "") is left out, never shown blank.
  value: ReactNode;
  // Makes the value a link (a DOI to its resolver).
  href?: string;
  // An identifier, set in the mono face.
  mono?: boolean;
}

export interface RecordFactsProps {
  facts: readonly RecordFact[];
}

const present = (f: RecordFact) => f.value !== null && f.value !== undefined && f.value !== "";

// A record's labeled facts as a description list. Which facts a record has, and their words, are
// the site's: a paper's year, stage, journal and DOI; a release's version and date.
export function RecordFacts({ facts }: RecordFactsProps) {
  const shown = facts.filter(present);
  if (shown.length === 0) return null;
  return (
    <dl className="cap-record-facts">
      {shown.map((f) => (
        <div className="cap-record-facts-item" key={f.label}>
          <dt>{f.label}</dt>
          <dd data-mono={f.mono ? "" : undefined}>
            {f.href ? <a href={f.href}>{f.value}</a> : f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
