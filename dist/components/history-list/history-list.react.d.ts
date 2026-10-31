import { type ReactNode } from "react";
import { type HistoryEntry } from "./history-list.ts";
export type { HistoryEntry, Destination, HistoryKind } from "./history-list.ts";
export interface RestoreEvent {
    source: HistoryEntry;
    entry: HistoryEntry;
}
export interface HistoryListProps {
    entries: HistoryEntry[];
    labelledBy?: string;
    label?: string;
    user: string;
    compareBase?: string;
    versionHref?: (id: string) => string;
    loadHref?: (id: string) => string;
    onLoad?: (entry: HistoryEntry) => void;
    readOnly?: boolean;
    onRestore?: (e: RestoreEvent) => void | Promise<void>;
    onUndoRestore?: (e: RestoreEvent) => void | Promise<void>;
    now?: number;
    olderHref?: string;
    onLoadOlder?: () => void;
    loadingOlder?: boolean;
    primary?: boolean;
    empty?: ReactNode;
}
export declare function HistoryList({ entries, labelledBy, label, user, compareBase, versionHref, loadHref, onLoad, readOnly, onRestore, onUndoRestore, now, olderHref, onLoadOlder, loadingOlder, primary, empty }: HistoryListProps): import("react").JSX.Element;
