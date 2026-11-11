import type { ReactNode } from "react";
export type Tone = "crit" | "warn" | "ok" | "info" | "nodata" | "muted";
export type GlyphName = Tone | "running" | "queued" | "unknown" | "blocked" | "question" | "pr" | "report" | "proposal" | "site-down";
export declare function Glyph({ name, tone }: {
    name: GlyphName;
    tone?: Tone;
}): import("react").JSX.Element;
export interface StatusProps {
    tone: Tone;
    running?: boolean;
    children: ReactNode;
    glyph?: GlyphName;
    reason?: ReactNode;
    brief?: boolean;
    wrap?: boolean;
}
export declare function Status({ tone, running, glyph, children, reason, brief, wrap }: StatusProps): import("react").JSX.Element;
export type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "ghost" | "link" | "accent";
export interface PillProps {
    tone?: Tone;
    variant?: BadgeVariant;
    running?: boolean;
    glyph?: GlyphName;
    series?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    family?: string;
    children: ReactNode;
    href?: string;
    onClick?: () => void;
}
export declare function Pill({ tone, variant, running, glyph, series, family, children, href, onClick, }: PillProps): import("react").JSX.Element;
