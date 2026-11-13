import { type ReactNode } from "react";
export interface AttachedFile {
    id: string;
    name: string;
    href?: string;
    meta?: ReactNode;
}
export interface FileAttachProps {
    files: AttachedFile[];
    label?: string;
    pending?: boolean;
    pendingLabel?: string;
    accept?: string;
    maxBytes?: number;
    maxFiles?: number;
    name?: string;
    form?: string;
    onFiles?: (files: File[], input: HTMLInputElement) => void;
    error?: ReactNode;
    unavailable?: ReactNode;
    renderRemove?: (file: AttachedFile) => ReactNode;
    emptyText?: ReactNode;
    newTabText?: string;
}
export declare function FileAttach({ files, label, pending, pendingLabel, accept, maxBytes, maxFiles, name, form, onFiles, error, unavailable, renderRemove, emptyText, newTabText, }: FileAttachProps): import("react").JSX.Element;
