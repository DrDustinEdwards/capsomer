import { useId, type ReactNode } from "react";
import { STATES, order, spokenCount, type SessionState } from "./session-row.ts";

export type { SessionState } from "./session-row.ts";

export interface SessionAnswer {
  id: string;
  // Names the action: "Approve push", "Decline", "Keep 0007".
  label: string;
  variant?: "primary" | "danger";
}

export interface SessionStep {
  label: string;
  count: number;
}

export interface Session {
  id: string;
  agent: string;
  state: SessionState;
  // When the session began waiting, failed, started or was last seen, in milliseconds.
  since: number;
  // The age in words, as the row shows it: "waiting 3 minutes", "started 18 minutes ago".
  age: ReactNode;
  // A plain "now doing" line.
  now?: ReactNode;
  // Repeated steps collapsed with a count: { label: "read file", count: 12 }.
  steps?: SessionStep[];
  // A sampled stream: { shown: 1, of: 10 }.
  sampled?: { shown: number; of: number };
  ask?: {
    question: string;
    // The exact command or question, shown mono and sunken.
    command: string;
    answers: SessionAnswer[];
    note?: ReactNode;
    // The answer in flight, if any.
    busy?: string;
  };
}

export interface SessionListProps {
  sessions: Session[];
  // The list's name, usually the panel heading's text.
  label?: string;
  labelledBy?: string;
  onAnswer?: (session: string, answer: string) => void;
}

const glyphs: Record<string, ReactNode> = {
  warn: (
    <>
      <path fill="currentColor" d="M8 1.2 15.4 14H.6z" />
      <path fill="var(--surface)" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z" />
    </>
  ),
  crit: (
    <>
      <path fill="currentColor" d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" />
      <path fill="var(--surface)" d="M7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z" />
    </>
  ),
  run: (
    <>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2" />
    </>
  ),
  none: <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.2" />,
  stop: <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />,
  info: (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z" />
    </>
  ),
};

const Glyph = ({ kind }: { kind: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    {glyphs[kind]}
  </svg>
);

function Steps({ steps }: { steps: SessionStep[] }) {
  return (
    <p className="cap-session-steps">
      Before that:{" "}
      {steps.map((s, i) => (
        <span key={`${s.label}-${i}`}>
          {i > 0 ? ", " : ""}
          {s.label}
          <span aria-hidden="true" className="cap-session-count">
            {` ×${s.count}`}
          </span>
          <span className="cap-sr-only">{` ${spokenCount(s.count)}`}</span>
        </span>
      ))}
      .
    </p>
  );
}

function Row({ s, onAnswer }: { s: Session; onAnswer?: SessionListProps["onAnswer"] }) {
  const qid = useId();
  const st = STATES[s.state];
  return (
    <li className="cap-session" data-session={s.id} data-tone={st.tone === "crit" ? "crit" : undefined}>
      <div className="cap-session-head">
        <span className="cap-pill" data-tone={st.tone}>
          <Glyph kind={st.glyph} />
          {st.word}
        </span>
        <span className="cap-session-agent">{s.agent}</span>
        <span className="cap-session-age">{s.age}</span>
      </div>
      {s.ask && (
        <div className="cap-session-ask" role="group" aria-labelledby={qid}>
          <p className="cap-session-question" id={qid}>
            {s.ask.question}
          </p>
          <pre className="cap-session-cmd">
            <code>{s.ask.command}</code>
          </pre>
          <div className="cap-session-answers">
            {s.ask.answers.map((a) => {
              const busy = s.ask?.busy === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  className="cap-btn"
                  data-variant={a.variant}
                  data-cap-answer={a.id}
                  aria-busy={busy ? "true" : undefined}
                  onClick={() => {
                    if (!s.ask?.busy) onAnswer?.(s.id, a.id);
                  }}
                >
                  {busy && <span className="cap-btn-spinner" aria-hidden="true" />}
                  {a.label}
                </button>
              );
            })}
            {s.ask.note && <span className="cap-session-note">{s.ask.note}</span>}
          </div>
        </div>
      )}
      {s.now && <p className="cap-session-now">{s.now}</p>}
      {s.steps && s.steps.length > 0 && <Steps steps={s.steps} />}
      {s.sampled && (
        <p className="cap-session-sample">
          <Glyph kind="info" />
          {`Showing ${s.sampled.shown} in ${s.sampled.of} steps.`}
        </p>
      )}
    </li>
  );
}

// The list, ordered waiting on you first. Put it in a .cap-panel whose source line states
// the freshness: "Waiting on you first. Updates every 15 seconds".
export function SessionList({ sessions, label, labelledBy, onAnswer }: SessionListProps) {
  return (
    <ul className="cap-session-list" data-cap="session-row" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}>
      {order(sessions).map((s) => (
        <Row key={s.id} s={s} onAnswer={onAnswer} />
      ))}
    </ul>
  );
}
