import type { ReactNode } from "react";
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
export declare function SerpPreview({ url, title, description, note, label }: SerpPreviewProps): import("react").JSX.Element;
export declare function OgCardPreview({ image, host, title, description, note, label }: OgCardPreviewProps): import("react").JSX.Element;
