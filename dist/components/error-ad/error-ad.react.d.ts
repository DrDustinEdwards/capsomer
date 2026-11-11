import { type Ad } from "./error-ad.ts";
export interface ErrorAdProps {
    ad: Ad & {
        art: string;
    };
    size?: "corner" | "large";
    stylesheet?: string;
    fonts?: string[];
}
export declare function ErrorAd({ ad, size, stylesheet, fonts }: ErrorAdProps): import("react").JSX.Element;
