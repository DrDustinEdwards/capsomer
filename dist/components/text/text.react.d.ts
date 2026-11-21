import { type ComponentPropsWithRef, type ElementType } from "react";
export type As<T extends ElementType, Own> = Own & {
    as?: T;
} & Omit<ComponentPropsWithRef<T>, keyof Own | "as">;
interface TitleOwn {
    size?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}
interface TextOwn {
    size?: "tiny" | "small" | "lead";
    tone?: "muted" | "dim" | "ink" | "accent" | "ok" | "crit";
    weight?: "strong";
    face?: "ui" | "mono" | "prose" | "display";
    align?: "center" | "end";
    className?: string;
}
export type TitleProps<T extends ElementType = "h2"> = As<T, TitleOwn>;
export type TextProps<T extends ElementType = "p"> = As<T, TextOwn>;
export declare function Title<T extends ElementType = "h2">({ size, as, className, ...rest }: TitleProps<T>): import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
export declare function Text<T extends ElementType = "p">({ size, tone, weight, face, align, as, className, ...rest }: TextProps<T>): import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
export {};
