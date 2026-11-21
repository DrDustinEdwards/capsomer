import type { ReactNode } from "react";
export interface SplitProps {
    heading: ReactNode;
    headingId: string;
    level?: "h2" | "h3" | "h4";
    flip?: boolean;
    media: ReactNode;
    caption?: ReactNode;
    children: ReactNode;
}
export declare function Split({ heading, headingId, level: H, flip, media, caption, children, }: SplitProps): import("react").JSX.Element;
