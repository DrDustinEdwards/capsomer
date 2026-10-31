import { type ReactNode } from "react";
export interface DetailPanelProps {
    open: boolean;
    onClose: () => void;
    id: string;
    title: string;
    identifier?: string;
    kind?: string;
    badge?: ReactNode;
    history?: boolean;
    closeLabel?: string;
    children: ReactNode;
}
export declare function DetailPanel({ open, onClose, id, title, identifier, kind, badge, history, closeLabel, children }: DetailPanelProps): import("react").JSX.Element;
export interface DetailSectionProps {
    title: string;
    children: ReactNode;
}
export declare function DetailSection({ title, children }: DetailSectionProps): import("react").JSX.Element;
export declare function DetailCommand({ text, copyLabel, what }: {
    text: string;
    copyLabel?: string;
    what?: string;
}): import("react").JSX.Element;
