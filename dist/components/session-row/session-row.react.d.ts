import { type ReactNode } from "react";
import { type SessionState } from "./session-row.ts";
export type { SessionState } from "./session-row.ts";
export interface SessionAnswer {
    id: string;
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
    since: number;
    age: ReactNode;
    now?: ReactNode;
    steps?: SessionStep[];
    sampled?: {
        shown: number;
        of: number;
    };
    ask?: {
        question: string;
        command: string;
        answers: SessionAnswer[];
        note?: ReactNode;
        busy?: string;
    };
}
export interface SessionListProps {
    sessions: Session[];
    label?: string;
    labelledBy?: string;
    onAnswer?: (session: string, answer: string) => void;
}
export declare function SessionList({ sessions, label, labelledBy, onAnswer }: SessionListProps): import("react").JSX.Element;
