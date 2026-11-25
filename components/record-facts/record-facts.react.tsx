import type { ReactNode } from "react";
import { linkable } from "../hooks/hooks.ts";

export interface RecordFact {
  label: string;
  // The value. A fact with no value (null, undefined or "") is left out, never shown blank.
  value: ReactNode;
  href?: string;
  mono?: boolean;
}

export interface RecordFactsProps {
  facts: readonly RecordFact[];
}

const present = (f: RecordFact) => f.value !== null && f.value !== undefined && f.value !== "";

export function RecordFacts({ facts }: RecordFactsProps) {
  const shown = facts.filter(present);
  if (shown.length === 0) return null;
  return (
    <dl className="cap-record-facts">
      {shown.map((f) => (
        <div className="cap-record-facts-item" key={f.label}>
          <dt>{f.label}</dt>
          <dd data-mono={f.mono ? "" : undefined}>
            {linkable(f.href) ? <a href={f.href}>{f.value}</a> : f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
