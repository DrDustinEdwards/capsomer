import { type ReactNode } from "react";
export declare const RATING_MAX = 5;
export declare function toHalves(value: number): number;
export declare function ratingWords(value: number): string;
export interface RatingProps {
    value: number;
    children?: ReactNode;
    size?: "sm" | "default" | "lg";
    className?: string;
}
export declare function Rating({ value, children, size, className }: RatingProps): import("react").JSX.Element;
export interface RatingInputProps {
    name: string;
    label: string;
    defaultValue?: number;
    value?: number;
    onChange?: (value: number) => void;
    noneLabel?: string;
    whole?: boolean;
    id?: string;
}
export declare function ratingChoices(whole?: boolean): number[];
export declare function RatingInput(props: RatingInputProps): import("react").JSX.Element;
