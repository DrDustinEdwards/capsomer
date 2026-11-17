import type { ReactNode } from "react";
export interface SectionBandProps {
    children: ReactNode;
    cut?: "slant";
    overlap?: boolean;
    id?: string;
    label?: string;
}
export declare function SectionBand({ children, cut, overlap, id, label }: SectionBandProps): import("react").JSX.Element;
