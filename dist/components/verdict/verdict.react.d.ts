import type { ReactNode } from "react";
export interface VerdictProblem {
    key: string;
    label: ReactNode;
    tone?: "crit" | "warn";
}
export interface VerdictProps {
    problems: VerdictProblem[];
    okLabel?: string;
    okNote?: ReactNode;
    noun?: [string, string];
    named?: number;
    more?: (rest: number) => ReactNode;
    unknown?: ReactNode;
    className?: string;
}
export declare function Verdict({ problems, okLabel, okNote, noun, named, more, unknown, className, }: VerdictProps): import("react").JSX.Element;
