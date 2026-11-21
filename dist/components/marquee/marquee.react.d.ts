import type { ReactNode } from "react";
export declare function Marquee({ label, items, direction, }: {
    label: string;
    items: ReactNode[];
    direction?: "reverse";
}): import("react").JSX.Element;
export declare function MarqueePause({ children }: {
    children?: ReactNode;
}): import("react").JSX.Element;
