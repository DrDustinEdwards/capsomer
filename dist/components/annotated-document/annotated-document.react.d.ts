import { type ReactNode } from "react";
export interface AnnotatedNote {
    id: string;
    kind: string;
    text: ReactNode;
    tone?: "info" | "ok" | "warn" | "crit";
    icon?: string;
}
export interface AnnotatedDocumentProps {
    children: ReactNode;
    notes: AnnotatedNote[];
    name?: string;
    label?: string;
    views?: {
        original: string;
        edited: string;
        all: string;
    };
    view?: "original" | "edited" | "all";
    docLabel?: string;
    notesLabel?: string;
    hideNotesInOriginal?: boolean;
    viewAlign?: "center" | "end";
    kind?: "tone";
}
export declare function AnnotatedDocument({ children, notes, name, label, views, view, docLabel, notesLabel, hideNotesInOriginal, viewAlign, kind, }: AnnotatedDocumentProps): import("react").JSX.Element;
