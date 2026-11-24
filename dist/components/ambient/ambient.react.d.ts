import { type HexOptions } from "./ambient.ts";
export interface AmbientProps extends HexOptions {
    variant: "hex-field" | "blobs" | "equalizer";
    hideOnPhone?: boolean;
}
export declare function Ambient({ variant, count, phoneCount, random, hideOnPhone }: AmbientProps): import("react").JSX.Element;
