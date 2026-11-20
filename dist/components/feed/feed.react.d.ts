import { type ReactNode } from "react";
export type FeedTone = "ok" | "warn" | "crit" | "info" | "nodata";
export interface FeedEvent {
    id: string;
    kind?: "event" | "condensed" | "marker";
    tone: FeedTone;
    what: ReactNode;
    detail?: ReactNode;
    when: ReactNode;
    at: string;
    until?: {
        when: ReactNode;
        at: string;
    };
    href?: string;
    about?: string;
}
export interface FeedDay {
    id: string;
    label: string;
    events: FeedEvent[];
}
export interface FeedProps {
    days: FeedDay[];
    headingLevel?: 2 | 3 | 4 | 5 | 6;
}
export declare function Feed({ days, headingLevel }: FeedProps): import("react").JSX.Element;
