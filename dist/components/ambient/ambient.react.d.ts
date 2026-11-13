import { type HexOptions } from "./ambient.ts";
export interface AmbientProps extends HexOptions {
    variant: "hex-field" | "blobs" | "equalizer";
}
export declare function Ambient({ variant, count, phoneCount, random }: AmbientProps): import("react").JSX.Element;
