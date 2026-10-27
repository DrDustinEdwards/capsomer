import { type ComponentProps, type ReactNode } from "react";
import { type Align, type Side } from "./popover.ts";
type Kind = "dialog" | "tooltip";
export interface PopoverProps {
    kind?: Kind;
    children: ReactNode;
}
export declare function Popover({ kind, children }: PopoverProps): import("react").JSX.Element;
export declare function PopoverTrigger({ className, type, ...props }: ComponentProps<"button">): import("react").JSX.Element;
export interface PopoverContentProps extends Omit<ComponentProps<"div">, "popover"> {
    side?: Side;
    align?: Align;
    offset?: number;
    size?: "sm" | "md" | "lg" | "auto";
    arrow?: boolean;
}
export declare function PopoverContent({ side, align, offset, size, arrow, className, children, ...props }: PopoverContentProps): import("react").JSX.Element;
export declare function PopoverHeader({ className, ...props }: ComponentProps<"div">): import("react").JSX.Element;
export declare function PopoverTitle({ className, ...props }: ComponentProps<"h2">): import("react").JSX.Element;
export declare function PopoverDescription({ className, ...props }: ComponentProps<"p">): import("react").JSX.Element;
export {};
