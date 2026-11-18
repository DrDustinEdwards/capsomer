import { type ReactNode } from "react";
export interface MediaPick {
    url: string;
    alt: string;
    caption: string;
}
export interface PickerWords {
    label: string;
    title: string;
    lead: string;
}
export declare const INSERT_WORDS: PickerWords;
export interface MediaPickerProps {
    endpoint: string;
    library?: string;
    onPick: (pick: MediaPick) => void;
    words?: PickerWords;
    variant?: "quiet" | "default";
}
export declare function MediaPicker({ endpoint, library, onPick, words, variant, }: MediaPickerProps): import("react").JSX.Element;
export interface ImageFieldProps {
    label: string;
    value: string;
    src?: string;
    alt?: string;
    none?: string;
    picker?: Omit<MediaPickerProps, "onPick" | "words" | "variant"> & {
        words?: PickerWords;
    };
    onPick?: (pick: MediaPick) => void;
    onRemove?: () => void;
    locked?: boolean;
    ratio?: string;
    children?: ReactNode;
}
export declare function ImageField({ label, value, src, alt, none, picker, onPick, onRemove, locked, ratio, children, }: ImageFieldProps): import("react").JSX.Element;
