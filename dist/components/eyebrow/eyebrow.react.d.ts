import type { ReactNode } from "react";
export interface EyebrowProps {
    children: ReactNode;
    variant?: "mono";
    tone?: "muted" | "accent" | "text";
    as?: "p" | "span" | "h2" | "h3" | "div";
    id?: string;
}
export declare function Eyebrow({ children, variant, tone, as: Tag, id }: EyebrowProps): import("react").JSX.Element;
