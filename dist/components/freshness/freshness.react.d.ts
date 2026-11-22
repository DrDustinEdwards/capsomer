import type { ReactNode } from "react";
export interface FreshnessProps {
    updated?: ReactNode;
    more?: ReactNode;
    share?: number;
    stale?: boolean;
    staleLabel?: ReactNode;
    title?: string;
    pending?: ReactNode;
}
export declare function Freshness({ updated, more, share, stale, staleLabel, title, pending, }: FreshnessProps): import("react").JSX.Element;
export declare function FreshRing({ share }: {
    share: number;
}): import("react").JSX.Element;
