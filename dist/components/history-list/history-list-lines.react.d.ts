import type { ReactNode } from "react";
import { type HistoryEntry, type Run } from "./history-list.ts";
interface LineProps {
    entry: HistoryEntry;
    delta: number | undefined;
    prefix: string;
    current: boolean;
    picked: boolean;
    pickDisabled: boolean;
    formId: string;
    now?: number;
    href: (id: string) => string;
    onPick: (id: string, el: HTMLInputElement) => void;
    onRestore: (e: HistoryEntry, opener: HTMLElement) => void;
    loadHref?: (id: string) => string;
    onLoad?: (e: HistoryEntry) => void;
    readOnly?: boolean;
}
export declare function Line({ entry: e, delta, prefix, current, picked, pickDisabled, formId, now, href, onPick, onRestore, loadHref, onLoad, readOnly, }: LineProps): import("react").JSX.Element;
export declare function RunLines({ run, prefix, now, open, onToggle, children, }: {
    run: Run;
    prefix: string;
    now?: number;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
