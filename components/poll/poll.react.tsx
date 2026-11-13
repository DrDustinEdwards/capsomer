import { useRef } from "react";
import { useIsoLayoutEffect } from "../hooks/hooks.react.tsx";
import { setShares } from "./poll.ts";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface PollProps {
  options: PollOption[];
  // The reader's own vote or votes.
  mine?: string[];
  onVote?: (id: string) => void;
  closed?: boolean;
  pending?: boolean;
  label?: string;
}

// The HTML contract in poll.md.
export function Poll({ options, mine = [], onVote, closed, pending, label }: PollProps) {
  const ref = useRef<HTMLUListElement>(null);
  const key = options.map((o) => `${o.id}:${o.votes}`).join(",");
  useIsoLayoutEffect(() => {
    if (ref.current) setShares(ref.current);
  }, [key]);
  return (
    <ul ref={ref} className="cap-poll" aria-label={label}>
      {options.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            className="cap-poll-option"
            data-votes={o.votes}
            aria-pressed={mine.includes(o.id)}
            disabled={closed || pending}
            onClick={() => onVote?.(o.id)}
          >
            <span className="cap-poll-label">{o.label}</span>
            <span className="cap-poll-count">
              {o.votes}
              <span className="cap-sr-only">{o.votes === 1 ? " vote" : " votes"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
