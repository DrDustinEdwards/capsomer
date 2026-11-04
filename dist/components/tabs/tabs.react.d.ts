import { type ComponentProps, type ReactNode } from "react";
import { type Activation, type Orientation } from "./tabs.ts";
export interface TabsProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue"> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    orientation?: Orientation;
    activation?: Activation;
}
export declare function Tabs({ value, defaultValue, onValueChange, orientation, activation, className, children, ...props }: TabsProps): import("react").JSX.Element;
export interface TabsListProps extends ComponentProps<"div"> {
    "aria-label": string;
    variant?: "default" | "line";
    size?: "sm" | "default" | "lg";
    fill?: boolean;
}
export declare function TabsList({ variant, size, fill, className, onKeyDown, onBlur, children, ...props }: TabsListProps): import("react").JSX.Element;
export interface TabsTriggerProps extends Omit<ComponentProps<"button">, "value"> {
    value: string;
    count?: number;
    disabled?: boolean;
}
export declare function TabsTrigger({ value, count, disabled, className, onClick, children, ...props }: TabsTriggerProps): import("react").JSX.Element;
export declare function TabsContent({ value, className, children, ...props }: ComponentProps<"div"> & {
    value: string;
}): import("react").JSX.Element;
export type RenderTabLink = (props: ComponentProps<"a"> & {
    href: string;
}) => ReactNode;
export interface TabsNavProps extends ComponentProps<"nav"> {
    "aria-label": string;
    variant?: "default" | "line";
    size?: "sm" | "default" | "lg";
    fill?: boolean;
    renderLink?: RenderTabLink;
}
export declare function TabsNav({ variant, size, fill, className, children, renderLink, ...props }: TabsNavProps): import("react").JSX.Element;
export interface TabLinkProps extends Omit<ComponentProps<"a">, "href"> {
    href: string;
    current?: boolean;
    count?: number;
    children: ReactNode;
    renderLink?: RenderTabLink;
}
export declare function TabLink({ current, count, className, children, renderLink, ...props }: TabLinkProps): import("react").JSX.Element;
