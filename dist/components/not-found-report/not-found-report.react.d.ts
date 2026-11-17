import type { ReactNode } from "react";
import { type NotFoundRow } from "./not-found-report.ts";
export type { NotFoundRow };
export interface NotFoundReportProps {
    rows: readonly NotFoundRow[];
    days: number;
    windows?: readonly number[];
    onWindow?: (days: number) => void;
    title?: ReactNode;
    src?: ReactNode;
    probes?: number | null;
    reason?: ReactNode;
    loading?: boolean;
    actions?: (row: NotFoundRow) => ReactNode;
    now?: number;
}
export declare function NotFoundReport({ rows, days, windows, onWindow, title, src, probes, reason, loading, actions, now, }: NotFoundReportProps): import("react").JSX.Element;
