import { type ReactNode } from "react";
export declare function Carousel({ label, slideLabel, markerLabel, status, prevLabel, nextLabel, perView, peek, loop, children, }: {
    label: string;
    slideLabel?: (n: number, total: number) => string;
    markerLabel?: (n: number) => string;
    status?: string;
    prevLabel?: string;
    nextLabel?: string;
    perView?: 2 | 3;
    peek?: boolean;
    loop?: boolean;
    children: ReactNode;
}): import("react").JSX.Element;
