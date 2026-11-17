import type { ReactNode } from "react";
export interface LikeButtonProps {
    liked: boolean;
    count: number;
    onChange?: (liked: boolean) => void;
    label?: string;
    pending?: boolean;
    disabled?: boolean;
    error?: ReactNode;
}
export declare function LikeButton({ liked, count, onChange, label, pending, disabled, error, }: LikeButtonProps): import("react").JSX.Element;
