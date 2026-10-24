import { type HTMLAttributes, type ReactNode, type Ref } from "react";
export type DialogPlacement = "center" | "right" | "left" | "bottom" | "top";
export type DialogSize = "sm" | "md" | "lg";
export interface DialogProps extends Omit<HTMLAttributes<HTMLDialogElement>, "style" | "onClose" | "role"> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    placement?: DialogPlacement;
    size?: DialogSize;
    alert?: boolean;
    modalLock?: boolean;
    destructive?: boolean;
    busy?: boolean;
    history?: boolean;
    historyId?: string;
    closeButton?: boolean;
    closeLabel?: string;
    returnTo?: HTMLElement | null;
    initialFocus?: {
        current: HTMLElement | null;
    };
    described?: boolean;
    ref?: Ref<HTMLDialogElement>;
    "aria-label"?: string;
    children?: ReactNode;
}
export declare function Dialog(props: DialogProps): import("react").JSX.Element;
export declare function DialogHeader({ className, divider, ...rest }: HTMLAttributes<HTMLDivElement> & {
    divider?: boolean;
}): import("react").JSX.Element;
export declare function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>): import("react").JSX.Element;
export declare function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export declare function DialogMedia({ className, tone, ...rest }: HTMLAttributes<HTMLDivElement> & {
    tone?: "crit" | "warn";
}): import("react").JSX.Element;
export declare function DialogBody({ className, flush, ...rest }: HTMLAttributes<HTMLDivElement> & {
    flush?: boolean;
}): import("react").JSX.Element;
export declare function DialogFooter({ className, align, ...rest }: HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "between";
}): import("react").JSX.Element;
export declare function DialogClose({ label, part, children, className, onClick, ...rest }: Omit<HTMLAttributes<HTMLButtonElement>, "children"> & {
    label?: string;
    part?: "close" | "cancel";
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function useDialog(initial?: boolean): {
    open: boolean;
    show: () => void;
    hide: () => void;
    toggle: () => void;
    props: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
    };
};
