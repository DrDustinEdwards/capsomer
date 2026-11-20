import { type ReactNode } from "react";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type Goal, type SaveEntry } from "./writing-progress.ts";
export type { FormComponent, Goal, SaveEntry };
export interface WritingProgressProps {
    entries: SaveEntry[];
    goal: Goal;
    projectTarget: number | null;
    deadline: string;
    wordsNow: number;
    zone: string;
    canEdit: boolean;
    action?: string;
    Form?: FormComponent;
    error?: string | null;
    saved?: boolean;
    goalNote?: ReactNode;
    note?: ReactNode;
    source?: string;
    title?: ReactNode;
    days?: number;
    now?: Date;
}
export declare function WritingProgress({ entries, goal, projectTarget, deadline, wordsNow, zone: serverZone, canEdit, action, Form, error, saved, goalNote, note, source, title, days: dayCount, now: fixedNow, }: WritingProgressProps): import("react").JSX.Element;
