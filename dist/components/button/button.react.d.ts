import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { buttonAttrs, type ButtonLook } from "./button-look.ts";
export { buttonAttrs, type ButtonLook };
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
