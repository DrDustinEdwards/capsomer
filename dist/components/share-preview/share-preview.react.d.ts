import type { ReactNode } from "react";
import { type SerpPart } from "./share-preview.ts";
export interface SerpPreviewProps {
    url: string;
    title: ReactNode;
    description: ReactNode;
    note?: ReactNode;
    label?: string;
}
export interface OgCardPreviewProps {
    image: ReactNode;
    host: string;
    title: ReactNode;
    description?: ReactNode;
    note?: ReactNode;
    label?: string;
}
export declare function SerpPreview({ url, title, description, note, label, }: SerpPreviewProps): import("react").JSX.Element;
export declare function OgCardPreview({ image, host, title, description, note, label, }: OgCardPreviewProps): import("react").JSX.Element;
export interface SerpWidthMeterProps {
    label: ReactNode;
    text: string;
    part?: SerpPart;
    limit?: number;
    measure?: (text: string) => number | null;
    size?: "sm" | "md" | "lg";
}
export declare function SerpWidthMeter({ label, text, part, limit, measure, size, }: SerpWidthMeterProps): import("react").JSX.Element;
