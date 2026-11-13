import type { ReactNode } from "react";

export interface LeaderboardEntry {
  id: string | number;
  name: string;
  score: number;
  // The reader's own entry.
  mine?: boolean;
}

export interface LeaderboardProps {
  // Highest first, as the server ranked them.
  entries: LeaderboardEntry[];
  label?: string;
  empty?: ReactNode;
  // How a score reads ("1,204"); the locale's grouping by default.
  format?: (score: number) => string;
}

// The HTML contract in leaderboard.md. The rank is the list's own order, drawn by CSS.
export function Leaderboard({
  entries,
  label = "Leaderboard",
  empty = "No scores yet.",
  format = (n) => n.toLocaleString("en-US"),
}: LeaderboardProps) {
  if (!entries.length) return <p className="cap-leaderboard-empty">{empty}</p>;
  return (
    <ol className="cap-leaderboard" aria-label={label}>
      {entries.map((e) => (
        <li className="cap-leaderboard-row" key={e.id} aria-current={e.mine ? "true" : undefined}>
          <span className="cap-leaderboard-name">{e.name}</span>
          <span className="cap-leaderboard-score">{format(e.score)}</span>
        </li>
      ))}
    </ol>
  );
}
