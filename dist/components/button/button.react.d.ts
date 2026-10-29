import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "style"> {
    variant?: "default" | "primary" | "secondary" | "danger" | "quiet" | "link";
    size?: "xs" | "sm" | "default" | "lg";
    pending?: boolean;
    disabledReason?: ReactNode;
    iconOnly?: boolean;
    label?: string;
    morph?: boolean;
    ref?: Ref<HTMLButtonElement>;
    children?: ReactNode;
}
export declare function Button(props: ButtonProps): import("react").JSX.Element;
export declare function ButtonGroup(props: {
    label?: string;
    orientation?: "horizontal" | "vertical";
    children?: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function ButtonGroupText(props: {
    children?: ReactNode;
}): import("react").JSX.Element;
