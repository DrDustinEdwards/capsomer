export type SessionState = "needs" | "failed" | "working" | "idle" | "stopped";
export declare const STATES: Record<SessionState, {
    word: string;
    tone: "warn" | "crit" | "info" | "nodata";
    glyph: "warn" | "crit" | "run" | "none" | "stop";
}>;
export declare function order<T extends {
    state: SessionState;
    since: number;
}>(sessions: readonly T[]): T[];
export declare function spokenCount(count: number): string;
export interface AnswerDetail {
    session: string;
    answer: string;
}
export declare function enhance(root?: ParentNode): () => void;
