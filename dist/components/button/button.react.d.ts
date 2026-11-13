import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "style">, Pick<ButtonLook, "variant" | "size"> {
    pending?: boolean;
    pendingLabel?: string;
    wrap?: boolean;
    block?: boolean;
    disabledReason?: ReactNode;
    iconOnly?: boolean;
    label?: string;
    morph?: boolean;
    ref?: Ref<HTMLButtonElement>;
    children?: ReactNode;
}
export interface ButtonLook {
    variant?: "default" | "primary" | "secondary" | "danger" | "quiet" | "link";
    size?: "xs" | "sm" | "default" | "lg";
    iconOnly?: boolean;
    wrap?: boolean;
    block?: boolean;
}
export declare function buttonAttrs(look: ButtonLook & {
    label?: string;
    "aria-label"?: string;
}, className: string | undefined): {
    className: string;
    "data-variant": "link" | "quiet" | "secondary" | "primary" | "danger" | undefined;
    "data-size": "sm" | "lg" | "xs" | undefined;
    "data-icon-only": string | undefined;
    "data-wrap": string | undefined;
    "data-block": string | undefined;
    "aria-label": string | undefined;
};
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
