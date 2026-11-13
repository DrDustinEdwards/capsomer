import type { ReactNode } from "react";
export interface LeaderboardEntry {
    id: string | number;
    name: string;
    score: number;
    mine?: boolean;
}
export interface LeaderboardProps {
    entries: LeaderboardEntry[];
    label?: string;
    empty?: ReactNode;
    format?: (score: number) => string;
}
export declare function Leaderboard({ entries, label, empty, format, }: LeaderboardProps): import("react").JSX.Element;
