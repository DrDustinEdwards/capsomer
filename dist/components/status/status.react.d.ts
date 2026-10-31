import type { ReactNode } from "react";
export type Tone = "crit" | "warn" | "ok" | "info" | "nodata";
export type GlyphName = Tone | "running";
export declare function Glyph({ name }: {
    name: GlyphName;
}): import("react").JSX.Element;
export interface StatusProps {
    tone: Tone;
    running?: boolean;
    children: ReactNode;
    reason?: ReactNode;
    brief?: boolean;
}
export declare function Status({ tone, running, children, reason, brief }: StatusProps): import("react").JSX.Element;
export type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";
export interface PillProps {
    tone?: Tone;
    variant?: BadgeVariant;
    running?: boolean;
    children: ReactNode;
    href?: string;
    onClick?: () => void;
}
export declare function Pill({ tone, variant, running, children, href, onClick }: PillProps): import("react").JSX.Element;
export declare const Badge: typeof Pill;
