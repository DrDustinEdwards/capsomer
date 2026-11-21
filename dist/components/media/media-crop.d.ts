export type CropRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export declare const CROP_SHAPES: {
    value: string;
    label: string;
}[];
export declare const CROPPABLE: readonly string[];
export declare function bareType(type: string): string;
export declare function ratioOf(shape: string, width: number, height: number): number | null;
export declare function fitRect(r: CropRect, width: number, height: number, ratio: number | null): CropRect;
export declare function centered(width: number, height: number, ratio: number | null): CropRect;
export declare function cropName(name: string, type: string): string;
export declare function focusPercents(focus: string | null | undefined): {
    x: number;
    y: number;
};
