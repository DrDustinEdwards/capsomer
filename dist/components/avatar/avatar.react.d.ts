import { type ReactNode } from "react";
export interface AvatarProps {
    name: string;
    src?: string;
    fallback?: string;
    size?: "sm" | "default" | "lg";
    shape?: "circle" | "square";
    kind?: "person" | "ai";
    badge?: ReactNode;
    badgeLabel?: string;
    badgeTone?: "ok" | "crit" | "nodata";
}
export declare function Avatar({ name, src, fallback, size, shape, kind, badge, badgeLabel, badgeTone }: AvatarProps): import("react").JSX.Element;
export declare function AvatarGroup({ label, children, extra }: {
    label: string;
    children: ReactNode;
    extra?: number;
}): import("react").JSX.Element;
