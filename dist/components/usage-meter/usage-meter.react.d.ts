import type { ReactNode } from "react";
export interface UsageItem {
    id: string;
    name: string;
    amount: string;
    amountSpoken?: string;
    used: number;
    limit: number;
    history: number[];
    resetsAt: number | Date | null;
    unit?: string;
    atLimit?: string;
}
export interface UsageMeterProps {
    items: UsageItem[];
    now?: number | Date;
    freshness?: ReactNode;
    stale?: boolean;
    legend?: boolean;
}
export declare function UsageMeter({ items, now, freshness, stale, legend }: UsageMeterProps): import("react").JSX.Element;
