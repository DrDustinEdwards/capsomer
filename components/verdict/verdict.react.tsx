import { plural } from "../hooks/hooks.ts";
import type { ReactNode } from "react";
import { Status, type Tone } from "../status/status.react.tsx";

export interface VerdictProblem {
  key: string;
  // Where it is fixed: a link or a button, named for the problem.
  label: ReactNode;
  tone?: "crit" | "warn";
}

export interface VerdictProps {
  problems: VerdictProblem[];
  // The words when there are none: "All good".
  okLabel?: string;
  // What all good means, after it: "Sites, backups and default branches were fine on the last pass."
  okNote?: ReactNode;
  // The singular and plural: ["problem", "problems"].
  noun?: [string, string];
  // How many are named; the rest are "and 4 more".
  named?: number;
  // The rest, as a link or button to the full list: (n) => <a href="/needs">{n} more</a>.
  more?: (rest: number) => ReactNode;
  // No answer yet (the data has not loaded or did not come): the verdict says so, never "All good".
  unknown?: ReactNode;
  className?: string;
}

// The answer to "is anything wrong?" in one line: "All good" with what that covers, or how many
// problems and the first few by name, each a way to where it is fixed. The worst tone leads.
export function Verdict({
  problems,
  okLabel = "All good",
  okNote,
  noun = ["problem", "problems"],
  named = 3,
  more,
  unknown,
  className,
}: VerdictProps) {
  const cls = className ? `cap-verdict ${className}` : "cap-verdict";
  if (unknown != null) {
    return (
      <p className={cls} data-verdict="unknown">
        <Status tone="nodata">Not known</Status>
        <span className="cap-verdict-note">{unknown}</span>
      </p>
    );
  }
  if (problems.length === 0) {
    return (
      <p className={cls} data-verdict="ok">
        <Status tone="ok">{okLabel}</Status>
        {okNote != null && <span className="cap-verdict-note">{okNote}</span>}
      </p>
    );
  }
  const tone: Tone = problems.some((p) => p.tone === "crit") ? "crit" : "warn";
  const shown = problems.slice(0, Math.max(1, named));
  const rest = problems.length - shown.length;
  return (
    <p className={cls} data-verdict="problems">
      <Status tone={tone}>{plural(problems.length, noun[0], noun[1])}:</Status>
      <span className="cap-verdict-list">
        {shown.map((p, i) => (
          <span key={p.key}>
            {p.label}
            {i < shown.length - 1 ? <span aria-hidden="true"> · </span> : null}
            {i < shown.length - 1 ? <span className="cap-sr-only">, </span> : null}
          </span>
        ))}
        {rest > 0 ? (
          <>
            {" and "}
            {more ? more(rest) : `${rest} more`}
          </>
        ) : null}
      </span>
    </p>
  );
}
